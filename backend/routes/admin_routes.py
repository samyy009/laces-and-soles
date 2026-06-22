import os
import json

import random
import logging
import zipfile
import shutil
from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
from extensions import db, socketio
from models import User, Product, Order, OrderItem, Coupon
from sqlalchemy.orm import joinedload, subqueryload

logger = logging.getLogger(__name__)
admin_bp = Blueprint('admin', __name__)

UPLOAD_FOLDER = 'uploads'

def detect_brand_and_title(filename):
    """Simple heuristic to detect brand/title from filename."""
    brand = 'Unknown'
    title = filename.replace('_', ' ').replace('-', ' ').split('.')[0]
    
    brands = ['Nike', 'Adidas', 'Jordan', 'Puma', 'New Balance', 'Yeezy', 'Converse', 'Vans', 'Asics', 'Reebok']
    for b in brands:
        if b.lower() in filename.lower():
            brand = b
            # Remove brand from title if it's there
            title = title.lower().replace(b.lower(), '').strip().title()
            break
    return brand, title

@admin_bp.route('/api/admin/metrics', methods=['GET'])
@jwt_required()
def get_metrics():
    user = db.session.get(User, int(get_jwt_identity()))
    if not user or user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
    
    period = request.args.get('period', '7d')
    total_revenue = db.session.query(db.func.sum(Order.total_amount)).scalar() or 0.0
    
    # 1. Revenue Chart Data
    daily_stats = []
    now = datetime.now()
    if period == '7d':
        start_date = (now - timedelta(days=6)).date()
        results = db.session.query(
            db.func.date(Order.created_at).label('order_date'),
            db.func.sum(Order.total_amount).label('rev')
        ).filter(db.func.date(Order.created_at) >= start_date).group_by(db.func.date(Order.created_at)).all()
        
        rev_map_str = {}
        for r in results:
            if r.order_date is not None:
                k = r.order_date.strftime('%Y-%m-%d') if not isinstance(r.order_date, str) else r.order_date
                rev_map_str[k] = r.rev
                
        for i in range(6, -1, -1):
            day = now - timedelta(days=i)
            day_str = day.strftime('%a')
            day_key = day.strftime('%Y-%m-%d')
            rev = rev_map_str.get(day_key, 0.0) or 0.0
            daily_stats.append({'name': day_str, 'revenue': float(rev)})
    elif period == '6m':
        start_date = (now.replace(day=1) - timedelta(days=5*30)).replace(day=1).date()
        results = db.session.query(
            db.func.extract('month', Order.created_at).label('m'),
            db.func.extract('year', Order.created_at).label('y'),
            db.func.sum(Order.total_amount).label('rev')
        ).filter(db.func.date(Order.created_at) >= start_date).group_by(
            db.func.extract('year', Order.created_at),
            db.func.extract('month', Order.created_at)
        ).all()
        
        rev_map = {(int(r.y), int(r.m)): r.rev for r in results if r.y is not None and r.m is not None}
        for i in range(5, -1, -1):
            m_idx = now.month - i
            y_offset = 0
            while m_idx <= 0:
                m_idx += 12
                y_offset += 1
            target_year = now.year - y_offset
            target_month = m_idx
            target_dt = datetime(target_year, target_month, 1)
            month_str = target_dt.strftime('%b')
            rev = rev_map.get((target_year, target_month), 0.0) or 0.0
            daily_stats.append({'name': month_str, 'revenue': float(rev)})

    # 2. Top Selling Products
    top_products = db.session.query(
        Product.title, 
        db.func.sum(OrderItem.quantity).label('total_sold')
    ).join(OrderItem).group_by(Product.id).order_by(db.text('total_sold DESC')).limit(5).all()
    
    top_selling_data = [{'name': p.title, 'value': int(p.total_sold)} for p in top_products]

    # 3. Category Distribution
    categories = db.session.query(
        Product.category, 
        db.func.count(Order.id)
    ).join(OrderItem, Product.id == OrderItem.product_id)\
     .join(Order, OrderItem.order_id == Order.id)\
     .group_by(Product.category).all()
    
    category_data = [{'name': cat.capitalize(), 'value': count} for cat, count in categories]

    # 4. Recent Activity Feed
    recent_orders = Order.query.options(joinedload(Order.customer)).order_by(Order.created_at.desc()).limit(5).all()
    activity_feed = [{
        'id': o.id,
        'customer': o.customer.full_name if o.customer else 'Guest',
        'amount': o.total_amount,
        'status': o.status,
        'time': o.created_at.strftime('%I:%M %p')
    } for o in recent_orders]

    return jsonify({
        'total_users': User.query.count(),
        'total_products': Product.query.count(),
        'total_orders': Order.query.count(),
        'total_revenue': float(total_revenue),
        'chart_data': daily_stats,
        'top_selling': top_selling_data,
        'category_distribution': category_data,
        'recent_activity': activity_feed
    }), 200

@admin_bp.route('/api/admin/orders', methods=['GET'])
@jwt_required()
def get_admin_orders():
    user = db.session.get(User, int(get_jwt_identity()))
    if not user or user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
    orders = Order.query.options(
        joinedload(Order.customer),
        joinedload(Order.driver),
        subqueryload(Order.items).joinedload(OrderItem.product)
    ).order_by(Order.created_at.desc()).all()
    return jsonify({'orders': [o.to_dict() for o in orders]}), 200

@admin_bp.route('/api/admin/orders/flash-approve', methods=['POST'])
@jwt_required()
def flash_approve_orders():
    user = db.session.get(User, int(get_jwt_identity()))
    if not user or user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
    
    pending_orders = Order.query.filter(
        Order.status.in_(['Pending', 'Processing', 'Packed', 'Out for Delivery']),
        Order.driver_id.is_(None)
    ).all()
    if not pending_orders:
        return jsonify({'message': 'No unassigned orders to approve.'}), 200
    
    available_drivers = User.query.filter_by(role='driver').all()
    if not available_drivers:
        return jsonify({'error': 'No drivers found'}), 400
    
    count = 0
    driver_index = 0
    num_drivers = len(available_drivers)
    
    # Pre-load Hubli locations to resolve area names to pincodes
    locations_path = os.path.join(os.path.dirname(__file__), '../../frontend/src/hubli_locations.json')
    try:
        with open(locations_path, 'r') as f:
            hubli_locations = json.load(f)
        area_to_pincode = {loc['location'].lower(): loc['pincode'] for loc in hubli_locations}
    except Exception:
        area_to_pincode = {}
    
    for order in pending_orders:
        if order.status in ['Pending', 'Processing', 'Packed']:
            order.status = 'Out for Delivery'
        assigned_driver = None
        
        # Determine distance bracket: short (<2.0), mid (2.0-5.0), long (>=5.0)
        dist = order.distance_km or 1.0  # default fallback distance
        if dist < 2.0:
            target_range = 'short'
        elif dist < 5.0:
            target_range = 'mid'
        else:
            target_range = 'long'
            
        # 1. Filter drivers by their range
        range_drivers = [d for d in available_drivers if d.driver_range == target_range]
        
        order_pincode = order.pincode.strip().lower() if order.pincode else ""
        
        if range_drivers and order_pincode:
            # 2. Try to find a driver in range whose pincodes/zones cover the order
            for d in range_drivers:
                if d.delivery_zones:
                    driver_zones = [z.strip().lower() for z in d.delivery_zones.split(',')]
                    resolved_pincodes = [area_to_pincode.get(z) for z in driver_zones if area_to_pincode.get(z)]
                    if order_pincode in driver_zones or order_pincode in resolved_pincodes:
                        assigned_driver = d
                        break
            if not assigned_driver:
                # Fallback: assign to first driver in range
                assigned_driver = range_drivers[driver_index % len(range_drivers)]
                driver_index += 1
                
        # 3. Fallback: match by pincode across all drivers if no driver matched in bracket
        if not assigned_driver and order_pincode:
            for d in available_drivers:
                if d.delivery_zones:
                    driver_zones = [z.strip().lower() for z in d.delivery_zones.split(',')]
                    resolved_pincodes = [area_to_pincode.get(z) for z in driver_zones if area_to_pincode.get(z)]
                    if order_pincode in driver_zones or order_pincode in resolved_pincodes:
                        assigned_driver = d
                        break
                        
        # 4. Final Fallback: Round robin across all available drivers
        if not assigned_driver:
            assigned_driver = available_drivers[driver_index % num_drivers]
            driver_index += 1
            
        order.driver_id = assigned_driver.id
        count += 1
        socketio.emit('status_updated', {'order_id': order.id, 'status': order.status, 'tracking_id': order.tracking_id})

    db.session.commit()
    return jsonify({'message': f'Flash Speed Success! {count} orders distributed.'}), 200

@admin_bp.route('/api/admin/bulk-import', methods=['POST'])
@jwt_required()
def bulk_import():
    user = db.session.get(User, int(get_jwt_identity()))
    if not user or user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403

    base_price = float(request.form.get('basePrice', 2499))
    randomize = request.form.get('randomize') == 'true'
    category = request.form.get('category', 'men')
    collection = request.form.get('collection', 'urban-explorer')
    files = request.files.getlist('files')

    if not files:
        return jsonify({'error': 'No data payload received.'}), 400

    temp_dir = os.path.join(UPLOAD_FOLDER, 'temp_bulk_extraction')
    if os.path.exists(temp_dir):
        shutil.rmtree(temp_dir)

    os.makedirs(temp_dir)

    imported_count = 0
    errors = []

    try:
        for f in files:
            if f.filename.lower().endswith('.zip'):
                zip_path = os.path.join(temp_dir, secure_filename(f.filename))
                f.save(zip_path)
                with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                    valid_members = [m for m in zip_ref.namelist() if not m.startswith('__') and not '/.' in m]
                    zip_ref.extractall(temp_dir, members=valid_members)
                os.remove(zip_path)
            elif f.filename.lower().endswith(('.png', '.jpg', '.jpeg')):
                f.save(os.path.join(temp_dir, secure_filename(f.filename)))

        product_groups = {}
        for root, dirs, filenames in os.walk(temp_dir):
            image_files = [fn for fn in filenames if fn.lower().endswith(('.png', '.jpg', '.jpeg'))]
            if image_files:
                product_groups[root] = sorted(image_files)

        for folder_path, images in product_groups.items():
            try:
                folder_name = os.path.basename(folder_path)
                parent_folder = os.path.basename(os.path.dirname(folder_path))
                is_flat = (folder_path == temp_dir)
                target_name = folder_name if not is_flat else images[0]
                brand, title = detect_brand_and_title(target_name)
                
                inferred_type = 'sneakers'
                if not is_flat and parent_folder and parent_folder != 'temp_bulk_extraction':
                    inferred_type = parent_folder.replace('_', ' ').replace('-', ' ').strip()

                saved_urls = []
                for img_name in images:
                    src_path = os.path.join(folder_path, img_name)
                    unique_name = f"bulk_{int(datetime.now().timestamp())}_{random.randint(100,999)}_{secure_filename(img_name)}"
                    dest_path = os.path.join(UPLOAD_FOLDER, unique_name)
                    shutil.move(src_path, dest_path)
                    saved_urls.append(f"http://localhost:5000/uploads/{unique_name}")

                if not saved_urls: continue
                final_price = base_price
                if randomize:
                    final_price = base_price + random.randint(-500, 1500)
                    if final_price < 999:
                        final_price = 1299


                main_image = saved_urls[0]
                for url in saved_urls:
                    if 'side' in url.lower():
                        main_image = url
                        break

                new_p = Product( # type: ignore[call-arg]
                    title=title, price=float(final_price), old_price=final_price + 2000,  # type: ignore[call-arg]
                    brand=brand, image_url=main_image, gallery=",".join(saved_urls),  # type: ignore[call-arg]
                    category=category, type=inferred_type, collection=collection,  # type: ignore[call-arg]
                    stock=random.randint(10, 80),  # type: ignore[call-arg]
                    description=f"Premium {brand} {title} performance footwear."  # type: ignore[call-arg]
                )
                db.session.add(new_p)
                imported_count += 1
            except Exception as e:
                errors.append(f"Group {os.path.basename(folder_path)} failed: {str(e)}")

        db.session.commit()
    except Exception as e:
        return jsonify({'error': f"System failure: {str(e)}"}), 500
    finally:
        if os.path.exists(temp_dir): shutil.rmtree(temp_dir)

    return jsonify({'message': 'Import Complete!', 'count': imported_count, 'errors': errors}), 201

@admin_bp.route('/api/admin/users', methods=['GET'])
@jwt_required()
def get_all_users():
    user = db.session.get(User, int(get_jwt_identity()))
    if not user or user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
    users = User.query.filter(~User.role.in_(['deleted_user', 'deleted_driver'])).all()
    return jsonify({'users': [u.to_dict() for u in users]}), 200

@admin_bp.route('/api/admin/users/<int:user_id>', methods=['PATCH'])
@jwt_required()
def update_user_details(user_id):
    user = db.session.get(User, int(get_jwt_identity()))
    if not user or user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
    target_user = db.session.get(User, user_id)
    if not target_user: return jsonify({'error': 'User not found'}), 404
    data = request.get_json()
    if 'delivery_zones' in data: target_user.delivery_zones = data.get('delivery_zones')
    if 'role' in data: target_user.role = data.get('role')
    db.session.commit()
    return jsonify({'message': 'User updated', 'user': target_user.to_dict()}), 200

@admin_bp.route('/api/admin/users/<int:user_id>', methods=['DELETE'])
@jwt_required()
def delete_user(user_id):
    user = db.session.get(User, int(get_jwt_identity()))
    if not user or user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
    target_user = db.session.get(User, user_id)
    if not target_user: return jsonify({'error': 'User not found'}), 404
    if target_user.id == user.id:
        return jsonify({'error': 'You cannot delete your own admin account'}), 400
    try:
        from models import CartItem, WishlistItem, Review
        # Delete cart items
        CartItem.query.filter_by(user_id=user_id).delete()
        # Delete wishlist items
        WishlistItem.query.filter_by(user_id=user_id).delete()
        # Delete reviews
        Review.query.filter_by(user_id=user_id).delete()
        
        # Check if the user has any order history (as a customer or as a driver)
        has_assigned_orders = Order.query.filter((Order.user_id == user_id) | (Order.driver_id == user_id)).first() is not None
        
        if has_assigned_orders:
            # Soft delete to preserve order history references
            if target_user.role == 'driver':
                target_user.role = 'deleted_driver'
            else:
                target_user.role = 'deleted_user'
                
            # For active/non-delivered orders assigned to this driver, unassign them
            Order.query.filter(
                Order.driver_id == user_id, 
                ~Order.status.in_(['Delivered', 'Returned', 'Cancelled', 'Cancelled - Refund Initiated'])
            ).update({"driver_id": None}, synchronize_session=False)
            
            db.session.commit()
            return jsonify({'message': 'User soft-deleted successfully to preserve order history'}), 200
        else:
            # Hard delete if no order associations exist
            db.session.delete(target_user)
            db.session.commit()
            return jsonify({'message': 'User deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@admin_bp.route('/api/admin/orders/<int:order_id>/assign', methods=['POST'])
@jwt_required()
def assign_driver(order_id):
    user = db.session.get(User, int(get_jwt_identity()))
    if not user or user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
    order = db.session.get(Order, order_id)
    if not order: return jsonify({'error': 'Order not found'}), 404
    driver_id = request.get_json().get('driver_id')
    order.driver_id = int(driver_id) if driver_id else None
    order.status = 'Packed'
    db.session.commit()
    return jsonify({'message': 'Driver assigned', 'order': order.to_dict()}), 200

@admin_bp.route('/api/admin/drivers', methods=['GET'])
@jwt_required()
def get_drivers():
    user = db.session.get(User, int(get_jwt_identity()))
    if not user or user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
    drivers = User.query.filter_by(role='driver').all()
    return jsonify({'drivers': [d.to_dict() for d in drivers]}), 200

@admin_bp.route('/api/products', methods=['POST'])
@jwt_required()
def add_product():
    user = db.session.get(User, int(get_jwt_identity()))
    if not user or user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
    
    title = request.form.get('title')
    price = request.form.get('price')
    brand = request.form.get('brand')
    image_file = request.files.get('image')

    if not all([title, price, brand, image_file]):
        return jsonify({'error': 'Missing required fields'}), 400
    
    try:
        filename = secure_filename(image_file.filename)
        filename = f"{int(datetime.now().timestamp())}_{filename}"
        image_path = os.path.join(UPLOAD_FOLDER, filename)
        image_file.save(image_path)
        image_url = f"http://localhost:5000/uploads/{filename}"

        new_p = Product( # type: ignore[call-arg]
            title=title, price=float(price), brand=brand,  # type: ignore[call-arg]
            image_url=image_url, badge=request.form.get('badge')  # type: ignore[call-arg]
        )
        db.session.add(new_p)
        db.session.commit()
        return jsonify({'message': 'Product added', 'product': new_p.to_dict()}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/api/products/<int:product_id>', methods=['DELETE'])
@jwt_required()
def delete_product(product_id):
    user = db.session.get(User, int(get_jwt_identity()))
    if not user or user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
    
    product = db.session.get(Product, product_id)
    if not product:
        return jsonify({'error': 'Product not found'}), 404

    
    try:
        db.session.delete(product)
        db.session.commit()
        return jsonify({'message': 'Product deleted'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/api/products/<int:product_id>', methods=['PUT', 'PATCH'])
@jwt_required()
def update_product(product_id):
    user = db.session.get(User, int(get_jwt_identity()))
    if not user or user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
    
    product = db.session.get(Product, product_id)
    if not product:
        return jsonify({'error': 'Product not found'}), 404
        
    try:
        # Check if it's form data (with image) or JSON data
        if request.is_json:
            data = request.get_json()
            if 'title' in data: product.title = data['title']
            if 'price' in data: product.price = float(data['price'])
            if 'brand' in data: product.brand = data['brand']
            if 'image_url' in data: product.image_url = data['image_url']
            if 'stock' in data: product.stock = int(data['stock'])
        else:
            title = request.form.get('title')
            price = request.form.get('price')
            brand = request.form.get('brand')
            image_file = request.files.get('image')
            
            if title: product.title = title
            if price: product.price = float(price)
            if brand: product.brand = brand
            
            if image_file:
                filename = secure_filename(image_file.filename)
                filename = f"{int(datetime.now().timestamp())}_{filename}"
                image_path = os.path.join(UPLOAD_FOLDER, filename)
                image_file.save(image_path)
                product.image_url = f"http://localhost:5000/uploads/{filename}"

        db.session.commit()
        return jsonify({'message': 'Product updated successfully', 'product': product.to_dict()}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/api/admin/coupons', methods=['GET', 'POST'])
@jwt_required()
def manage_coupons():
    user = db.session.get(User, int(get_jwt_identity()))
    if not user or user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403

    if request.method == 'POST':
        data = request.json
        code = data.get('code', '').strip().upper()
        discount = data.get('discount_percentage')
        
        if not code or not discount:
            return jsonify({'error': 'Missing code or discount'}), 400
            
        if Coupon.query.filter_by(code=code).first():
            return jsonify({'error': 'Coupon already exists'}), 400
            
        new_coupon = Coupon(code=code, discount_percentage=float(discount), is_active=True) # type: ignore[call-arg]
        db.session.add(new_coupon)
        db.session.commit()
        return jsonify({'message': 'Coupon created', 'coupon': new_coupon.to_dict()}), 201

    coupons = Coupon.query.order_by(Coupon.id.desc()).all()
    return jsonify({'coupons': [c.to_dict() for c in coupons]}), 200

@admin_bp.route('/api/admin/coupons/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_coupon(id):
    user = db.session.get(User, int(get_jwt_identity()))
    if not user or user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
        
    coupon = db.session.get(Coupon, id)
    if not coupon:
        return jsonify({'error': 'Coupon not found'}), 404
        
    db.session.delete(coupon)
    db.session.commit()
    return jsonify({'message': 'Coupon deleted'}), 200

@admin_bp.route('/api/admin/orders/<int:id>/approve-return', methods=['POST'])
@jwt_required()
def approve_return(id):
    user = db.session.get(User, int(get_jwt_identity()))
    if not user or user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
        
    order = db.session.get(Order, id)
    if not order:
        return jsonify({'error': 'Order not found'}), 404
        
    if order.status != 'Return Requested':
        return jsonify({'error': 'Order is not pending a return request'}), 400
        
    order.status = 'Returned'
    
    # Restock the items
    for item in order.items:
        Product.query.filter_by(id=item.product_id).update({"stock": Product.stock + item.quantity})
        updated_product = db.session.get(Product, item.product_id)
        socketio.emit('inventory_updated', {'product_id': item.product_id, 'new_stock': updated_product.stock})
        
    db.session.commit()
    return jsonify({'message': 'Return approved and items restocked successfully.'}), 200

from models import NewsletterSubscriber
from services.email_service import send_marketing_email

@admin_bp.route('/api/admin/subscribers', methods=['GET'])
@jwt_required()
def get_subscribers():
    user = db.session.get(User, int(get_jwt_identity()))
    if not user or user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
    subs = NewsletterSubscriber.query.order_by(NewsletterSubscriber.created_at.desc()).all()
    return jsonify({'subscribers': [s.to_dict() for s in subs]}), 200

@admin_bp.route('/api/admin/subscribers/blast', methods=['POST'])
@jwt_required()
def send_newsletter_blast():
    user = db.session.get(User, int(get_jwt_identity()))
    if not user or user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
    data = request.get_json()
    subject = data.get('subject')
    message = data.get('message')
    if not subject or not message:
        return jsonify({'error': 'Subject and message are required.'}), 400
    
    subs = NewsletterSubscriber.query.all()
    count = 0
    for s in subs:
        if send_marketing_email(s.email, subject, message):
            count += 1
            
    return jsonify({'message': f'Newsletter blast sent to {count} subscribers.'}), 200


# ── Email Logs ──────────────────────────────────────────────────────────────
from models import EmailLog

@admin_bp.route('/api/admin/email-logs', methods=['GET'])
@jwt_required()
def get_email_logs():
    """Returns paginated email send history — newest first."""
    user = db.session.get(User, int(get_jwt_identity()))
    if not user or user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403

    page     = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 50, type=int)
    email_type = request.args.get('type')   # optional filter: otp|order|delivery_otp|newsletter
    status     = request.args.get('status') # optional filter: sent|failed

    q = EmailLog.query.order_by(EmailLog.created_at.desc())
    if email_type:
        q = q.filter_by(email_type=email_type)
    if status:
        q = q.filter_by(status=status)

    total = q.count()
    logs  = q.offset((page - 1) * per_page).limit(per_page).all()

    return jsonify({
        'logs': [l.to_dict() for l in logs],
        'total': total,
        'page': page,
        'per_page': per_page,
        'pages': (total + per_page - 1) // per_page
    }), 200


@admin_bp.route('/api/admin/email-stats', methods=['GET'])
@jwt_required()
def get_email_stats():
    """Returns aggregate counts for email dashboard cards."""
    user = db.session.get(User, int(get_jwt_identity()))
    if not user or user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403

    results = db.session.query(
        EmailLog.email_type,
        EmailLog.status,
        db.func.count(EmailLog.id)
    ).group_by(EmailLog.email_type, EmailLog.status).all()

    by_type = {t: {'sent': 0, 'failed': 0} for t in ['otp', 'order', 'delivery_otp', 'newsletter']}
    total_sent = 0
    total_failed = 0
    for etype, estatus, count in results:
        if estatus == 'sent':
            total_sent += count
        elif estatus == 'failed':
            total_failed += count
        if etype in by_type and estatus in ['sent', 'failed']:
            by_type[etype][estatus] = count

    return jsonify({
        'total_sent': total_sent,
        'total_failed': total_failed,
        'by_type': by_type
    }), 200


@admin_bp.route('/api/admin/dashboard-all', methods=['GET'])
@jwt_required()
def get_dashboard_all():
    user = db.session.get(User, int(get_jwt_identity()))
    if not user or user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
        
    period = request.args.get('period', '7d')
    
    # 1. Metrics (optimized chart queries)
    total_users = User.query.count()
    total_products = Product.query.count()
    total_orders = Order.query.count()
    total_revenue = db.session.query(db.func.sum(Order.total_amount)).scalar() or 0.0
    
    # Chart Data
    daily_stats = []
    now = datetime.now()
    if period == '7d':
        start_date = (now - timedelta(days=6)).date()
        results = db.session.query(
            db.func.date(Order.created_at).label('order_date'),
            db.func.sum(Order.total_amount).label('rev')
        ).filter(db.func.date(Order.created_at) >= start_date).group_by(db.func.date(Order.created_at)).all()
        
        rev_map_str = {}
        for r in results:
            if r.order_date is not None:
                k = r.order_date.strftime('%Y-%m-%d') if not isinstance(r.order_date, str) else r.order_date
                rev_map_str[k] = r.rev
                
        for i in range(6, -1, -1):
            day = now - timedelta(days=i)
            day_str = day.strftime('%a')
            day_key = day.strftime('%Y-%m-%d')
            rev = rev_map_str.get(day_key, 0.0) or 0.0
            daily_stats.append({'name': day_str, 'revenue': float(rev)})
    else: # 6m
        start_date = (now.replace(day=1) - timedelta(days=5*30)).replace(day=1).date()
        results = db.session.query(
            db.func.extract('month', Order.created_at).label('m'),
            db.func.extract('year', Order.created_at).label('y'),
            db.func.sum(Order.total_amount).label('rev')
        ).filter(db.func.date(Order.created_at) >= start_date).group_by(
            db.func.extract('year', Order.created_at),
            db.func.extract('month', Order.created_at)
        ).all()
        
        rev_map = {(int(r.y), int(r.m)): r.rev for r in results if r.y is not None and r.m is not None}
        for i in range(5, -1, -1):
            m_idx = now.month - i
            y_offset = 0
            while m_idx <= 0:
                m_idx += 12
                y_offset += 1
            target_year = now.year - y_offset
            target_month = m_idx
            target_dt = datetime(target_year, target_month, 1)
            month_str = target_dt.strftime('%b')
            rev = rev_map.get((target_year, target_month), 0.0) or 0.0
            daily_stats.append({'name': month_str, 'revenue': float(rev)})
            
    # Top products
    top_products = db.session.query(
        Product.title, 
        db.func.sum(OrderItem.quantity).label('total_sold')
    ).join(OrderItem).group_by(Product.id).order_by(db.text('total_sold DESC')).limit(5).all()
    top_selling_data = [{'name': p.title, 'value': int(p.total_sold)} for p in top_products]

    # Category distribution
    categories = db.session.query(
        Product.category, 
        db.func.count(Order.id)
    ).join(OrderItem, Product.id == OrderItem.product_id)\
     .join(Order, OrderItem.order_id == Order.id)\
     .group_by(Product.category).all()
    category_data = [{'name': cat.capitalize(), 'value': count} for cat, count in categories]

    # Recent activity
    recent_orders = Order.query.options(joinedload(Order.customer)).order_by(Order.created_at.desc()).limit(5).all()
    activity_feed = [{
        'id': o.id,
        'customer': o.customer.full_name if o.customer else 'Guest',
        'amount': o.total_amount,
        'status': o.status,
        'time': o.created_at.strftime('%I:%M %p')
    } for o in recent_orders]
    
    metrics = {
        'total_users': total_users,
        'total_products': total_products,
        'total_orders': total_orders,
        'total_revenue': float(total_revenue),
        'chart_data': daily_stats,
        'top_selling': top_selling_data,
        'category_distribution': category_data,
        'recent_activity': activity_feed
    }
    
    # 2. Users (filter out deleted ones)
    users = User.query.filter(~User.role.in_(['deleted_user', 'deleted_driver'])).all()
    users_list = [u.to_dict() for u in users]
    
    # 3. Orders (eager load!)
    orders = Order.query.options(
        joinedload(Order.customer),
        joinedload(Order.driver),
        subqueryload(Order.items).joinedload(OrderItem.product)
    ).order_by(Order.created_at.desc()).all()
    orders_list = [o.to_dict() for o in orders]
    
    # 4. Drivers
    drivers = User.query.filter_by(role='driver').all()
    drivers_list = [d.to_dict() for d in drivers]
    
    # 5. Coupons
    coupons = Coupon.query.order_by(Coupon.id.desc()).all()
    coupons_list = [c.to_dict() for c in coupons]
    
    # 6. Subscribers
    subs = NewsletterSubscriber.query.order_by(NewsletterSubscriber.created_at.desc()).all()
    subscribers_list = [s.to_dict() for s in subs]
    
    # 7. Email Logs (first 100)
    email_logs_q = EmailLog.query.order_by(EmailLog.created_at.desc()).limit(100).all()
    email_logs_list = [l.to_dict() for l in email_logs_q]
    
    # 8. Email Stats
    email_stats_results = db.session.query(
        EmailLog.email_type,
        EmailLog.status,
        db.func.count(EmailLog.id)
    ).group_by(EmailLog.email_type, EmailLog.status).all()
    
    by_type = {t: {'sent': 0, 'failed': 0} for t in ['otp', 'order', 'delivery_otp', 'newsletter']}
    email_total_sent = 0
    email_total_failed = 0
    for etype, estatus, ecount in email_stats_results:
        if estatus == 'sent':
            email_total_sent += ecount
        elif estatus == 'failed':
            email_total_failed += ecount
        if etype in by_type and estatus in ['sent', 'failed']:
            by_type[etype][estatus] = ecount
            
    email_stats = {
        'total_sent': email_total_sent,
        'total_failed': email_total_failed,
        'by_type': by_type
    }
    
    return jsonify({
        'metrics': metrics,
        'users': users_list,
        'orders': orders_list,
        'drivers': drivers_list,
        'coupons': coupons_list,
        'subscribers': subscribers_list,
        'email_logs': email_logs_list,
        'email_stats': email_stats
    }), 200

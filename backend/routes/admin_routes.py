import os
import random
import string
import logging
import zipfile
import shutil
from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
from werkzeug.security import generate_password_hash

from extensions import db, socketio
from models import User, Product, Order, OrderItem

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
    
    daily_stats = []
    if period == '7d':
        for i in range(6, -1, -1):
            day = datetime.now() - timedelta(days=i)
            day_str = day.strftime('%a')
            rev = db.session.query(db.func.sum(Order.total_amount)).filter(db.func.date(Order.created_at) == day.date()).scalar() or 0.0
            daily_stats.append({'name': day_str, 'revenue': float(rev)})
    # ... (skipping 6m/1y for brevity in this step, but I should include them)
    # Actually I'll include them to not break logic.
    elif period == '6m':
        for i in range(5, -1, -1):
            first_day = (datetime.now().replace(day=1) - timedelta(days=i*30)).replace(day=1)
            month_str = first_day.strftime('%b')
            rev = db.session.query(db.func.sum(Order.total_amount))\
                .filter(db.func.extract('month', Order.created_at) == first_day.month)\
                .filter(db.func.extract('year', Order.created_at) == first_day.year)\
                .scalar() or 0.0
            daily_stats.append({'name': month_str, 'revenue': float(rev)})
    elif period == '1y':
        for i in range(11, -1, -1):
            first_day = (datetime.now().replace(day=1) - timedelta(days=i*30)).replace(day=1)
            month_str = first_day.strftime('%b')
            rev = db.session.query(db.func.sum(Order.total_amount))\
                .filter(db.func.extract('month', Order.created_at) == first_day.month)\
                .filter(db.func.extract('year', Order.created_at) == first_day.year)\
                .scalar() or 0.0
            daily_stats.append({'name': month_str, 'revenue': float(rev)})

    return jsonify({
        'total_users': User.query.count(),
        'total_products': Product.query.count(),
        'total_orders': Order.query.count(),
        'total_revenue': float(total_revenue),
        'chart_data': daily_stats
    }), 200

@admin_bp.route('/api/admin/orders', methods=['GET'])
@jwt_required()
def get_admin_orders():
    user = db.session.get(User, int(get_jwt_identity()))
    if not user or user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
    orders = Order.query.order_by(Order.created_at.desc()).all()
    return jsonify({'orders': [o.to_dict() for o in orders]}), 200

@admin_bp.route('/api/admin/orders/flash-approve', methods=['POST'])
@jwt_required()
def flash_approve_orders():
    user = db.session.get(User, int(get_jwt_identity()))
    if not user or user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
    
    pending_orders = Order.query.filter(Order.status.in_(['Pending', 'Processing'])).all()
    if not pending_orders:
        return jsonify({'message': 'No pending orders to approve.'}), 200
    
    available_drivers = User.query.filter_by(role='driver').all()
    if not available_drivers:
        return jsonify({'error': 'No drivers found'}), 400
    
    count = 0
    driver_index = 0
    num_drivers = len(available_drivers)
    
    for order in pending_orders:
        order.status = 'Out for Delivery'
        assigned_driver = None
        if order.pincode:
            import json, os
            locations_path = os.path.join(os.path.dirname(__file__), '../../frontend/src/hubli_locations.json')
            try:
                with open(locations_path, 'r') as f:
                    hubli_locations = json.load(f)
                area_to_pincode = {loc['location']: loc['pincode'] for loc in hubli_locations}
            except Exception:
                area_to_pincode = {}

            for d in available_drivers:
                if d.delivery_zones:
                    driver_areas = [z.strip() for z in d.delivery_zones.split(',')]
                    driver_pincodes = [area_to_pincode.get(area) for area in driver_areas]
                    if order.pincode in driver_pincodes or order.pincode in driver_areas:
                        assigned_driver = d
                        break
        
        if not assigned_driver:
            assigned_driver = available_drivers[driver_index % num_drivers]
            driver_index += 1
            
        order.driver_id = assigned_driver.id
        count += 1
        socketio.emit('status_updated', {'order_id': order.id, 'status': 'Out for Delivery', 'tracking_id': order.tracking_id})

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
    if os.path.exists(temp_dir): shutil.rmtree(temp_dir)
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
                    if final_price < 999: final_price = 1299

                main_image = saved_urls[0]
                for url in saved_urls:
                    if 'side' in url.lower():
                        main_image = url
                        break

                new_p = Product(
                    title=title, price=float(final_price), old_price=final_price + 2000,
                    brand=brand, image_url=main_image, gallery=",".join(saved_urls),
                    category=category, type=inferred_type, collection=collection,
                    stock=random.randint(10, 80),
                    description=f"Premium {brand} {title} performance footwear."
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
    users = User.query.all()
    return jsonify({'users': [u.to_dict() for u in users]}), 200

@admin_bp.route('/api/admin/users/<int:user_id>', methods=['PUT'])
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

        new_p = Product(
            title=title, price=float(price), brand=brand, 
            image_url=image_url, badge=request.form.get('badge')
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
    if not product: return jsonify({'error': 'Product not found'}), 404
    
    try:
        db.session.delete(product)
        db.session.commit()
        return jsonify({'message': 'Product deleted'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

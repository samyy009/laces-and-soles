import random
import string
import logging
from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from extensions import db, socketio, razorpay_client
from models import Order, OrderItem, CartItem, Product, User, WishlistItem, Coupon
from services.email_service import send_order_confirmation_email
from services.payment_service import verify_razorpay_signature
from sqlalchemy.orm import joinedload, subqueryload

logger = logging.getLogger(__name__)
order_bp = Blueprint('orders', __name__)

@order_bp.route('/api/cart', methods=['GET', 'POST', 'DELETE'])
@jwt_required()
def handle_cart():
    user_id = int(get_jwt_identity())
    if request.method == 'GET':
        items = CartItem.query.filter_by(user_id=user_id).all()
        return jsonify({'cart': [item.to_dict() for item in items]}), 200
    elif request.method == 'POST':
        data = request.get_json()
        product_id = data.get('product_id')
        quantity = data.get('quantity', 1)
        if not product_id: return jsonify({'error': 'Product ID required'}), 400
        existing = CartItem.query.filter_by(user_id=user_id, product_id=product_id).first()
        if existing:
            existing.quantity += quantity
        else:
            db.session.add(CartItem(user_id=user_id, product_id=product_id, quantity=quantity))  # type: ignore[call-arg]
        db.session.commit()
        return jsonify({'message': 'Added to cart'}), 200
    elif request.method == 'DELETE':
        product_id = request.args.get('product_id')
        if product_id:
            CartItem.query.filter_by(user_id=user_id, product_id=product_id).delete()
        else:
            CartItem.query.filter_by(user_id=user_id).delete()
        db.session.commit()
        return jsonify({'message': 'Cart updated'}), 200

@order_bp.route('/api/cart/bulk', methods=['POST'])
@jwt_required()
def bulk_sync_cart():
    user_id = int(get_jwt_identity())
    data = request.get_json() or {}
    items = data.get('items', [])
    if not isinstance(items, list):
        return jsonify({'error': 'Items must be a list'}), 400
        
    for item in items:
        product_id = item.get('product_id')
        quantity = item.get('quantity', 1)
        if not product_id:
            continue
        existing = CartItem.query.filter_by(user_id=user_id, product_id=product_id).first()
        if existing:
            existing.quantity += quantity
        else:
            db.session.add(CartItem(user_id=user_id, product_id=product_id, quantity=quantity))  # type: ignore[call-arg]
            
    db.session.commit()
    
    # Return updated cart
    cart_items = CartItem.query.filter_by(user_id=user_id).all()
    return jsonify({'message': 'Cart synced successfully', 'cart': [item.to_dict() for item in cart_items]}), 200

@order_bp.route('/api/wishlist', methods=['GET', 'POST', 'DELETE'])
@jwt_required()
def handle_wishlist():
    user_id = int(get_jwt_identity())
    if request.method == 'GET':
        items = WishlistItem.query.filter_by(user_id=user_id).all()
        return jsonify({'wishlist': [item.to_dict() for item in items]}), 200
    elif request.method == 'POST':
        product_id = request.get_json().get('product_id')
        if not WishlistItem.query.filter_by(user_id=user_id, product_id=product_id).first():
            db.session.add(WishlistItem(user_id=user_id, product_id=product_id))  # type: ignore[call-arg]
            db.session.commit()
        return jsonify({'message': 'Added to wishlist'}), 200
    elif request.method == 'DELETE':
        product_id = request.args.get('product_id')
        WishlistItem.query.filter_by(user_id=user_id, product_id=product_id).delete()
        db.session.commit()
        return jsonify({'message': 'Removed from wishlist'}), 200

@order_bp.route('/api/validate_coupon', methods=['POST'])
def validate_coupon():
    data = request.get_json()
    code = data.get('code', '').upper()
    coupon = Coupon.query.filter_by(code=code, is_active=True).first()
    if coupon:
        return jsonify({'valid': True, 'discount_percentage': coupon.discount_percentage, 'message': f'Coupon applied! {coupon.discount_percentage}% off.'}), 200
    if code == 'FLIPKART10':
        return jsonify({'valid': True, 'discount_percentage': 10, 'message': 'Flipkart Simulation Coupon applied! 10% off.'}), 200
    return jsonify({'valid': False, 'message': 'Invalid or expired coupon code.'}), 400

@order_bp.route('/api/razorpay/create-order', methods=['POST'])
@jwt_required()
def create_razorpay_order():
    if not razorpay_client:
        return jsonify({'error': 'Razorpay not configured on server'}), 500
    user_id = int(get_jwt_identity())
    
    data = request.get_json() or {}
    coupon_code = data.get('coupon_code', '').upper()
    
    cart_items = CartItem.query.filter_by(user_id=user_id).all()
    if not cart_items:
        return jsonify({'error': 'Cart is empty'}), 400
    
    total_price = sum((item.product.price * item.quantity) for item in cart_items if item.product)
    
    # Apply coupon if valid
    discount_percentage = 0
    if coupon_code:
        coupon = Coupon.query.filter_by(code=coupon_code, is_active=True).first()
        if coupon:
            discount_percentage = coupon.discount_percentage
        elif coupon_code == 'FLIPKART10':
            discount_percentage = 10
            
    if discount_percentage > 0:
        discount_amount = total_price * (discount_percentage / 100)
        total_price -= discount_amount
        
    if total_price > 0: total_price += 15.00 # Shipping
    
    amount_paise = int(total_price * 100)
    try:
        razorpay_order = razorpay_client.order.create({"amount": amount_paise, "currency": "INR", "payment_capture": 1})  # type: ignore
        return jsonify({'razorpay_order_id': razorpay_order['id'], 'amount': total_price, 'currency': 'INR'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@order_bp.route('/api/razorpay/verify-payment', methods=['POST'])
@jwt_required()
def verify_payment():
    data = request.get_json()
    razorpay_order_id = data.get('razorpay_order_id')
    razorpay_payment_id = data.get('razorpay_payment_id')
    razorpay_signature = data.get('razorpay_signature')
    shipping_details = data.get('shipping_details', {})
    
    if not verify_razorpay_signature(razorpay_order_id, razorpay_payment_id, razorpay_signature, razorpay_client):
        return jsonify({'error': 'Payment verification failed'}), 400

    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)
    
    recent_order = Order.query.filter_by(user_id=user_id).filter(Order.created_at >= datetime.utcnow() - timedelta(seconds=60)).first()
    if recent_order:
        return jsonify({'success': True, 'orders': [recent_order.to_dict()], 'message': 'Duplicate order prevented.'}), 200

    cart_items = CartItem.query.filter_by(user_id=user_id).all()
    if not cart_items: return jsonify({'error': 'Cart empty'}), 400

    pincode = shipping_details.get('pincode', shipping_details.get('zipCode', ''))
    address_str = f"{shipping_details.get('address', '')}, {shipping_details.get('city', '')}, {shipping_details.get('state', '')} {pincode}"
    
    created_orders = []
    distance_km = round(random.uniform(0.5, 8.0), 2)

    for index, item in enumerate(cart_items):
        if not item.product: continue
        chars = string.ascii_uppercase + string.digits
        unique_track_id = f"L&S-{''.join(random.choices(chars, k=8))}"
        item_total = (item.product.price * item.quantity) + (15.00 if index == 0 else 0)

        new_order = Order(
            user_id=user_id, total_amount=item_total, status='Processing',  # type: ignore[call-arg]
            shipping_address=address_str, pincode=pincode, tracking_id=unique_track_id,  # type: ignore[call-arg]
            payment_method=f"Razorpay ({razorpay_payment_id})", distance_km=distance_km  # type: ignore[call-arg]
        )
        db.session.add(new_order)
        db.session.flush()

        # Atomic Stock Update: Only decrement if stock is sufficient
        affected_rows = Product.query.filter_by(id=item.product_id).filter(Product.stock >= item.quantity).update({"stock": Product.stock - item.quantity}, synchronize_session=False)
        if not affected_rows:
            db.session.rollback()
            return jsonify({'error': f"Insufficient stock for {item.product.title}"}), 400

        # Emit live stock update and recent purchase
        updated_product = db.session.get(Product, item.product_id)
        socketio.emit('inventory_updated', {'product_id': item.product_id, 'new_stock': updated_product.stock})
        socketio.emit('new_purchase', {'user_name': user.full_name, 'product_title': item.product.title, 'product_image': item.product.image_url, 'product_id': item.product.id})

        db.session.add(OrderItem(order_id=new_order.id, product_id=item.product_id, quantity=item.quantity, price=item.product.price))  # type: ignore[call-arg]
        db.session.delete(item)
        created_orders.append(new_order)

    db.session.commit()
    if created_orders:
        try:
            send_order_confirmation_email(user.email, user.full_name, created_orders[0])
        except Exception as e:
            logger.error(f"Failed to send order confirmation email: {e}")

    return jsonify({'success': True, 'message': 'Payment verified', 'orders': [o.to_dict() for o in created_orders]}), 200

@order_bp.route('/api/orders', methods=['GET', 'POST'])
@jwt_required()
def handle_orders():
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)
    if request.method == 'GET':
        orders = Order.query.filter_by(user_id=user_id).options(
            joinedload(Order.customer),
            joinedload(Order.driver),
            subqueryload(Order.items).joinedload(OrderItem.product)
        ).order_by(Order.created_at.desc()).all()
        return jsonify({'orders': [o.to_dict() for o in orders]}), 200
    elif request.method == 'POST':
        cart_items = CartItem.query.filter_by(user_id=user_id).all()
        if not cart_items: return jsonify({'error': 'Cart empty'}), 400
        
        for item in cart_items:
            if item.product and item.product.stock < item.quantity:
                return jsonify({'error': f"Insufficient stock for {item.product.title}"}), 400

        data = request.get_json()
        shipping_details = data.get('shipping_details', {})
        pincode = shipping_details.get('pincode', shipping_details.get('zipCode', ''))
        address_str = f"{shipping_details.get('address', '')}, {shipping_details.get('city', '')}, {shipping_details.get('state', '')} {pincode}"
        
        created_orders = []
        distance_km = round(random.uniform(0.5, 8.0), 2)

        for index, item in enumerate(cart_items):
            if not item.product: continue
            unique_track_id = f"L&S-{''.join(random.choices(string.ascii_uppercase + string.digits, k=8))}"
            item_total = (item.product.price * item.quantity) + (15.00 if index == 0 else 0)

            new_order = Order(
                user_id=user_id, total_amount=item_total, status='Processing',  # type: ignore[call-arg]
                shipping_address=address_str, pincode=pincode, tracking_id=unique_track_id,  # type: ignore[call-arg]
                payment_method=data.get('payment_method', 'COD'), distance_km=distance_km  # type: ignore[call-arg]
            )
            db.session.add(new_order)
            db.session.flush()

            # Atomic Stock Update
            affected_rows = Product.query.filter_by(id=item.product_id).filter(Product.stock >= item.quantity).update({"stock": Product.stock - item.quantity}, synchronize_session=False)
            if not affected_rows:
                db.session.rollback()
                return jsonify({'error': f"Insufficient stock for {item.product.title}"}), 400
            
            # Fetch fresh stock after atomic update
            updated_product = db.session.get(Product, item.product_id)
            socketio.emit('inventory_updated', {'product_id': item.product_id, 'new_stock': updated_product.stock})
            socketio.emit('new_purchase', {'user_name': user.full_name, 'product_title': item.product.title, 'product_image': item.product.image_url, 'product_id': item.product.id})
            
            db.session.add(OrderItem(order_id=new_order.id, product_id=item.product_id, quantity=item.quantity, price=item.product.price))  # type: ignore[call-arg]
            db.session.delete(item)
            created_orders.append(new_order)

        db.session.commit()
        for o in created_orders:
            socketio.emit('order_placed', {'order_id': o.id, 'total_amount': o.total_amount})
        
        if created_orders:
            try:
                send_order_confirmation_email(user.email, user.full_name, created_orders[0])
            except Exception as e:
                logger.error(f"Failed to send order confirmation email: {e}")

        return jsonify({'message': 'Order placed successfully!', 'order': created_orders[0].to_dict()}), 201

@order_bp.route('/api/orders/<tracking_id>/cancel', methods=['POST'])
@jwt_required()
def cancel_order(tracking_id):
    user_id = int(get_jwt_identity())
    orders = Order.query.filter_by(tracking_id=tracking_id, user_id=user_id).all()
    if not orders: return jsonify({'error': 'Order not found'}), 404
    data = request.get_json() or {}
    
    refund_initiated = False
    
    for order in orders:
        if order.status not in ['Pending', 'Processing', 'Packed']:
            return jsonify({'error': f'Cannot cancel order in {order.status} stage'}), 400
            
        for item in order.items:
            Product.query.filter_by(id=item.product_id).update({"stock": Product.stock + item.quantity}, synchronize_session=False)
            updated_product = db.session.get(Product, item.product_id)
            socketio.emit('inventory_updated', {'product_id': item.product_id, 'new_stock': updated_product.stock})
            
        # Refund Logic Check
        if order.payment_method and 'Razorpay' in order.payment_method:
            order.status = 'Cancelled - Refund Initiated'
            refund_initiated = True
        else:
            order.status = 'Cancelled'
            
        order.cancellation_reason = data.get('reason', 'User cancelled')
    db.session.commit()
    
    message = 'Order cancelled.'
    if refund_initiated:
        message += ' A refund has been initiated and will be credited to your original payment method in 5-7 business days.'
        
    return jsonify({'message': message, 'refund_initiated': refund_initiated}), 200


@order_bp.route('/api/orders/<tracking_id>/return', methods=['POST'])
@jwt_required()
def return_order(tracking_id):
    user_id = int(get_jwt_identity())
    orders = Order.query.filter_by(tracking_id=tracking_id, user_id=user_id).all()
    if not orders: return jsonify({'error': 'Order not found'}), 404
    data = request.get_json() or {}
    for order in orders:
        if order.status != 'Delivered': return jsonify({'error': 'Only delivered items can be returned'}), 400
        order.status = 'Return Requested'
        order.return_reason = data.get('reason', 'Quality issues')
    db.session.commit()
    return jsonify({'message': 'Return request submitted'}), 200

@order_bp.route('/api/orders/<tracking_id>/address', methods=['PATCH'])
@jwt_required()
def update_shipping_address(tracking_id):
    user_id = int(get_jwt_identity())
    orders = Order.query.filter_by(tracking_id=tracking_id, user_id=user_id).all()
    if not orders: return jsonify({'error': 'Order not found'}), 404
    data = request.get_json() or {}
    for order in orders:
        order.shipping_address = data.get('address', order.shipping_address)
        order.pincode = data.get('pincode', order.pincode)
    db.session.commit()
    return jsonify({'message': 'Address updated'}), 200

@order_bp.route('/api/orders/<int:order_id>', methods=['DELETE'])
@jwt_required()
def delete_order(order_id):
    user_id = int(get_jwt_identity())
    order = db.session.get(Order, order_id)
    if not order: return jsonify({'error': 'Order not found'}), 404
    
    user = db.session.get(User, user_id)
    is_owner = order.user_id == user_id
    is_admin = user and user.role == 'admin'
    is_driver = order.driver_id == user_id
    
    if not (is_owner or is_admin or is_driver):
        return jsonify({'error': 'Unauthorized deletion attempt.'}), 403
         
    try:
        for item in order.items: db.session.delete(item)
        db.session.delete(order)
        db.session.commit()
        return jsonify({'message': 'Order removed.'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to delete order', 'details': str(e)}), 500

@order_bp.route('/api/orders/<int:order_id>/cancel_v2', methods=['PATCH'])
@jwt_required()
def cancel_order_v2(order_id):
    user_id = int(get_jwt_identity())
    order = db.session.get(Order, order_id)
    if not order: return jsonify({'error': 'Order not found'}), 404
    if order.user_id != user_id: return jsonify({'error': 'Unauthorized'}), 403
    if order.status in ['Shipped', 'Delivered', 'Cancelled', 'Cancelled - Refund Initiated']:
        return jsonify({'error': f'Cannot cancel an order that is already {order.status}.'}), 400
         
    try:
        refund_initiated = False
        if order.payment_method and 'Razorpay' in order.payment_method:
            order.status = 'Cancelled - Refund Initiated'
            refund_initiated = True
        else:
            order.status = 'Cancelled'
            
        for item in order.items:
            Product.query.filter_by(id=item.product_id).update({"stock": Product.stock + item.quantity}, synchronize_session=False)
            updated_product = db.session.get(Product, item.product_id)
            socketio.emit('inventory_updated', {'product_id': item.product_id, 'new_stock': updated_product.stock})
        db.session.commit()
        
        message = 'Order successfully cancelled.'
        if refund_initiated:
            message += ' A refund has been initiated and will be credited to your original payment method in 5-7 business days.'
            
        return jsonify({'message': message, 'refund_initiated': refund_initiated}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to cancel order', 'details': str(e)}), 500

@order_bp.route('/api/track/<string:tracking_id>', methods=['GET'])
def track_order(tracking_id):
    # Strip any leading '#' and whitespace
    tracking_id = tracking_id.lstrip('#').strip()
    if not tracking_id.startswith('L&S'):
        return jsonify({'error': 'Invalid Tracking ID format.'}), 400
    
    order = Order.query.filter_by(tracking_id=tracking_id).options(
        joinedload(Order.customer),
        joinedload(Order.driver),
        subqueryload(Order.items).joinedload(OrderItem.product)
    ).first()
    if not order: 
        return jsonify({'error': 'Tracking ID not found.'}), 404
    
    all_items = [item.to_dict() for item in order.items]

    active_drivers = []
    driver_lat = None
    driver_lng = None
    driver_id = None

    if order.status == 'Out for Delivery' and order.driver_id:
        active_drivers.append({'driver_id': order.driver_id, 'driver_lat': order.driver_lat, 'driver_lng': order.driver_lng, 'order_id': order.id})
        driver_lat = order.driver_lat
        driver_lng = order.driver_lng
        driver_id = order.driver_id

    status_priority = {'Pending': 0, 'Packed': 1, 'Shipped': 2, 'Out for Delivery': 3, 'Delivered': 4, 'Cancelled': -1, 'Cancelled - Refund Initiated': -1}
    current_status = order.status
    
    milestones = {
        'ordered': order.created_at.isoformat(),
        'packed': (order.created_at + timedelta(hours=2)).isoformat() if status_priority.get(current_status, 0) >= 1 else None,
        'shipped': (order.created_at + timedelta(hours=6)).isoformat() if status_priority.get(current_status, 0) >= 2 else None,
        'delivered': (order.created_at + timedelta(hours=24)).isoformat() if current_status == 'Delivered' else None,
    }
    
    return jsonify({
        'user_id': order.user_id, 'tracking_id': tracking_id, 'current_status': current_status,
        'milestones': milestones, 'courier': 'Delhivery Prepaid', 'items': all_items,
        'total_amount': order.total_amount, 'shipping_address': order.shipping_address,
        'driver_lat': driver_lat,
        'driver_lng': driver_lng,
        'driver_id': driver_id,
        'active_drivers': active_drivers, 'orders_count': 1
    }), 200

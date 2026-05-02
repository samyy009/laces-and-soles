import random
import logging
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from extensions import db, socketio
from models import User, Order
from services.email_service import send_delivery_otp_email

logger = logging.getLogger(__name__)
driver_bp = Blueprint('driver', __name__)

@driver_bp.route('/api/driver/orders', methods=['GET'])
@jwt_required()
def get_driver_orders():
    driver_id = int(get_jwt_identity())
    user = db.session.get(User, driver_id)
    if not user or user.role != 'driver':
        return jsonify({'error': 'Unauthorized'}), 403
    orders = Order.query.filter_by(driver_id=driver_id).order_by(Order.created_at.desc()).all()
    return jsonify({'orders': [o.to_dict() for o in orders]}), 200

@driver_bp.route('/api/driver/orders/<int:order_id>/status', methods=['PATCH'])
@jwt_required()
def update_order_status(order_id):
    driver_id = int(get_jwt_identity())
    order = db.session.get(Order, order_id)
    if not order or order.driver_id != driver_id:
        return jsonify({'error': 'Unauthorized'}), 404
    new_status = request.get_json().get('status')
    if new_status == 'Delivered' and not order.is_otp_verified:
        return jsonify({'error': 'OTP verification required'}), 400
    order.status = new_status
    db.session.commit()
    socketio.emit('status_updated', {'order_id': order.id, 'status': new_status}, room=f"order_{order.id}")
    return jsonify({'message': f'Status updated to {new_status}'}), 200

@driver_bp.route('/api/driver/orders/<int:order_id>/send-otp', methods=['POST'])
@jwt_required()
def send_delivery_otp(order_id):
    driver_id = int(get_jwt_identity())
    order = db.session.get(Order, order_id)
    if not order or order.driver_id != driver_id:
        return jsonify({'error': 'Unauthorized'}), 404
    otp = str(random.randint(100000, 999999))
    order.delivery_otp = otp
    db.session.commit()
    if send_delivery_otp_email(order.customer.email, order.customer.full_name, order.tracking_id, otp):
        return jsonify({'message': 'OTP sent!', 'otp': otp}), 200
    return jsonify({'message': 'OTP generated (Email failed)', 'otp': otp}), 200

@driver_bp.route('/api/driver/orders/<int:order_id>/verify-otp', methods=['POST'])
@jwt_required()
def verify_delivery_otp(order_id):
    driver_id = int(get_jwt_identity())
    order = db.session.get(Order, order_id)
    if not order or order.driver_id != driver_id:
        return jsonify({'error': 'Unauthorized'}), 404
    if order.delivery_otp == request.get_json().get('otp'):
        order.is_otp_verified = True
        db.session.commit()
        return jsonify({'message': 'OTP verified', 'verified': True}), 200
    return jsonify({'error': 'Invalid OTP', 'verified': False}), 400

@driver_bp.route('/api/driver/orders/<int:order_id>/fail', methods=['PATCH'])
@jwt_required()
def mark_delivery_failed(order_id):
    driver_id = int(get_jwt_identity())
    order = db.session.get(Order, order_id)
    if not order or order.driver_id != driver_id:
        return jsonify({'error': 'Unauthorized'}), 404
    reason = request.get_json().get('reason', 'Customer not available')
    order.status = 'Delivery Attempt Failed'
    order.failure_reason = reason
    db.session.commit()
    socketio.emit('status_updated', {'order_id': order.id, 'status': 'Delivery Attempt Failed', 'reason': reason}, room=f"order_{order.id}")
    return jsonify({'message': 'Delivery attempt failed'}), 200

@driver_bp.route('/api/driver/location', methods=['POST'])
@jwt_required()
def update_location():
    driver_id = int(get_jwt_identity())
    user = db.session.get(User, driver_id)
    if not user or user.role != 'driver':
        return jsonify({'error': 'Unauthorized'}), 403
        
    data = request.get_json()
    lat = data.get('lat')
    lng = data.get('lng')
    
    if lat is None or lng is None:
        return jsonify({'error': 'Missing coordinates'}), 400
        
    # Update all active "Out for Delivery" orders for this driver
    active_orders = Order.query.filter_by(driver_id=driver_id, status='Out for Delivery').all()
    for order in active_orders:
        order.driver_lat = lat
        order.driver_lng = lng
        # Broadcast the location update to users tracking this order
        socketio.emit('driver_location_update', {
            'order_id': order.id,
            'tracking_id': order.tracking_id,
            'lat': lat,
            'lng': lng
        }, room=f"order_{order.id}")
        
    db.session.commit()
    return jsonify({'message': 'Location updated'}), 200

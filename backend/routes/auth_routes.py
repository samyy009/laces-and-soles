import os
import random
import traceback
from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
import requests
import logging

from extensions import db, limiter
from models import User, PasswordReset
from services.email_service import send_otp_email

logger = logging.getLogger(__name__)
auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/api/register', methods=['POST'])
@limiter.limit("5 per minute")
def register():
    data = request.get_json()
    if not all(k in data for k in ('full_name', 'email', 'password')):
        return jsonify({'error': 'All fields are required.'}), 400
    try:
        if User.query.filter_by(email=data['email']).first():
            return jsonify({'error': 'Email address already in use.'}), 409
        hashed = generate_password_hash(data['password'])
        new_user = User(
            full_name=data['full_name'], 
            email=data['email'], 
            password_hash=hashed, 
            role='user',
            phone_number=data.get('phone_number')
        )
        db.session.add(new_user)
        db.session.commit()
        access_token = create_access_token(identity=str(new_user.id))
        return jsonify({'message': 'Account created successfully!', 'token': access_token, 'user': new_user.to_dict()}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/api/login', methods=['POST'])
@limiter.limit("10 per minute")
def login():
    data = request.get_json()
    user = User.query.filter_by(email=data.get('email')).first()
    if user and check_password_hash(user.password_hash, data.get('password')):
        access_token = create_access_token(identity=str(user.id))
        return jsonify({'message': 'Login successful!', 'token': access_token, 'user': user.to_dict()}), 200
    return jsonify({'error': 'Invalid email or password.'}), 401

@auth_bp.route('/api/google-login', methods=['POST'])
@limiter.limit("10 per minute")
def google_login():
    try:
        data = request.get_json()
        token = data.get('credential')
        client_id = os.environ.get('GOOGLE_CLIENT_ID')
        
        if not token:
            return jsonify({'error': 'Token is required'}), 400
        if not client_id:
            return jsonify({'error': 'Google Client ID not configured on server'}), 500

        try:
            idinfo = id_token.verify_oauth2_token(token, google_requests.Request(), client_id)
        except ValueError as e:
            return jsonify({'error': f'Invalid token: {str(e)}'}), 401
            
        email = idinfo['email']
        full_name = idinfo.get('name', 'Google User')
        
        user = User.query.filter_by(email=email).first()
        if not user:
            user = User(
                full_name=full_name,
                email=email,
                password_hash=generate_password_hash(os.urandom(24).hex()),
                role='user'
            )
            db.session.add(user)
            db.session.commit()
        
        access_token = create_access_token(identity=str(user.id))
        return jsonify({'message': 'Google Login successful!', 'token': access_token, 'user': user.to_dict()}), 200
    except Exception as e:
        return jsonify({'error': f'Authentication Error: {str(e)}'}), 500

@auth_bp.route('/api/facebook-login', methods=['POST'])
@limiter.limit("10 per minute")
def facebook_login():
    data = request.get_json()
    access_token = data.get('accessToken')
    if not access_token:
        return jsonify({'error': 'Access Token is required'}), 400

    if access_token == 'mock_token':
        email = "demo.user@facebook.com"
        full_name = "Demo Facebook User"
        user = User.query.filter_by(email=email).first()
        if not user:
            user = User(full_name=full_name, email=email, password_hash=generate_password_hash('demo123'), role='user')
            db.session.add(user)
            db.session.commit()
        jwt_token = create_access_token(identity=str(user.id))
        return jsonify({'message': 'Facebook Mock Login successful!', 'token': jwt_token, 'user': user.to_dict()}), 200

    try:
        fb_res = requests.get(f"https://graph.facebook.com/me?fields=id,name,email&access_token={access_token}", timeout=10)
        if fb_res.status_code != 200:
            return jsonify({'error': 'Invalid Facebook token'}), 401
        fb_data = fb_res.json()
        email = fb_data.get('email') or f"{fb_data['id']}@facebook.com"
        full_name = fb_data.get('name', 'Facebook User')
        
        user = User.query.filter_by(email=email).first()
        if not user:
            user = User(full_name=full_name, email=email, password_hash=generate_password_hash(os.urandom(24).hex()), role='user')
            db.session.add(user)
            db.session.commit()
        
        jwt_token = create_access_token(identity=str(user.id))
        return jsonify({'message': 'Facebook Login successful!', 'token': jwt_token, 'user': user.to_dict()}), 200
    except Exception as e:
        return jsonify({'error': f'Authentication Error: {str(e)}'}), 500

@auth_bp.route('/api/forgot-password', methods=['POST'])
@limiter.limit("20 per hour")
def forgot_password():
    try:
        data = request.get_json()
        email = data.get('email')
        user = User.query.filter_by(email=email).first()
        if not user:
            return jsonify({'message': 'If an account with that email exists, an OTP has been sent.'}), 200
    
        otp = str(random.randint(100000, 999999))
        expiry = datetime.utcnow() + timedelta(minutes=10)
        
        reset_entry = PasswordReset.query.filter_by(email=email).first()
        if reset_entry:
            reset_entry.otp = otp
            reset_entry.expiry = expiry
            reset_entry.is_verified = False
        else:
            reset_entry = PasswordReset(email=email, otp=otp, expiry=expiry)
            db.session.add(reset_entry)
        
        db.session.commit()
        if send_otp_email(email, otp):
            return jsonify({'message': 'OTP sent successfully!'}), 200
        else:
            return jsonify({'error': 'Failed to send OTP. Please try again later.'}), 500
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/api/verify-otp', methods=['POST'])
def verify_otp():
    data = request.get_json()
    email = data.get('email')
    otp = data.get('otp')
    reset_entry = PasswordReset.query.filter_by(email=email, otp=otp).first()
    if not reset_entry or reset_entry.is_expired():
        return jsonify({'error': 'Invalid or expired OTP.'}), 400
    reset_entry.is_verified = True
    db.session.commit()
    return jsonify({'message': 'OTP verified successfully!'}), 200

@auth_bp.route('/api/reset-password', methods=['POST'])
def reset_password():
    data = request.get_json()
    email = data.get('email')
    otp = data.get('otp')
    new_password = data.get('new_password')
    reset_entry = PasswordReset.query.filter_by(email=email, otp=otp, is_verified=True).first()
    if not reset_entry or reset_entry.is_expired():
        return jsonify({'error': 'Unauthorized password reset attempt.'}), 403
    user = User.query.filter_by(email=email).first()
    if user:
        user.password_hash = generate_password_hash(new_password)
        db.session.delete(reset_entry)
        db.session.commit()
        return jsonify({'message': 'Password reset successfully!'}), 200
    return jsonify({'error': 'User not found.'}), 404

@auth_bp.route('/api/user/update', methods=['POST'])
@jwt_required()
def update_profile():
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    data = request.get_json()
    user.full_name = data.get('full_name', user.full_name)
    user.address = data.get('address', user.address)
    user.city = data.get('city', user.city)
    user.state = data.get('state', user.state)
    user.zip_code = data.get('zip_code', user.zip_code)
    db.session.commit()
    return jsonify({'message': 'Profile updated successfully', 'user': user.to_dict()}), 200

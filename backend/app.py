import os
import sys
import subprocess
import urllib.parse


from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
from models import db, User, Product, Order, OrderItem, CartItem, WishlistItem, Review, Coupon, PasswordReset
import json
import logging
import shutil
import re
import string
import random
import requests
import traceback
from dotenv import load_dotenv
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from datetime import datetime, timedelta
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from flask_socketio import SocketIO, emit
import zipfile

load_dotenv()
import razorpay

# Razorpay Client Initialization
RAZORPAY_KEY_ID = os.environ.get('RAZORPAY_KEY_ID', 'rzp_test_placeholder')
RAZORPAY_KEY_SECRET = os.environ.get('RAZORPAY_KEY_SECRET', 'placeholder_secret')

try:
    razorpay_client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))
    logger.info("Razorpay: Client Initialized")
except Exception as e:
    logger.error(f"Razorpay: Initialization Failed: {e}")
    razorpay_client = None

# Configure logging to a file
logging.basicConfig(
    filename='app.log',
    level=logging.DEBUG,
    format='%(asctime)s %(levelname)s: %(message)s'
)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Smart CORS configuration: 
# Open during Development for Postman/Phone testing (as requested), 
# Tightened during Production for maximum security.
if os.environ.get('FLASK_ENV') == 'development':
    CORS(app, resources={r"/*": {"origins": "*"}})
    logger.info("Security: Development CORS enabled (Allow All Routes)")
else:
    CORS(app, resources={r"/*": {"origins": ["http://localhost:5173"]}})
    logger.info("Security: Production CORS enabled (Strict)")

socketio = SocketIO(app, cors_allowed_origins="*", async_mode='threading')

# ==========================================
# CONFIGURATION
# ==========================================
DB_USER = os.environ.get('DB_USER', 'postgres')
DB_PASSWORD = os.environ.get('DB_PASSWORD', 'root')
DB_HOST = os.environ.get('DB_HOST', 'localhost')
DB_NAME = os.environ.get('DB_NAME', 'laces_and_soles')

encoded_password = urllib.parse.quote_plus(DB_PASSWORD)
app.config['SQLALCHEMY_DATABASE_URI'] = f'postgresql://{DB_USER}:{encoded_password}@{DB_HOST}/{DB_NAME}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# CRITICAL SECURITY: Secrets must be loaded from .env. 
# No hardcoded fallbacks to prevent accidental exposure.
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY')
app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY')

if not app.config['SECRET_KEY'] or not app.config['JWT_SECRET_KEY']:
    logger.error("CRITICAL: SECRET_KEY or JWT_SECRET_KEY missing in .env!")
    # Keep as warning for development, but crash in production
    if os.environ.get('FLASK_ENV') != 'development':
        raise RuntimeError("Missing Core Security Keys!")

# JWT SECURITY: 24h Expiry for Developer-friendly session management
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=24)

# Configure Uploads
UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}

db.init_app(app)
jwt = JWTManager(app)

# Configure Limiter - Relaxed during development for better DX
default_limits = ["5000 per day", "1000 per hour"]
if os.environ.get('FLASK_ENV') == 'development':
    default_limits = ["50000 per day", "10000 per hour"]

limiter = Limiter(
    get_remote_address,
    app=app,
    default_limits=default_limits,
    storage_uri="memory://"
)

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# ==========================================
# INITIALIZATION
# ==========================================
with app.app_context():
    try:
        db.create_all()
        # Admin Seed
        admin_user = User.query.filter_by(email='admin@laces.com').first()
        if not admin_user:
            admin = User(
                full_name='Administrator',
                email='admin@laces.com',
                password_hash=generate_password_hash('admin123'),
                role='admin'
            )
            db.session.add(admin)
            
        # Products Seed
        if Product.query.count() == 0:
            json_path = os.path.join(os.path.dirname(__file__), '..', 'src', 'content.json')
            try:
                with open(json_path, 'r', encoding='utf-8') as f:
                    content_data = json.load(f)
                    items = content_data.get('products', {}).get('items', [])
                    for i, item in enumerate(items):
                        # Add more varied data for seeding
                        category = 'men' if i % 2 == 0 else 'women'
                        prod_type = 'sneakers' if i % 3 == 0 else ('sports' if i % 3 == 1 else 'casual')
                        p = Product(
                            title=item['title'], 
                            price=item['price'], 
                            old_price=item.get('oldPrice'), 
                            brand=item['brand'], 
                            image_url=item['image'], 
                            badge=item.get('badge'),
                            category=category,
                            type=prod_type,
                            description=f"Inspired by the early 2000s original, the {item['brand']} {item['title']} is designed for maximum comfort and style. Featuring high-quality materials and a whole lot of personality.",
                            colors="Red,Black,White,Blue",
                            sizes="6,7,8,9,10,11,12",
                            stock=random.randint(5, 15),
                            discount=random.choice([0, 10, 15, 20, 30]),
                            reviews_count=random.randint(10, 200),
                            gallery=f"{item['image']},{item['image']},{item['image']},{item['image']}"
                        )
                        db.session.add(p)
            except Exception as e:
                print(f"Skipped initial products seed: {e}")
        # Drivers Seed
        drivers_to_seed = [
            {'name': 'Driver One', 'email': 'driver1@laces.com', 'range': 'short', 'phone': '9876543210'},
            {'name': 'Driver Two', 'email': 'driver2@laces.com', 'range': 'mid', 'phone': '9876543211'},
            {'name': 'Driver Three', 'email': 'driver3@laces.com', 'range': 'long', 'phone': '9876543212'}
        ]
        for d_data in drivers_to_seed:
            if not User.query.filter_by(email=d_data['email']).first():
                d = User(
                    full_name=d_data['name'],
                    email=d_data['email'],
                    password_hash=generate_password_hash('driver123'),
                    role='driver',
                    driver_range=d_data['range'],
                    phone_number=d_data['phone']
                )
                db.session.add(d)

        db.session.commit()
    except Exception as e:
        db.session.rollback()
        print(f"Initialization error: {e}")

# ==========================================
# API ROUTES
# ==========================================

@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

@app.route('/api/upload', methods=['POST'])
@jwt_required()
def upload_file():
    current_user_id = int(get_jwt_identity())
    user = db.session.get(User, current_user_id)
    if not user or user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403

    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
        url = f"http://localhost:5000/uploads/{filename}"
        return jsonify({'message': 'File uploaded', 'url': url}), 201
    return jsonify({'error': 'Invalid file type'}), 400

# ─── EMAIL HELPER ───
def send_otp_email(receiver_email, otp):
    """Sends a beautiful OTP email via Brevo HTTP API."""
    sender_email = os.environ.get('BREVO_SENDER')
    api_key = os.environ.get('BREVO_API_KEY')

    if not all([sender_email, api_key]):
        print("Missing Brevo credentials in .env")
        return False

    html = f"""
    <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: auto; padding: 40px; border: 1px solid #eee; border-radius: 20px;">
        <h2 style="color: #000; font-weight: 900; text-transform: uppercase; letter-spacing: -1px; margin-bottom: 20px;">Laces & Soles</h2>
        <p style="color: #666; font-size: 16px; line-height: 1.5;">You requested a password reset. Use the following code to verify your account. This code is valid for 10 minutes.</p>
        <div style="background: #f9f9f9; padding: 30px; text-align: center; border-radius: 12px; margin: 30px 0;">
            <span style="font-size: 42px; font-weight: 900; color: #f43f5e; letter-spacing: 10px;">{otp}</span>
        </div>
        <p style="color: #999; font-size: 12px; margin-top: 40px; border-top: 1px solid #eee; padding-top: 20px;">
            If you didn't request this, please ignore this email.
        </p>
    </div>
    """

    url = "https://api.brevo.com/v3/smtp/email"
    headers = {
        "accept": "application/json",
        "content-type": "application/json",
        "api-key": api_key
    }
    payload = {
        "sender": {"name": "Laces & Soles", "email": sender_email},
        "to": [{"email": receiver_email}],
        "subject": f"{otp} is your Laces & Soles verification code",
        "htmlContent": html
    }

    try:
        logger.info(f"API: Sending OTP to {receiver_email} via Brevo HTTP...")
        response = requests.post(url, json=payload, headers=headers)
        if response.status_code in [201, 202]:
            logger.info("API: Email sent successfully!")
            return True
        else:
            logger.error(f"API Error: Status {response.status_code} - {response.text}")
            return False
    except Exception as e:
        logger.error(f"API Connection Error: {e}")
        return False


def send_order_confirmation_email(receiver_email, customer_name, order):
    """Sends a rich HTML order confirmation email via Brevo after successful payment."""
    sender_email = os.environ.get('BREVO_SENDER')
    api_key = os.environ.get('BREVO_API_KEY')

    if not all([sender_email, api_key]):
        logger.warning("Missing Brevo credentials — skipping order confirmation email.")
        return False

    order_data   = order.to_dict()
    tracking_id  = order_data['tracking_id']
    invoice_no   = f"INV-{datetime.utcnow().year}-{str(order.id).zfill(5)}"
    order_date   = order.created_at.strftime('%d %b %Y') if order.created_at else 'Today'
    total_amount = order_data['total_amount']

    items_rows_html = ""
    for item in order_data.get('items', []):
        product = item.get('product') or {}
        name    = product.get('title', 'Item')
        qty     = item.get('quantity', 1)
        price   = item.get('price', 0)
        items_rows_html += f"""
        <tr>
          <td style="padding:10px 8px;border-bottom:1px solid #f3f4f6;">{name}</td>
          <td style="padding:10px 8px;border-bottom:1px solid #f3f4f6;text-align:center;">{qty}</td>
          <td style="padding:10px 8px;border-bottom:1px solid #f3f4f6;text-align:right;">&#8377;{price:.2f}</td>
          <td style="padding:10px 8px;border-bottom:1px solid #f3f4f6;text-align:right;font-weight:700;">&#8377;{price * qty:.2f}</td>
        </tr>"""

    html = f"""<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f9fafb;font-family:'Helvetica Neue',Arial,sans-serif;">
      <div style="max-width:600px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.07);">
        <div style="background:#f43f5e;padding:28px 32px;">
          <h1 style="margin:0;color:#fff;font-size:22px;font-weight:900;letter-spacing:-0.5px;">LACES &amp; SOLES</h1>
          <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:13px;">lacesandsoles.in</p>
        </div>
        <div style="padding:32px;">
          <h2 style="margin:0 0 8px;font-size:24px;font-weight:900;color:#111827;">Order Confirmed! &#10003;</h2>
          <p style="color:#6b7280;font-size:15px;margin:0 0 24px;">Hi {customer_name}, your payment was received and your order is now being processed.</p>
          <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:24px;">
            <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:12px 18px;">
              <p style="margin:0;font-size:10px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.1em;">Invoice No.</p>
              <p style="margin:4px 0 0;font-size:15px;font-weight:800;color:#111827;">{invoice_no}</p>
            </div>
            <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:12px 18px;">
              <p style="margin:0;font-size:10px;font-weight:700;color:#3b82f6;text-transform:uppercase;letter-spacing:0.1em;">Tracking ID</p>
              <p style="margin:4px 0 0;font-size:15px;font-weight:800;color:#1d4ed8;">{tracking_id}</p>
            </div>
            <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:12px 18px;">
              <p style="margin:0;font-size:10px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.1em;">Order Date</p>
              <p style="margin:4px 0 0;font-size:15px;font-weight:800;color:#111827;">{order_date}</p>
            </div>
          </div>
          <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
            <thead><tr style="background:#111827;">
              <th style="padding:10px 8px;text-align:left;color:#fff;font-size:11px;text-transform:uppercase;">Item</th>
              <th style="padding:10px 8px;text-align:center;color:#fff;font-size:11px;text-transform:uppercase;">Qty</th>
              <th style="padding:10px 8px;text-align:right;color:#fff;font-size:11px;text-transform:uppercase;">Price</th>
              <th style="padding:10px 8px;text-align:right;color:#fff;font-size:11px;text-transform:uppercase;">Total</th>
            </tr></thead>
            <tbody>{items_rows_html}</tbody>
          </table>
          <div style="background:#111827;border-radius:10px;padding:14px 16px;margin-bottom:28px;display:flex;justify-content:space-between;">
            <span style="color:#fff;font-size:13px;font-weight:700;text-transform:uppercase;">Grand Total</span>
            <span style="color:#f43f5e;font-size:20px;font-weight:900;">&#8377;{total_amount:.2f}</span>
          </div>
          <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:14px 18px;margin-bottom:28px;">
            <p style="margin:0;font-size:13px;color:#166534;">&#128230; <strong>Estimated Delivery:</strong> 3-7 business days. Use your Tracking ID on our Track Order page.</p>
          </div>
          <p style="color:#9ca3af;font-size:12px;text-align:center;margin:0;">Questions? Email us at <a href="mailto:support@lacesandsoles.in" style="color:#f43f5e;">support@lacesandsoles.in</a></p>
        </div>
        <div style="background:#f9fafb;padding:18px 32px;text-align:center;border-top:1px solid #f3f4f6;">
          <p style="margin:0;font-size:11px;color:#9ca3af;">&copy; {datetime.utcnow().year} Laces &amp; Soles. All rights reserved.</p>
        </div>
      </div>
    </body></html>"""

    url = "https://api.brevo.com/v3/smtp/email"
    headers = {"accept": "application/json", "content-type": "application/json", "api-key": api_key}
    payload = {
        "sender": {"name": "Laces & Soles", "email": sender_email},
        "to": [{"email": receiver_email, "name": customer_name}],
        "subject": f"✅ Order Confirmed — {tracking_id} | Laces & Soles",
        "htmlContent": html
    }
    try:
        response = requests.post(url, json=payload, headers=headers)
        if response.status_code in [201, 202]:
            logger.info(f"Order confirmation email sent to {receiver_email}")
            return True
        else:
            logger.error(f"Brevo Error: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        logger.error(f"Order email failed: {e}")
        return False


# ─── AUTH ENDPOINTS ───
@app.route('/api/register', methods=['POST'])
@limiter.limit("5 per minute") # Strict limit for account creation
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

@app.route('/api/login', methods=['POST'])
@limiter.limit("10 per minute") # Brute-force protection for login
def login():
    data = request.get_json()
    user = User.query.filter_by(email=data.get('email')).first()
    if user and check_password_hash(user.password_hash, data.get('password')):
        access_token = create_access_token(identity=str(user.id))
        return jsonify({'message': 'Login successful!', 'token': access_token, 'user': user.to_dict()}), 200
    return jsonify({'error': 'Invalid email or password.'}), 401

@app.route('/api/google-login', methods=['POST'])
@limiter.limit("10 per minute")
def google_login():
    data = request.get_json()
    token = data.get('credential')
    client_id = os.environ.get('GOOGLE_CLIENT_ID')
    
    if not token:
        return jsonify({'error': 'Token is required'}), 400
    if not client_id:
        return jsonify({'error': 'Google Client ID not configured on server'}), 500

    try:
        # Verify the ID token using google-auth-library
        idinfo = id_token.verify_oauth2_token(token, google_requests.Request(), client_id)
        
        # ID token is valid. Get user details from it.
        email = idinfo['email']
        full_name = idinfo.get('name', 'Google User')
        
        # Check if user exists
        user = User.query.filter_by(email=email).first()
        
        if not user:
            # Create a new user for this Google account
            # We use a random password hash since they login via Google
            user = User(
                full_name=full_name,
                email=email,
                password_hash=generate_password_hash(os.urandom(24).hex()),
                role='user'
            )
            db.session.add(user)
            db.session.commit()
        
        # Issue local JWT
        access_token = create_access_token(identity=str(user.id))
        return jsonify({
            'message': 'Google Login successful!',
            'token': access_token,
            'user': user.to_dict()
        }), 200
        
    except ValueError as e:
        # Invalid token
        return jsonify({'error': f'Invalid token: {str(e)}'}), 401
    except Exception as e:
        logger.error(f"GOOGLE LOGIN ERROR: {str(traceback.format_exc())}")
        return jsonify({'error': 'An internal error occurred during Google authentication'}), 500

@app.route('/api/user/update', methods=['POST'])
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

@app.route('/api/facebook-login', methods=['POST'])
@limiter.limit("10 per minute")
def facebook_login():
    data = request.get_json()
    access_token = data.get('accessToken')
    
    if not access_token:
        return jsonify({'error': 'Access Token is required'}), 400

    # DEVELOPER MOCK MODE: If token is 'mock_token', return a dummy user
    if access_token == 'mock_token':
        logger.info("Using Facebook Mock Mode for login")
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
        # Verify the access token by calling Facebook Graph API
        fb_res = requests.get(
            f"https://graph.facebook.com/me?fields=id,name,email&access_token={access_token}",
            timeout=10
        )
        
        if fb_res.status_code != 200:
            return jsonify({'error': 'Invalid Facebook token'}), 401
            
        fb_data = fb_res.json()
        email = fb_data.get('email')
        full_name = fb_data.get('name', 'Facebook User')
        
        if not email:
            # Facebook users can sometimes not have an email or it's restricted
            # In a real app we'd handle this, for now we'll use their FB ID + placeholder
            email = f"{fb_data['id']}@facebook.com"
        
        # Check if user exists
        user = User.query.filter_by(email=email).first()
        
        if not user:
            # Create a new user
            user = User(
                full_name=full_name,
                email=email,
                password_hash=generate_password_hash(os.urandom(24).hex()),
                role='user'
            )
            db.session.add(user)
            db.session.commit()
        
        # Issue local JWT
        jwt_token = create_access_token(identity=str(user.id))
        return jsonify({
            'message': 'Facebook Login successful!',
            'token': jwt_token,
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        logger.error(f"FACEBOOK LOGIN ERROR: {str(traceback.format_exc())}")
        return jsonify({'error': 'An internal error occurred during Facebook authentication'}), 500

import traceback

@app.route('/api/forgot-password', methods=['POST'])
@limiter.limit("20 per hour")
def forgot_password():
    try:
        data = request.get_json()
        email = data.get('email')
        
        user = User.query.filter_by(email=email).first()
        if not user:
            # For security, don't confirm if email exists. Just say "If account exists, email sent"
            return jsonify({'message': 'If an account with that email exists, an OTP has been sent.'}), 200
    
        # Generate 6-digit OTP
        otp = str(random.randint(100000, 999999))
        expiry = datetime.utcnow() + timedelta(minutes=10)
        
        # Store or Update Reset Request
        reset_entry = PasswordReset.query.filter_by(email=email).first()
        if reset_entry:
            reset_entry.otp = otp
            reset_entry.expiry = expiry
            reset_entry.is_verified = False
        else:
            reset_entry = PasswordReset(email=email, otp=otp, expiry=expiry)
            db.session.add(reset_entry)
        
        db.session.commit()
        
        # Send Email
        if send_otp_email(email, otp):
            logger.info(f"OTP sent successfully to {email}")
            return jsonify({'message': 'OTP sent successfully!'}), 200
        else:
            logger.error(f"Failed to send OTP to {email}")
            return jsonify({'error': 'Failed to send OTP. Please try again later.'}), 500
    except Exception as e:
        logger.exception(f"FORGOT PASSWORD ERROR: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/verify-otp', methods=['POST'])
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

@app.route('/api/reset-password', methods=['POST'])
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
        db.session.delete(reset_entry) # Clear token after use
        db.session.commit()
        return jsonify({'message': 'Password reset successfully!'}), 200
    
    return jsonify({'error': 'User not found.'}), 404

# ─── PRODUCT ENDPOINTS ───
@app.route('/api/products', methods=['GET'])
def get_products():
    category = request.args.get('category')
    brand = request.args.get('brand')
    prod_type = request.args.get('type')
    collection = request.args.get('collection') # New
    min_price = request.args.get('min_price', type=float)
    max_price = request.args.get('max_price', type=float)
    search = request.args.get('search')
    sort = request.args.get('sort')
    page = request.args.get('page', 1, type=int)
    limit = request.args.get('limit', 1000, type=int)

    query = Product.query

    if category:
        query = query.filter(Product.category == category)
    if collection: # New
        query = query.filter(Product.collection == collection)
    if brand and brand.lower() != 'all':
        query = query.filter(Product.brand.ilike(brand))
    if prod_type:
        query = query.filter(Product.type == prod_type)
    if min_price is not None:
        query = query.filter(Product.price >= min_price)
    if max_price is not None:
        query = query.filter(Product.price <= max_price)
    if search:
        query = query.filter(
            (Product.title.ilike(f'%{search}%')) | 
            (Product.brand.ilike(f'%{search}%')) |
            (Product.description.ilike(f'%{search}%'))
        )

    if sort == 'price_asc':
        query = query.order_by(Product.price.asc())
    elif sort == 'price_desc':
        query = query.order_by(Product.price.desc())
    elif sort == 'newest':
        query = query.order_by(Product.created_at.desc())
    elif sort == 'popular':
        # Simple popularity based on rating for now
        query = query.order_by(Product.rating.desc())
    else:
        query = query.order_by(Product.created_at.desc())

    # Pagination
    total = query.count()
    products = query.offset((page - 1) * limit).limit(limit).all()

    return jsonify({
        'products': [p.to_dict() for p in products],
        'total': total,
        'page': page,
        'limit': limit,
        'pages': (total + limit - 1) // limit
    }), 200

@app.route('/api/products/<int:product_id>', methods=['GET'])
def get_product(product_id):
    product = db.session.get(Product, product_id)
    if not product:
        return jsonify({'error': 'Product not found'}), 404
    
    # Get reviews for this product
    reviews = Review.query.filter_by(product_id=product_id).order_by(Review.created_at.desc()).all()
    
    res = product.to_dict()
    res['reviews'] = [r.to_dict() for r in reviews]
    
    # Calculate average rating if reviews exist
    if reviews:
        res['rating'] = sum([r.rating for r in reviews]) / len(reviews)
    
    return jsonify({'product': res}), 200

@app.route('/api/products/<int:product_id>/reviews', methods=['POST'])
@jwt_required()
def add_review(product_id):
    user_id = int(get_jwt_identity())
    data = request.get_json()
    rating = data.get('rating')
    comment = data.get('comment')
    
    if not rating or not (1 <= rating <= 5):
        return jsonify({'error': 'Rating (1-5) is required'}), 400
        
    product = db.session.get(Product, product_id)
    if not product:
        return jsonify({'error': 'Product not found'}), 404
        
    review = Review(user_id=user_id, product_id=product_id, rating=rating, comment=comment)
    db.session.add(review)
    db.session.commit()
    
    return jsonify({'message': 'Review added successfully', 'review': review.to_dict()}), 201

UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), 'uploads')
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

def detect_brand_and_title(name_string):
    """
    Enhanced brand detection that checks for matches in folder or file names.
    Returns (brand, clean_title)
    """
    known_brands = [
        'Nike', 'Adidas', 'Puma', 'Reebok', 'Vans', 'Converse', 
        'Jordan', 'New Balance', 'Asics', 'Fila', 'Under Armour', 
        'Skechers', 'Brooks', 'Mizuno', 'Saucony'
    ]
    
    # Clean the input string (remove extensions, replace separators)
    name_clean = name_string.replace('_', ' ').replace('-', ' ').replace('.jpg', '').replace('.png', '').replace('.jpeg', '').split('.')[0]
    
    brand = 'Laces & Soles Exclusive' # Default brand
    title = name_clean.strip()
    
    for b in known_brands:
        if b.lower() in name_string.lower():
            brand = b
            # If the brand is in the name, try to strip it out for the title
            title = name_string.lower().replace(b.lower(), '').replace('_', ' ').replace('-', ' ').replace('.jpg', '').replace('.png', '').replace('.jpeg', '').strip()
            if not title: title = f"{brand} Classic"
            break
            
    # Final Title Casing
    title = ' '.join(word.capitalize() for word in title.split())
    return brand, title

@app.route('/api/products/bulk', methods=['POST'])
@jwt_required()
def bulk_add_products():
    current_user_id = int(get_jwt_identity())
    user = db.session.get(User, current_user_id)
    if not user or user.role != 'admin':
        return jsonify({'error': 'Unauthorized access to system core.'}), 403

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
        # Step 1: Extract all files/ZIPs into temp_dir
        for f in files:
            if f.filename.lower().endswith('.zip'):
                zip_path = os.path.join(temp_dir, secure_filename(f.filename))
                f.save(zip_path)
                with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                    # Filter out hidden system files (like __MACOSX)
                    valid_members = [m for m in zip_ref.namelist() if not m.startswith('__') and not '/.' in m]
                    zip_ref.extractall(temp_dir, members=valid_members)
                os.remove(zip_path)
            elif f.filename.lower().endswith(('.png', '.jpg', '.jpeg')):
                f.save(os.path.join(temp_dir, secure_filename(f.filename)))

        # Step 2: Recursive grouping - map leaf folder to its images
        product_groups = {} # path -> [list of image names]
        
        for root, dirs, filenames in os.walk(temp_dir):
            image_files = [fn for fn in filenames if fn.lower().endswith(('.png', '.jpg', '.jpeg'))]
            if image_files:
                product_groups[root] = sorted(image_files)

        # Step 3: Process each group as ONE product
        for folder_path, images in product_groups.items():
            try:
                # Group Metadata
                folder_name = os.path.basename(folder_path)
                parent_folder = os.path.basename(os.path.dirname(folder_path))
                
                # If the current folder IS the temp_dir, it's a flat upload
                is_flat = (folder_path == temp_dir)
                
                # Brand and Title detection - using folder name if structured, else filename
                target_name = folder_name if not is_flat else images[0]
                brand, title = detect_brand_and_title(target_name)
                
                # Inferred type from parent folder (e.g. running_shoes -> Sneakers)
                # If flat, use default 'sneakers'
                inferred_type = 'sneakers'
                if not is_flat and parent_folder and parent_folder != 'temp_bulk_extraction':
                    inferred_type = parent_folder.replace('_', ' ').replace('-', ' ').strip()

                # Multi-angle image handling
                saved_urls = []
                for img_name in images:
                    src_path = os.path.join(folder_path, img_name)
                    unique_name = f"bulk_{int(datetime.now().timestamp())}_{random.randint(100,999)}_{secure_filename(img_name)}"
                    dest_path = os.path.join(UPLOAD_FOLDER, unique_name)
                    shutil.move(src_path, dest_path)
                    saved_urls.append(f"http://localhost:5000/uploads/{unique_name}")

                if not saved_urls: continue

                # Pricing
                final_price = base_price
                if randomize:
                    final_price = base_price + random.randint(-500, 1500)
                    if final_price < 999: final_price = 1299

                # Create Product
                main_image = saved_urls[0]
                # If 'side.png' exists, use it as main
                for url in saved_urls:
                    if 'side' in url.lower():
                        main_image = url
                        break

                gallery_str = ",".join(saved_urls) # All images in gallery

                new_p = Product(
                    title=title,
                    price=float(final_price),
                    old_price=final_price + 2000, # Mock high MSRP for discount feel
                    brand=brand,
                    image_url=main_image,
                    gallery=gallery_str,
                    category=category,
                    type=inferred_type,
                    collection=collection,
                    stock=random.randint(10, 80),
                    description=f"Premium {brand} {title} performance footwear. Engineered for maximum comfort and style."
                )
                db.session.add(new_p)
                imported_count += 1
                logger.info(f"Imported Product: {title} ({brand}) with {len(saved_urls)} angles.")
                
            except Exception as e:
                logger.error(f"Error processing group {folder_path}: {e}")
                errors.append(f"Group {os.path.basename(folder_path)} failed: {str(e)}")

        db.session.commit()
    except Exception as e:
        logger.exception("Bulk Import Critical Failure")
        return jsonify({'error': f"System failure: {str(e)}"}), 500
    finally:
        if os.path.exists(temp_dir): shutil.rmtree(temp_dir)

    return jsonify({
        'message': f'Intelligence Import Complete! {imported_count} products added successfully.',
        'count': imported_count,
        'errors': errors
    }), 201

@app.route('/api/products', methods=['POST'])
@jwt_required()
def add_product():
    current_user_id = int(get_jwt_identity())
    user = db.session.get(User, current_user_id)
    if not user or user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
    
    title = request.form.get('title')
    price = request.form.get('price')
    old_price = request.form.get('oldPrice')
    brand = request.form.get('brand')
    badge = request.form.get('badge')
    image_file = request.files.get('image')

    if not all([title, price, brand]):
        return jsonify({'error': 'Missing title, price or brand'}), 400
    
    try:
        image_url = ''
        if image_file:
            filename = secure_filename(image_file.filename)
            filename = f"{int(datetime.now().timestamp())}_{filename}"
            image_path = os.path.join(UPLOAD_FOLDER, filename)
            image_file.save(image_path)
            image_url = f"http://localhost:5000/uploads/{filename}"
        else:
            return jsonify({'error': 'Image file is required'}), 400

        new_p = Product(
            title=title, 
            price=float(price), 
            old_price=old_price, 
            brand=brand, 
            image_url=image_url, 
            badge=badge
        )
        db.session.add(new_p)
        db.session.commit()
        return jsonify({'message': 'Product added', 'product': new_p.to_dict()}), 201
    except Exception as e:
        db.session.rollback()
        logger.exception("Error adding product")
        return jsonify({'error': str(e)}), 500


# ─── CART ENDPOINTS ───
@app.route('/api/cart', methods=['GET', 'POST', 'DELETE'])
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
            db.session.add(CartItem(user_id=user_id, product_id=product_id, quantity=quantity))
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

# ─── WISHLIST ENDPOINTS ───
@app.route('/api/wishlist', methods=['GET', 'POST', 'DELETE'])
@jwt_required()
def handle_wishlist():
    user_id = int(get_jwt_identity())
    if request.method == 'GET':
        items = WishlistItem.query.filter_by(user_id=user_id).all()
        return jsonify({'wishlist': [item.to_dict() for item in items]}), 200
    elif request.method == 'POST':
        product_id = request.get_json().get('product_id')
        if not WishlistItem.query.filter_by(user_id=user_id, product_id=product_id).first():
            db.session.add(WishlistItem(user_id=user_id, product_id=product_id))
            db.session.commit()
        return jsonify({'message': 'Added to wishlist'}), 200
    elif request.method == 'DELETE':
        product_id = request.args.get('product_id')
        WishlistItem.query.filter_by(user_id=user_id, product_id=product_id).delete()
        db.session.commit()
        return jsonify({'message': 'Removed from wishlist'}), 200

# ─── ORDER ENDPOINTS ───
@app.route('/api/validate_coupon', methods=['POST'])
def validate_coupon():
    data = request.get_json()
    code = data.get('code', '').upper()
    
    # Check database for active coupon
    coupon = Coupon.query.filter_by(code=code, is_active=True).first()
    if coupon:
        return jsonify({'valid': True, 'discount_percentage': coupon.discount_percentage, 'message': f'Coupon mostly applied! {coupon.discount_percentage}% off.'}), 200
    
    # Fallback simulation coupon
    if code == 'FLIPKART10':
        return jsonify({'valid': True, 'discount_percentage': 10, 'message': 'Flipkart Simulation Coupon applied! 10% off.'}), 200
        
    return jsonify({'valid': False, 'message': 'Invalid or expired coupon code.'}), 400

# ==========================================
# RAZORPAY INTEGRATION
# ==========================================

@app.route('/api/razorpay/create-order', methods=['POST'])
@jwt_required()
def create_razorpay_order():
    if not razorpay_client:
        return jsonify({'error': 'Razorpay not configured on server'}), 500
    
    user_id = int(get_jwt_identity())
    cart_items = CartItem.query.filter_by(user_id=user_id).all()
    if not cart_items:
        return jsonify({'error': 'Cart is empty'}), 400

    # Calculate Total
    total_price = 0
    for item in cart_items:
        if item.product:
            total_price += (item.product.price * item.quantity)
    
    # Add flat shipping fee (matching existing logic)
    if total_price > 0:
        total_price += 15.00

    # Razorpay expects amount in paise (1 INR = 100 paise)
    amount_paise = int(total_price * 100)

    try:
        razorpay_order = razorpay_client.order.create({
            "amount": amount_paise,
            "currency": "INR",
            "payment_capture": 1
        })
        return jsonify({
            'razorpay_order_id': razorpay_order['id'],
            'amount': total_price,
            'currency': 'INR'
        }), 200
    except Exception as e:
        logger.error(f"Razorpay Order Creation Failed: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/razorpay/verify-payment', methods=['POST'])
@jwt_required()
def verify_payment():
    data = request.get_json()
    razorpay_order_id = data.get('razorpay_order_id')
    razorpay_payment_id = data.get('razorpay_payment_id')
    razorpay_signature = data.get('razorpay_signature')
    shipping_details = data.get('shipping_details', {})

    if not all([razorpay_order_id, razorpay_payment_id, razorpay_signature]):
        return jsonify({'error': 'Missing payment verification details'}), 400

    try:
        # Verify Signature
        razorpay_client.utility.verify_payment_signature({
            'razorpay_order_id': razorpay_order_id,
            'razorpay_payment_id': razorpay_payment_id,
            'razorpay_signature': razorpay_signature
        })
        
        # Payment Verified! Now create the L&S orders using existing logic
        user_id = int(get_jwt_identity())
        cart_items = CartItem.query.filter_by(user_id=user_id).all()
        
        if not cart_items:
            return jsonify({'error': 'Cart empty after payment'}), 400

        pincode = shipping_details.get('pincode', shipping_details.get('zipCode', ''))
        address_str = f"{shipping_details.get('address', '')}, {shipping_details.get('city', '')}, {shipping_details.get('state', '')} {pincode}"
        
        created_orders = []
        distance_km = round(random.uniform(0.5, 8.0), 2)

        for index, item in enumerate(cart_items):
            # Generate Tracking ID
            chars = string.ascii_uppercase + string.digits
            rand_id = ''.join(random.choices(chars, k=8))
            unique_track_id = f"L&S-{rand_id}"

            item_total = (item.product.price * item.quantity)
            if index == 0:
                item_total += 15.00

            new_order = Order(
                user_id=user_id,
                total_amount=item_total,
                status='Processing', # Confirmed because paid
                shipping_address=address_str,
                pincode=pincode,
                tracking_id=unique_track_id,
                payment_method=f"Razorpay ({razorpay_payment_id})",
                distance_km=distance_km
            )
            db.session.add(new_order)
            db.session.flush()

            # Stock Management
            item.product.stock -= item.quantity
            
            # Create Order Item
            order_item = OrderItem(
                order_id=new_order.id,
                product_id=item.product_id,
                quantity=item.quantity,
                price=item.product.price
            )
            db.session.add(order_item)
            
            # Clear Cart Item
            db.session.delete(item)
            created_orders.append(new_order.to_dict())

        db.session.commit()
        return jsonify({
            'success': True, 
            'message': 'Payment verified and orders created',
            'orders': created_orders
        }), 200

    except Exception as e:
        logger.error(f"Payment Verification Failed: {e}")
        return jsonify({'error': 'Invalid payment signature or verification failed'}), 400

@app.route('/api/orders', methods=['GET', 'POST'])
@jwt_required()
def handle_orders():
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    if request.method == 'GET':
        orders = Order.query.filter_by(user_id=user_id).order_by(Order.created_at.desc()).all()
        return jsonify({'orders': [o.to_dict() for o in orders]}), 200
    elif request.method == 'POST':
        try:
            cart_items = CartItem.query.filter_by(user_id=user_id).all()
            if not cart_items:
                return jsonify({'error': 'Cart is empty'}), 400
            
            # Check stock and identify valid items
            valid_items = []
            for item in cart_items:
                if not item.product:
                    logger.warning(f"Removing orphaned cart item ID {item.id} for user {user_id}")
                    db.session.delete(item)
                    continue
                
                if item.product.stock < item.quantity:
                    return jsonify({'error': f"Insufficient stock for {item.product.title}. Only {item.product.stock} left."}), 400
                
                valid_items.append(item)

            if not valid_items:
                db.session.commit()
                return jsonify({'error': 'All items in your cart are no longer available.'}), 400

            data = request.get_json()
            shipping_details = data.get('shipping_details', {})
            pincode = shipping_details.get('pincode', shipping_details.get('zipCode', ''))
            # Format shipping details as a string for storage
            address_str = f"{shipping_details.get('address', '')}, {shipping_details.get('city', '')}, {shipping_details.get('state', '')} {pincode}"
            payment_method = data.get('payment_method', 'Unknown')
            
            # Sync phone number to user profile if missing
            user = db.session.get(User, user_id)
            if user and not user.phone_number:
                user.phone_number = shipping_details.get('phone')
                db.session.commit()

            # Mock Distance Calculation for Assignment
            distance_km = round(random.uniform(0.5, 8.0), 2)
            created_orders = []

            for index, item in enumerate(valid_items):
                # Generate a unique L&S tracking ID: L&S-ABC123XY
                chars = string.ascii_uppercase + string.digits
                rand_id = ''.join(random.choices(chars, k=8))
                unique_track_id = f"L&S-{rand_id}"

                # Calculate item total. Apply $15 shipping only to the first order to keep checkout total consistent.
                item_total = (item.product.price * item.quantity)
                if index == 0:
                    item_total += 15.00

                new_order = Order(
                    user_id=user_id, 
                    total_amount=item_total, 
                    status='Processing',
                    shipping_address=address_str,
                    pincode=pincode,
                    tracking_id=unique_track_id,
                    payment_method=payment_method,
                    distance_km=distance_km,
                    driver_id=None
                )
                db.session.add(new_order)
                db.session.flush()
                
                # Decrement stock
                item.product.stock -= item.quantity
                
                try:
                    # Real-time update to all clients
                    socketio.emit('inventory_updated', {
                        'product_id': item.product.id,
                        'new_stock': item.product.stock
                    })

                    # Live Purchase Notification toast
                    socketio.emit('new_purchase', {
                        'user_name': user.full_name,
                        'product_title': item.product.title,
                        'product_image': item.product.image_url,
                        'product_id': item.product.id
                    })
                except Exception as e:
                    logger.warning(f"Live notification failed: {e}")
                
                order_item = OrderItem(order_id=new_order.id, product_id=item.product_id, quantity=item.quantity, price=item.product.price)
                db.session.add(order_item)
                db.session.delete(item)

                created_orders.append(new_order)
            
            db.session.commit()

            # Emit general order event for admin dashboard metrics
            for o in created_orders:
                socketio.emit('order_placed', {
                    'order_id': o.id,
                    'total_amount': o.total_amount
                })

            # Fire order confirmation email
            try:
                send_order_confirmation_email(user.email, user.full_name, created_orders[0])
            except Exception as email_err:
                logger.error(f"Order email dispatch failed (non-fatal): {email_err}")

            return jsonify({'message': 'Order placed successfully!', 'order': created_orders[0].to_dict()}), 201
        except Exception as e:
            db.session.rollback()
            error_trace = traceback.format_exc()
            logger.error(f"CRITICAL ORDER FAILURE: {str(e)}\n{error_trace}")
            return jsonify({'error': 'Order processing failed', 'details': str(e)}), 500

@app.route('/api/orders/<int:order_id>', methods=['DELETE'])
@jwt_required()
def delete_order(order_id):
    current_identity = get_jwt_identity()
    if not current_identity:
        return jsonify({'error': 'Missing authentication token'}), 401
        
    user_id = int(current_identity)
    user = db.session.get(User, user_id)
    order = db.session.get(Order, order_id)
    
    if not order:
        return jsonify({'error': 'Order not found'}), 404
        
    # Allow deletion if:
    # 1. User is the owner
    # 2. User is an admin
    # 3. User is the assigned driver
    is_owner = order.user_id == user_id
    is_admin = user and user.role == 'admin'
    is_driver = order.driver_id == user_id
    
    if not (is_owner or is_admin or is_driver):
        return jsonify({'error': 'Unauthorized deletion attempt.'}), 403
         
    try:
        # DB Cascades should handle items, but just in case we manually drop items to be safe
        for item in order.items:
            db.session.delete(item)
        db.session.delete(order)
        db.session.commit()
        return jsonify({'message': 'Order completely removed from your history.'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to delete order', 'details': str(e)}), 500

@app.route('/api/orders/<int:order_id>/cancel', methods=['PATCH'])
@jwt_required()
def cancel_order(order_id):
    user_id = int(get_jwt_identity())
    order = db.session.get(Order, order_id)
    
    if not order:
        return jsonify({'error': 'Order not found'}), 404
        
    if order.user_id != user_id:
        return jsonify({'error': 'Unauthorized cancellation attempt.'}), 403
         
    if order.status in ['Shipped', 'Delivered', 'Cancelled']:
        return jsonify({'error': f'Cannot cancel an order that is already {order.status}.'}), 400
         
    try:
        order.status = 'Cancelled'
        # Refund stock capacity back into the system
        for item in order.items:
            item.product.stock += item.quantity
        db.session.commit()
        
        # Optionally broadcast the stock updates to all clients so store pages update live
        for item in order.items:
            socketio.emit('inventory_updated', {
                'product_id': item.product.id,
                'new_stock': item.product.stock
            })
            
        return jsonify({'message': 'Order successfully cancelled and stock restored.'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to cancel order', 'details': str(e)}), 500

# ─── ADMIN METRICS ───
@app.route('/api/admin/metrics', methods=['GET'])
@jwt_required()
def get_metrics():
    user = db.session.get(User, int(get_jwt_identity()))
    if not user or user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
    
    period = request.args.get('period', '7d')
    total_revenue = db.session.query(db.func.sum(Order.total_amount)).scalar() or 0.0
    
    from datetime import datetime, timedelta
    daily_stats = []
    
    if period == '7d':
        for i in range(6, -1, -1):
            day = datetime.now() - timedelta(days=i)
            day_str = day.strftime('%a')
            rev = db.session.query(db.func.sum(Order.total_amount)).filter(db.func.date(Order.created_at) == day.date()).scalar() or 0.0
            daily_stats.append({'name': day_str, 'revenue': float(rev)})
    elif period == '6m':
        for i in range(5, -1, -1):
            # First day of the month i months ago
            first_day = (datetime.now().replace(day=1) - timedelta(days=i*30)).replace(day=1)
            month_str = first_day.strftime('%b')
            # Sum for that month
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

@app.route('/api/admin/orders', methods=['GET'])
@jwt_required()
def get_admin_orders():
    identity = get_jwt_identity()
    current_user = db.session.get(User, int(identity))
    logger.debug(f"Admin Access Attempt by: {identity}, Role: {current_user.role if current_user else 'None'}")
    if not current_user or current_user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
    orders = Order.query.order_by(Order.created_at.desc()).all()
    return jsonify({'orders': [o.to_dict() for o in orders]}), 200

@app.route('/api/admin/orders/flash-approve', methods=['POST'])
@jwt_required()
def flash_approve_orders():
    current_user = db.session.get(User, int(get_jwt_identity()))
    if not current_user or current_user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
    
    # Get all pending/processing orders
    pending_orders = Order.query.filter(Order.status.in_(['Pending', 'Processing'])).all()
    if not pending_orders:
        return jsonify({'message': 'No pending orders to approve.'}), 200
    
    # Get all available drivers
    available_drivers = User.query.filter_by(role='driver').all()
    if not available_drivers:
        return jsonify({'error': 'No drivers found to assign orders to.'}), 400
    
    count = 0
    driver_index = 0
    num_drivers = len(available_drivers)
    
    for order in pending_orders:
        order.status = 'Out for Delivery'
        
        assigned_driver = None
        
        # 1. Try Geographic Matching
        if order.pincode:
            matching_drivers = []
            for d in available_drivers:
                if d.delivery_zones:
                    # Check if pincode is in comma-separated zones
                    zones = [z.strip() for z in d.delivery_zones.split(',')]
                    if order.pincode in zones:
                        matching_drivers.append(d)
            
            if matching_drivers:
                # If multiple drivers cover the same zone, we can round-robin among them 
                # or just pick the first available match for Flash Speed simplicity
                assigned_driver = matching_drivers[0]
        
        # 2. Fallback to Round-Robin if no geographic match found
        if not assigned_driver:
            assigned_driver = available_drivers[driver_index % num_drivers]
            driver_index += 1
            
        order.driver_id = assigned_driver.id
        count += 1
        
        # Notify via socket
        socketio.emit('status_updated', {
            'order_id': order.id,
            'status': 'Out for Delivery',
            'tracking_id': order.to_dict()['tracking_id']
        })

    db.session.commit()
    return jsonify({'message': f'Flash Speed Success! {count} orders intelligently distributed.'}), 200

@app.route('/api/admin/users/<int:user_id>', methods=['PUT'])
@jwt_required()
def update_user_details(user_id):
    current_user = db.session.get(User, int(get_jwt_identity()))
    if not current_user or current_user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
    
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
        
    data = request.get_json()
    if 'delivery_zones' in data:
        user.delivery_zones = data.get('delivery_zones')
    if 'role' in data:
        user.role = data.get('role')
        
    db.session.commit()
    return jsonify({'message': 'User updated successfully', 'user': user.to_dict()}), 200

@app.route('/api/admin/users', methods=['GET'])
@jwt_required()
def get_all_users():
    current_user = db.session.get(User, int(get_jwt_identity()))
    if not current_user or current_user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
    
    users = User.query.all()
    return jsonify({'users': [u.to_dict() for u in users]}), 200

@app.route('/api/products/<int:product_id>', methods=['DELETE'])
@jwt_required()
def delete_product(product_id):
    current_user = db.session.get(User, int(get_jwt_identity()))
    if not current_user or current_user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
    
    product = db.session.get(Product, product_id)
    if not product:
        return jsonify({'error': 'Product not found'}), 404
    
    try:
        db.session.delete(product)
        db.session.commit()
        return jsonify({'message': 'Product deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# ─── ORDER TRACKING ───
@app.route('/api/track/<string:tracking_id>', methods=['GET'])
def track_order(tracking_id):
    if not tracking_id.startswith('L&S'):
        return jsonify({'error': 'Invalid Tracking ID format. Must start with L&S.'}), 400
        
    # Find the specific order with this tracking ID
    order = Order.query.filter_by(tracking_id=tracking_id).first()
    if not order:
        return jsonify({'error': 'Tracking ID not found.'}), 404
        
    # Get all active orders for this user to maintain the "Shipment View" if desired
    # or just show this one order. Let's show all active for that user for continuity.
    user_id = order.user_id
    orders = Order.query.filter_by(user_id=user_id).filter(Order.status != 'Cancelled').order_by(Order.created_at.desc()).all()
    if not orders:
        return jsonify({'error': 'No active shipments found.'}), 404
        
    # Consolidate all items from all active orders
    all_items = []
    active_drivers = []
    active_driver_order = None
    
    for order in orders:
        for item in order.items:
            all_items.append({
                'title': item.product.title,
                'image': item.product.image_url,
                'brand': item.product.brand,
                'quantity': item.quantity,
                'price': item.price,
                'order_id': order.id,
                'status': order.status
            })
        if order.status == 'Out for Delivery' and order.driver_id:
            if not any(d['driver_id'] == order.driver_id for d in active_drivers):
                active_drivers.append({
                    'driver_id': order.driver_id,
                    'driver_lat': order.driver_lat,
                    'driver_lng': order.driver_lng,
                    'order_id': order.id
                })
            if not active_driver_order:
                active_driver_order = order

    # For status, use the "most advanced" status among orders
    status_priority = {'Pending': 0, 'Packed': 1, 'Shipped': 2, 'Out for Delivery': 3, 'Delivered': 4}
    current_order = orders[0] # Use the most recent one for metadata
    max_status = max(orders, key=lambda x: status_priority.get(x.status, 0)).status
    
    milestones = {
        'ordered': current_order.created_at.isoformat(),
        'packed': (current_order.created_at + timedelta(hours=2)).isoformat() if status_priority.get(max_status, 0) >= 1 else None,
        'shipped': (current_order.created_at + timedelta(hours=6)).isoformat() if status_priority.get(max_status, 0) >= 2 else None,
        'delivered': (current_order.created_at + timedelta(hours=24)).isoformat() if max_status == 'Delivered' else None,
    }
    
    return jsonify({
        'user_id': user_id,
        'tracking_id': tracking_id,
        'current_status': max_status,
        'milestones': milestones,
        'courier': 'Delhivery Prepaid',
        'items': all_items,
        'total_amount': sum(o.total_amount for o in orders),
        'shipping_address': current_order.shipping_address,
        'driver_lat': active_driver_order.driver_lat if active_driver_order else None,
        'driver_lng': active_driver_order.driver_lng if active_driver_order else None,
        'driver_id': active_driver_order.driver_id if active_driver_order else None,
        'active_drivers': active_drivers,
        'orders_count': len(orders)
    }), 200

# ─── DRIVER & LIVE TRACKING ENDPOINTS ───

@app.route('/api/admin/drivers', methods=['GET'])
@jwt_required()
def get_drivers():
    current_user = db.session.get(User, int(get_jwt_identity()))
    if not current_user or current_user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
    drivers = User.query.filter_by(role='driver').all()
    return jsonify({'drivers': [d.to_dict() for d in drivers]}), 200

@app.route('/api/admin/orders/<int:order_id>/assign', methods=['POST'])
@jwt_required()
def assign_driver(order_id):
    current_user = db.session.get(User, int(get_jwt_identity()))
    if not current_user or current_user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
        
    data = request.get_json()
    driver_id = data.get('driver_id')
    
    order = db.session.get(Order, order_id)
    if not order:
        return jsonify({'error': 'Order not found'}), 404
    
    order.driver_id = int(driver_id) if driver_id else None
    order.status = 'Packed' # Moving to next stage automatically
    db.session.commit()
    
    return jsonify({'message': 'Driver assigned successfully', 'order': order.to_dict()}), 200

@app.route('/api/driver/orders', methods=['GET'])
@jwt_required()
def get_driver_orders():
    driver_id = int(get_jwt_identity())
    user = db.session.get(User, driver_id)
    if not user or user.role != 'driver':
        return jsonify({'error': 'Unauthorized'}), 403
        
    orders = Order.query.filter_by(driver_id=driver_id).order_by(Order.created_at.desc()).all()
    return jsonify({'orders': [o.to_dict() for o in orders]}), 200

@app.route('/api/driver/orders/<int:order_id>/status', methods=['PATCH'])
@jwt_required()
def update_order_status(order_id):
    driver_id = int(get_jwt_identity())
    order = db.session.get(Order, order_id)
    if not order or order.driver_id != driver_id:
        return jsonify({'error': 'Order not found or unauthorized'}), 404
        
    data = request.get_json()
    new_status = data.get('status') # e.g. 'Out for Delivery', 'Delivered'
    
    if new_status not in ['Packed', 'Shipped', 'Out for Delivery', 'Delivered']:
        return jsonify({'error': 'Invalid status'}), 400
        
    # If marking as delivered, check if OTP was verified
    if new_status == 'Delivered' and not order.is_otp_verified:
        return jsonify({'error': 'OTP verification required before completing delivery'}), 400

    order.status = new_status
    db.session.commit()
    
    # Broadcast status change to the specific order room
    socketio.emit('status_updated', {'order_id': order.id, 'status': new_status}, room=f"order_{order.id}")
    
    return jsonify({'message': f'Order status updated to {new_status}'}), 200

import smtplib

def send_brevo_email(to_email, subject, body_html):
    """Sends a professional HTML email via Brevo HTTP API for maximum reliability."""
    sender_email = os.environ.get('BREVO_SENDER', 'lacesandsoles2026@gmail.com')
    api_key = os.environ.get('BREVO_API_KEY')

    if not api_key:
        logger.error("Missing BREVO_API_KEY in .env")
        return False

    url = "https://api.brevo.com/v3/smtp/email"
    headers = {
        "accept": "application/json",
        "content-type": "application/json",
        "api-key": api_key
    }
    payload = {
        "sender": {"name": "Laces & Soles", "email": sender_email},
        "to": [{"email": to_email}],
        "subject": subject,
        "htmlContent": body_html
    }

    try:
        response = requests.post(url, json=payload, headers=headers)
        if response.status_code in [201, 202]:
            return True
        else:
            logger.error(f"Brevo API Error: Status {response.status_code} - {response.text}")
            return False
    except Exception as e:
        logger.error(f"Brevo API Connection Error: {e}")
        return False

@app.route('/api/driver/orders/<int:order_id>/send-otp', methods=['POST'])
@jwt_required()
def send_delivery_otp(order_id):
    driver_id = int(get_jwt_identity())
    order = db.session.get(Order, order_id)
    if not order or order.driver_id != driver_id:
        return jsonify({'error': 'Order not found or unauthorized'}), 404
    
    # Generate 6-digit OTP
    otp = str(random.randint(100000, 999999))
    order.delivery_otp = otp
    db.session.commit()
    
    # Send OTP via Brevo Email
    customer_email = order.customer.email
    customer_name = order.customer.full_name
    tracking_id = f"FKT{5962051000 + (order.user_id * 133)}"
    
    email_body = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #ff3366; text-align: center; text-transform: uppercase;">Delivery Verification Code</h2>
        <p>Hello <strong>{customer_name}</strong>,</p>
        <p>Your order <strong>#{tracking_id}</strong> is ready for delivery! Please share the following verification code with our driver to receive your items:</p>
        <div style="background: #f9f9f9; padding: 20px; text-align: center; border-radius: 10px; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #333;">{otp}</span>
        </div>
        <p style="font-size: 12px; color: #888;">If you did not request this delivery, please ignore this email.</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="text-align: center; font-size: 14px; color: #ff3366; font-weight: bold;">Laces & Soles Boutique</p>
    </div>
    """
    
    email_sent = send_brevo_email(customer_email, f"OTP for Order #{tracking_id}", email_body)
    
    if email_sent:
        logger.info(f"DELIVERY OTP sent via Brevo to {customer_email}: {otp}")
        return jsonify({'message': 'OTP sent to customer via email!', 'otp': otp}), 200
    else:
        # Fallback to local log if email fails
        logger.warning(f"Email failed, OTP logged: {otp}")
        return jsonify({'message': 'OTP generated (Email failed, check dashboard)', 'otp': otp}), 200

@app.route('/api/driver/orders/<int:order_id>/verify-otp', methods=['POST'])
@jwt_required()
def verify_delivery_otp(order_id):
    driver_id = int(get_jwt_identity())
    order = db.session.get(Order, order_id)
    if not order or order.driver_id != driver_id:
        return jsonify({'error': 'Order not found or unauthorized'}), 404
    
    data = request.get_json()
    received_otp = data.get('otp')
    
    if order.delivery_otp == received_otp:
        order.is_otp_verified = True
        db.session.commit()
        return jsonify({'message': 'OTP verified successfully!', 'verified': True}), 200
    
    return jsonify({'error': 'Invalid OTP code. Please try again.', 'verified': False}), 400

# ─── SOCKET.IO REAL-TIME HANDLERS ───

@socketio.on('join_order_tracking')
def on_join(data):
    order_id = data.get('order_id')
    if order_id:
        from flask_socketio import join_room
        join_room(f"order_{order_id}")
        logger.info(f"User joined tracking room for order {order_id}")

@socketio.on('update_driver_location')
def on_location_update(data):
    # Driver sends: { order_id, lat, lng }
    order_id = data.get('order_id')
    lat = data.get('lat')
    lng = data.get('lng')
    
    if all([order_id, lat, lng]):
        order = db.session.get(Order, order_id)
        if order:
            order.driver_lat = lat
            order.driver_lng = lng
            db.session.commit()
            
            # Broadcast to all users tracking THIS specific order
            emit('location_broadcast', {
                'order_id': order_id,
                'lat': lat,
                'lng': lng
            }, room=f"order_{order_id}")
            # logger.debug(f"Broadcasted location for order {order_id}: {lat}, {lng}")

@app.route('/', methods=['GET'])
def home():
    return "<h1>API Running</h1>", 200

if __name__ == '__main__':
    socketio.run(app, debug=True, port=5000, allow_unsafe_werkzeug=True)

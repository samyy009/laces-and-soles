from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_socketio import SocketIO
import razorpay
import os

db = SQLAlchemy()

# Shared instances to avoid circular imports
limiter = Limiter(key_func=get_remote_address, storage_uri="memory://")
socketio = SocketIO(cors_allowed_origins="*", async_mode='threading')

# Razorpay Client
RAZORPAY_KEY_ID = os.environ.get('RAZORPAY_KEY_ID', 'rzp_test_placeholder')
RAZORPAY_KEY_SECRET = os.environ.get('RAZORPAY_KEY_SECRET', 'placeholder_secret')

try:
    razorpay_client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))
except Exception:
    razorpay_client = None

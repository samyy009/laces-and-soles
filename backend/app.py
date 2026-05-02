import logging
import os
from datetime import timedelta
from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from dotenv import load_dotenv

from extensions import db, limiter, socketio
from models import User

# Initialize Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()

def create_app():
    app = Flask(__name__)
    
    # Database Configuration
    db_url = os.environ.get("DATABASE_URL")
    if db_url:
        if db_url.startswith("postgres://"):
            db_url = db_url.replace("postgres://", "postgresql://", 1)
        app.config['SQLALCHEMY_DATABASE_URI'] = db_url
        app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {"connect_args": {"sslmode": "require"}, "pool_pre_ping": True, "pool_recycle": 300}
    else:
        DB_USER = os.environ.get('DB_USER', 'postgres')
        DB_PASSWORD = os.environ.get('DB_PASSWORD', 'root')
        DB_HOST = os.environ.get('DB_HOST', 'localhost')
        DB_NAME = os.environ.get('DB_NAME', 'laces_and_soles')
        app.config['SQLALCHEMY_DATABASE_URI'] = f'postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}/{DB_NAME}'
    
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev_secret_key')
    app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY', 'dev_jwt_key')
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=24)

    # Initialize Extensions
    db.init_app(app)
    jwt = JWTManager(app)
    limiter.init_app(app)
    socketio.init_app(app)
    
    from sockets import init_sockets
    init_sockets(socketio)

    # CORS
    if os.environ.get('FLASK_ENV') == 'development':
        CORS(app, resources={r"/*": {"origins": "*"}})
    else:
        frontend_url = os.environ.get('FRONTEND_URL', '*')
        CORS(app, resources={r"/*": {"origins": [frontend_url, "http://localhost:5173"]}})

    # Register Blueprints
    from routes.auth_routes import auth_bp
    from routes.product_routes import product_bp
    from routes.order_routes import order_bp
    from routes.admin_routes import admin_bp
    from routes.driver_routes import driver_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(product_bp)
    app.register_blueprint(order_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(driver_bp)

    # Static folder for uploads
    @app.route('/uploads/<path:filename>')
    def uploaded_file(filename):
        return send_from_directory('uploads', filename)

    @app.route('/')
    def home():
        return "<h1>Laces & Soles API Running</h1>", 200

    return app

app = create_app()

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    socketio.run(app, debug=True, port=5000, allow_unsafe_werkzeug=True)

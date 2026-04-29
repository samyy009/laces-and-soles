import os
import sys
import urllib.parse
from flask import Flask
from dotenv import load_dotenv
from werkzeug.security import generate_password_hash

# Set paths
base_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.join(base_dir, 'backend')
sys.path.append(backend_dir)

from models import db, User

load_dotenv(os.path.join(backend_dir, '.env'))

app = Flask(__name__)
MYSQL_USER = os.environ.get('DB_USER', 'root')
MYSQL_PASSWORD = os.environ.get('DB_PASSWORD', 'root')
MYSQL_HOST = os.environ.get('DB_HOST', 'localhost')
MYSQL_DB = os.environ.get('DB_NAME', 'laces_and_soles')
encoded_password = urllib.parse.quote_plus(MYSQL_PASSWORD)
app.config['SQLALCHEMY_DATABASE_URI'] = f'mysql+pymysql://{MYSQL_USER}:{encoded_password}@{MYSQL_HOST}/{MYSQL_DB}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)

with app.app_context():
    admin = User.query.filter_by(email='admin@laces.com').first()
    if admin:
        admin.password_hash = generate_password_hash('admin')
        db.session.commit()
        print("Updated admin@laces.com password to 'admin'")
    else:
        print("Admin not found.")

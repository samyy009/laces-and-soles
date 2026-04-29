import os
import sys
import urllib.parse
from flask import Flask
from dotenv import load_dotenv

# Set paths
base_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.join(base_dir, 'backend')
sys.path.append(backend_dir)

from models import db, Order, User

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
    # Find the order we created (most recent Hubli 580020)
    order = Order.query.filter(Order.pincode == '580020').order_by(Order.id.desc()).first()
    if order:
        print(f"Order {order.tracking_id} Status: {order.status}")
        if order.driver:
            print(f"Assigned Driver: {order.driver.full_name} (Zones: {order.driver.delivery_zones})")
            if "580020" in order.driver.delivery_zones:
                print("SUCCESS: Flash Speed correctly matched the Hubli zone!")
            else:
                print("FAILED: Driver assigned but zone mismatch.")
        else:
            print("FAILED: Order still unassigned.")
    else:
        print("Error: Could not find the test order.")

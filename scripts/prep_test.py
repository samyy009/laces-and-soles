import os
import sys
import urllib.parse
from flask import Flask
from dotenv import load_dotenv

# Set paths
base_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.join(base_dir, 'backend')
sys.path.append(backend_dir)

from models import db, User, Order

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
    # 1. Setup a driver for Hubli City (580020)
    driver = User.query.filter_by(role='driver').first()
    if not driver:
        print("Error: No driver found in database.")
        sys.exit(1)
    
    print(f"Testing with Driver: {driver.full_name}")
    driver.delivery_zones = "580020"
    db.session.commit()
    print(f"Assigned zone 580020 to {driver.full_name}")

    # 2. Find a pending order or create one? 
    # Let's just find the most recent pending order and set its zip to 580020
    order = Order.query.filter(Order.status == 'Processing').order_by(Order.id.desc()).first()
    if not order:
        print("No pending orders found. Please place an order first.")
        sys.exit(1)
    
    print(f"Testing with Order ID: {order.id} (Current Zip: {order.zip_code})")
    order.zip_code = "580020"
    order.driver_id = None # Ensure unassigned
    db.session.commit()
    print(f"Set Order {order.id} zip to 580020")

    # 3. Import flash_approve and run it
    # We need to import it from backend.app, but that might cause recursion
    # Let's just copy the logic here for the test or call the endpoint?
    # Calling the endpoint is better.
    
    print("\n--- Simulation Complete ---")
    print("Now go to the Admin Dashboard and click 'Flash Speed'.")
    print(f"Expectation: Order {order.id} should be assigned to {driver.full_name}")

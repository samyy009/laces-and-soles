import os
import sys
import urllib.parse
from flask import Flask
from dotenv import load_dotenv

# Set paths
base_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.join(base_dir, 'backend')
sys.path.append(backend_dir)

from models import db, User, Order, Product, OrderItem

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
    # 1. Ensure driver is ready
    driver = User.query.filter_by(role='driver').first()
    if driver:
        driver.delivery_zones = "580020"
    
    # 2. Find a user to place order for
    customer = User.query.filter_by(role='user').first()
    if not customer:
        customer = User(full_name="Test Customer", email="test@hubli.com", password_hash="...", role="user")
        db.session.add(customer)
        db.session.commit()

    # 3. Find a product
    product = Product.query.first()
    
    # 4. Create Order
    import random
    import string
    tid = "L&S-" + ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))
    
    new_order = Order(
        user_id=customer.id,
        shipping_address="Hubli Main Road",
        pincode="580020",
        total_amount=product.price if product else 2499.0,
        status="Processing",
        tracking_id=tid
    )
    db.session.add(new_order)
    db.session.flush()
    
    if product:
        item = OrderItem(
            order_id=new_order.id,
            product_id=product.id,
            quantity=1,
            price=product.price
        )
        db.session.add(item)
    
    db.session.commit()
    
    print(f"Created Test Order: {tid} for Hubli (580020)")
    if driver:
        print(f"Driver {driver.full_name} is assigned to zone 580020")
    print("\nNext: Run the 'Flash Speed' logic to see if it assigns automatically.")

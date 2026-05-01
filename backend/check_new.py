from app import app
from models import User, Order, Product
from datetime import datetime, timedelta

with app.app_context():
    now = datetime.utcnow()
    yesterday = now - timedelta(hours=24)
    
    new_users = User.query.filter(User.created_at > yesterday).count()
    new_orders = Order.query.filter(Order.created_at > yesterday).count()
    new_products = Product.query.filter(Product.created_at > yesterday).count()
    
    print(f"New Users (24h): {new_users}")
    print(f"New Orders (24h): {new_orders}")
    print(f"New Products (24h): {new_products}")
    
    total_users = User.query.count()
    total_orders = Order.query.count()
    total_products = Product.query.count()
    
    print(f"Total Users: {total_users}")
    print(f"Total Orders: {total_orders}")
    print(f"Total Products: {total_products}")

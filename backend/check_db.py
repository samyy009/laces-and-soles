
from app import app, db
from models import Product, User, Order, CartItem

def check_status():
    with app.app_context():
        print(f"Products in DB: {Product.query.count()}")
        print(f"Users in DB: {User.query.count()}")
        print(f"Orders in DB: {Order.query.count()}")
        
        # Check if Admin exists
        admin = User.query.filter_by(email='admin@laces.com').first()
        print(f"Admin User exists: {admin is not None}")
        
        if Product.query.count() == 0:
            print("DB is empty! Seeding may have failed.")

if __name__ == "__main__":
    check_status()

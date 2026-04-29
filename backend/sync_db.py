from app import app, db
from models import Product, User, Order, OrderItem, CartItem, WishlistItem, Review, PasswordReset, Coupon

with app.app_context():
    print("Dropping all tables...")
    db.drop_all()
    print("Creating all tables...")
    db.create_all()
    print("Database sync complete. Run app.py to seed.")

import os
import sys
import json
from flask import Flask
from dotenv import load_dotenv

base_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.join(base_dir, 'backend')
scripts_dir = os.path.join(base_dir, 'scripts')
from backend.models import db, Product, User
from werkzeug.security import generate_password_hash

load_dotenv(os.path.join(backend_dir, '.env'))

app = Flask(__name__)
# The app.py connection string will be picked up correctly because we use exactly what's in backend/.env
DB_USER = os.environ.get('DB_USER', 'postgres')
DB_PASSWORD = os.environ.get('DB_PASSWORD', 'root')
DB_HOST = os.environ.get('DB_HOST', 'localhost')
DB_NAME = os.environ.get('DB_NAME', 'laces_and_soles')

import urllib.parse
encoded_password = urllib.parse.quote_plus(DB_PASSWORD)
app.config['SQLALCHEMY_DATABASE_URI'] = f'postgresql://{DB_USER}:{encoded_password}@{DB_HOST}/{DB_NAME}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)

with app.app_context():
    # Create all tables
    db.create_all()
    print("PostgreSQL Tables created successfully.")

    # 1. Seed Products from master_products.json
    try:
        with open(os.path.join(scripts_dir, 'master_products.json'), 'r') as f:
            products_data = json.load(f)
        
        # Check if already seeded
        if Product.query.count() == 0:
            for p_data in products_data:
                existing = Product.query.get(p_data['id'])
                if not existing:
                    product = Product(
                        id=p_data['id'],
                        title=p_data['title'],
                        brand=p_data['brand'],
                        price=float(p_data['price']),
                        image_url=p_data.get('image_url', p_data.get('gallery', [''])[0] if p_data.get('gallery') else ''),
                        category=p_data.get('category', 'men'),
                        type=p_data['type'],
                        stock=int(p_data['stock']),
                        rating=float(p_data['rating']),
                        discount=int(p_data.get('discount', 0)),
                        reviews_count=int(p_data.get('reviews_count', 0)),
                        description=p_data['description'],
                        colors=','.join(p_data.get('colors', [])),
                        sizes=','.join(p_data.get('sizes', [])),
                        collection=p_data.get('collection', 'Main'),
                        gallery=','.join(p_data.get('gallery', []))
                    )
                    db.session.add(product)
            db.session.commit()
            print(f"Successfully seeded {len(products_data)} products into PostgreSQL.")
        else:
            print("Products already seeded.")
    except Exception as e:
        print(f"Error seeding products: {e}")

    # 2. Ensure Admin User exists
    if not User.query.filter_by(email='admin@laces.com').first():
        admin = User(
            full_name="Admin",
            email="admin@laces.com",
            password_hash=generate_password_hash("admin"),
            role="admin"
        )
        db.session.add(admin)
        db.session.commit()
        print("Admin user created (admin@laces.com / admin).")

    # 3. Ensure Driver User exists for Hubli logic
    if not User.query.filter_by(role='driver').first():
        driver = User(
            full_name="Flash Speed",
            email="flash@laces.com",
            password_hash=generate_password_hash("driver"),
            role="driver",
            delivery_zones="580020, 580028, 580030"
        )
        db.session.add(driver)
        db.session.commit()
        print("Driver user 'Flash Speed' created for Hubli zones.")

    print("\nPostgreSQL Database is fully initialized and ready!")

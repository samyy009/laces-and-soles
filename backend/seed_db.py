import json
import os
import random
from app import app, db
from models import Product, User
from werkzeug.security import generate_password_hash

def seed():
    with app.app_context():
        print("Starting manual seed...")
        
        # Ensure administrator exists
        admin = User.query.filter_by(role='admin').first()
        if not admin:
            admin = User(
                full_name='Administrator',
                email='admin@laces.com',
                password_hash=generate_password_hash('admin123'),
                role='admin'
            )
            db.session.add(admin)

        # Products Seed
        json_path = os.path.join(os.path.dirname(__file__), '..', 'src', 'content.json')
        if os.path.exists(json_path):
            with open(json_path, 'r', encoding='utf-8') as f:
                content_data = json.load(f)
                items = content_data.get('products', {}).get('items', [])
                
                # Clear existing products to re-seed with new pricing
                print("Clearing existing products...")
                Product.query.delete()
                
                for i, item in enumerate(items):
                    brand = item.get('brand', 'Generic')
                    
                    # Pricing Logic based on Brand
                    if brand in ['Nike', 'Jordan']:
                        price = random.randint(6000, 9000)
                    elif brand in ['Adidas', 'Asics']:
                        price = random.randint(4000, 6500)
                    elif brand in ['Puma', 'Reebok']:
                        price = random.randint(2500, 4500)
                    else:
                        price = random.randint(1900, 3500)
                    
                    # Add retail rounding to nearest 99
                    price = (price // 100) * 100 + 99
                    
                    # Calculate old_price (MRP) based on a random discount factor
                    discount_pct = random.choice([0, 10, 20, 30])
                    if discount_pct > 0:
                         old_price = int(price / (1 - discount_pct/100))
                    else:
                         old_price = None

                    category = 'men' if i % 2 == 0 else 'women'
                    prod_type = 'sneakers' if i % 3 == 0 else ('sports' if i % 3 == 1 else 'casual')
                    
                    p = Product(
                        title=item['title'], 
                        price=float(price), 
                        old_price=float(old_price) if old_price else None, 
                        brand=brand, 
                        image_url=item['image'], 
                        badge=item.get('badge'),
                        category=category,
                        type=prod_type,
                        description=f"Inspired by the early 2000s original, the {brand} {item['title']} is designed for maximum comfort and style. Featuring high-quality materials and a whole lot of personality.",
                        colors="Red,Black,White,Blue",
                        sizes="6,7,8,9,10,11,12",
                        stock=random.randint(5, 15),
                        discount=discount_pct,
                        reviews_count=random.randint(10, 200),
                        gallery=f"{item['image']},{item['image']},{item['image']},{item['image']}"
                    )
                    db.session.add(p)
        
        db.session.commit()
        print(f"Seeding complete! Added {Product.query.count()} products.")

if __name__ == "__main__":
    seed()

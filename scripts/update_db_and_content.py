import json
import os
import sys
import random
import urllib.parse

# ──────────────────────────────────────────────
# Standalone Flask app — does NOT import app.py
# This avoids circular import issues with Flask-SocketIO,
# Flask-Limiter, and other extensions in app.py.
# ──────────────────────────────────────────────
PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR  = os.path.join(PROJECT_ROOT, 'backend')

# Load .env manually
def load_env(path):
    if not os.path.exists(path):
        return
    with open(path) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                k, v = line.split('=', 1)
                os.environ.setdefault(k.strip(), v.strip())

load_env(os.path.join(BACKEND_DIR, '.env'))

from flask import Flask
from flask_sqlalchemy import SQLAlchemy

DB_USER     = os.environ.get('DB_USER', 'root')
DB_PASSWORD = os.environ.get('DB_PASSWORD', 'root')
DB_HOST     = os.environ.get('DB_HOST', 'localhost')
DB_NAME     = os.environ.get('DB_NAME', 'laces_and_soles')

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = (
    f"mysql+pymysql://{DB_USER}:{urllib.parse.quote_plus(DB_PASSWORD)}@{DB_HOST}/{DB_NAME}"
)
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Import models with THIS app's db instance
sys.path.insert(0, BACKEND_DIR)
from models import db, Product, CartItem, WishlistItem, Review, OrderItem  # type: ignore

db.init_app(app)

# ──────────────────────────────────────────────
# Brand → Collection mapping
# ──────────────────────────────────────────────
BRAND_COLLECTION_MAP = {
    'nike':        'urban-explorer',
    'adidas':      'performance-pro',
    'reebok':      'vintage-luxe',
    'puma':        'summer-breeze',
    'asics':       'winter-shield',
    'new balance': 'winter-shield',
    'jordan':      'junior-series',
    'converse':    'junior-series',
    'vans':        'junior-series',
}

# ──────────────────────────────────────────────
# 1. Update content.json
# ──────────────────────────────────────────────
master_products_path = os.path.join(PROJECT_ROOT, 'master_products.json')
with open(master_products_path, 'r') as f:
    master_prods = json.load(f)

content_path = os.path.join(PROJECT_ROOT, 'src', 'content.json')
with open(content_path, 'r', encoding='utf-8') as f:
    content = json.load(f)

content['products']['items'] = master_prods

with open(content_path, 'w', encoding='utf-8') as f:
    json.dump(content, f, indent=2)

print(f"content.json updated with {len(master_prods)} products.")

# ──────────────────────────────────────────────
# 2. Reset database and re-seed
# ──────────────────────────────────────────────
with app.app_context():
    # Clear dependent tables first
    CartItem.query.delete()
    WishlistItem.query.delete()
    Review.query.delete()
    OrderItem.query.delete()
    Product.query.delete()
    db.session.commit()

    # Re-seed with full product data + collection assignment
    for i, item in enumerate(master_prods):
        brand_key  = (item.get('brand') or '').lower().strip()
        collection = BRAND_COLLECTION_MAP.get(brand_key, 'junior-series')

        # Assign specialized gallery for ALL Shoes based on Brand
        image_val = item['image']
        gallery_val = f"{image_val},{image_val},{image_val},{image_val}"
        
        # Expanded Multi-Angle Mapping
        # Performance/Sporty Set
        if any(b in item['brand'] for b in ["Adidas", "Puma", "Reebok", "Under Armour", "Asics"]):
            image_val = "/assets/products/adidas_black_1.png" if "Edition 11" in item['title'] else item['image']
            gallery_val = "/assets/products/adidas_black_1.png,/assets/products/adidas_black_2.png,/assets/products/adidas_black_3.png,/assets/products/adidas_black_4.png"
        
        # Lifestyle/Streetwear Set
        elif any(b in item['brand'] for b in ["Nike", "Jordan", "New Balance", "Converse", "Vans"]):
            image_val = "/assets/products/nike_white_1.png" if "Edition 1" in item['title'] else item['image']
            gallery_val = f"{image_val},/assets/products/nike_white_1.png,/assets/products/nike_white_2.png,{image_val}"

        # Default fallback
        else:
            gallery_val = f"{image_val},{image_val},{image_val},{image_val}"

        p = Product(
            title        = item['title'],
            price        = item['price'],
            old_price    = item.get('oldPrice'),
            brand        = item['brand'],
            image_url    = image_val,
            badge        = item.get('badge'),
            category     = item.get('category', 'men' if i % 2 == 0 else 'women'),
            type         = item.get('type', 'sneakers'),
            description  = item.get('description', f"Premium {item['brand']} footwear for style and performance."),
            colors       = item.get('colors', 'Red,Black,White,Blue'),
            sizes        = item.get('sizes', '6,7,8,9,10,11,12'),
            stock        = item.get('stock', random.randint(5, 20)),
            discount     = item.get('discount', 0),
            reviews_count= item.get('reviews_count', random.randint(10, 200)),
            collection   = collection,
            gallery      = gallery_val
        )
        db.session.add(p)

    db.session.commit()
    print(f"Database seeded with {len(master_prods)} products across 6 collections.")

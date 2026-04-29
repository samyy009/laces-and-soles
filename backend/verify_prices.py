from backend.app import app, db
from backend.models import Product

with app.app_context():
    products = Product.query.all()
    print(f"Total products: {len(products)}")
    for p in products:
        print(f"Brand: {p.brand:10} | Title: {p.title:30} | Price: ₹{p.price:8.2f} | MRP: ₹{p.old_price if p.old_price else 0:8.2f}")

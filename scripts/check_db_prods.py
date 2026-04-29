import sys
import os

# Add the current directory to sys.path
sys.path.append(os.getcwd())
sys.path.append(os.path.join(os.getcwd(), 'backend'))

try:
    from backend.models import db, Product
    from backend.app import app
    
    with app.app_context():
        prods = Product.query.limit(10).all()
        print(f"Total products in sample: {len(prods)}")
        for p in prods:
            print(f"ID: {p.id}, Title: {p.title}, Category: {p.category}, Price: {p.price}")
            
        print("\nCategory counts:")
        from sqlalchemy import func
        counts = db.session.query(Product.category, func.count(Product.category)).group_by(Product.category).all()
        for cat, count in counts:
            print(f"  {cat}: {count}")

except Exception as e:
    print(f"Error: {e}")

import os
import sys
import json
from dotenv import load_dotenv

# Load backend/.env for DB credentials and keys
load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

# Add current directory to path for imports
sys.path.append(os.path.dirname(__file__))

from app import app
from models import db, Product

def sync_images():
    # Path to content.json (up one level from backend, then into src)
    content_path = os.path.join(os.path.dirname(__file__), '..', 'src', 'content.json')
    
    if not os.path.exists(content_path):
        print(f"Error: {content_path} not found.")
        return

    try:
        with open(content_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            items = data.get('products', {}).get('items', [])
            
        print(f"Loaded {len(items)} items from content.json")
        
        with app.app_context():
            updated_count = 0
            for item in items:
                product_id = item.get('id')
                local_image = item.get('image')
                
                if not product_id or not local_image:
                    continue
                
                # Find product in DB
                product = db.session.get(Product, product_id)
                if product:
                    # Update all relevant fields
                    product.title = item.get('title', product.title)
                    product.brand = item.get('brand', product.brand)
                    product.description = item.get('description', product.description)
                    product.image_url = local_image
                    
                    # Create a dummy gallery if none exists, using the same image 4 times
                    product.gallery = f"{local_image},{local_image},{local_image},{local_image}"
                    updated_count += 1
            
            db.session.commit()
            print(f"Successfully updated image paths for {updated_count} products.")
            
    except Exception as e:
        print(f"Sync failed: {e}")

if __name__ == "__main__":
    sync_images()

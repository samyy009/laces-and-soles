import os
import pymysql
import json
from dotenv import load_dotenv

load_dotenv()

DB_USER = os.environ.get('DB_USER', 'root')
DB_PASSWORD = os.environ.get('DB_PASSWORD', 'root')
DB_HOST = os.environ.get('DB_HOST', 'localhost')
DB_NAME = os.environ.get('DB_NAME', 'laces_and_soles')

def seed_details():
    try:
        connection = pymysql.connect(
            host=DB_HOST,
            user=DB_USER,
            password=DB_PASSWORD,
            database=DB_NAME
        )
        with connection.cursor() as cursor:
            # Update each product with some varied data
            cursor.execute("SELECT id, title, brand FROM products")
            products = cursor.fetchall()
            
            for p_id, title, brand in products:
                # Basic logic for categories/types based on title
                category = 'men' # Default
                if 'women' in title.lower() or 'girl' in title.lower():
                    category = 'women'
                
                prod_type = 'sneakers'
                if 'running' in title.lower() or 'sports' in title.lower():
                    prod_type = 'sports'
                elif 'slipper' in title.lower() or 'sandal' in title.lower():
                    prod_type = 'sandals'
                elif 'leather' in title.lower() or 'formal' in title.lower():
                    prod_type = 'formal'
                
                desc = f"Experience ultimate comfort and style with these {prod_type} from {brand}. These {title} are designed for durability and performance."
                colors = "Red,Black,White,Blue"
                sizes = "7,8,9,10,11,12"
                
                cursor.execute(
                    "UPDATE products SET category=%s, type=%s, description=%s, colors=%s, sizes=%s, stock=15, rating=4.5 WHERE id=%s",
                    (category, prod_type, desc, colors, sizes, p_id)
                )
            
            connection.commit()
            print(f"Updated {len(products)} products with secondary details.")
            
    except Exception as e:
        print(f"Seeding failed: {e}")
    finally:
        if 'connection' in locals():
            connection.close()

if __name__ == "__main__":
    seed_details()

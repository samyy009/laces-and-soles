import os
import pymysql
from dotenv import load_dotenv

load_dotenv()

DB_USER = os.environ.get('DB_USER', 'root')
DB_PASSWORD = os.environ.get('DB_PASSWORD', 'root')
DB_HOST = os.environ.get('DB_HOST', 'localhost')
DB_NAME = os.environ.get('DB_NAME', 'laces_and_soles')

def migrate():
    try:
        connection = pymysql.connect(
            host=DB_HOST,
            user=DB_USER,
            password=DB_PASSWORD,
            database=DB_NAME
        )
        with connection.cursor() as cursor:
            # 1. Add Column
            print("Checking/Adding 'collection' column to 'products' table...")
            try:
                cursor.execute("ALTER TABLE products ADD COLUMN collection VARCHAR(100)")
                print("Column 'collection' added.")
            except pymysql.err.InternalError as e:
                if e.args[0] == 1060:
                    print("Column 'collection' already exists.")
                else:
                    raise e
            
            # 2. Seed Data
            print("Seeding collections...")
            collections = [
                'urban-explorer', 'performance-pro', 'vintage-luxe', 
                'summer-breeze', 'winter-shield', 'junior-series'
            ]
            
            cursor.execute("SELECT id FROM products")
            p_ids = [row[0] for row in cursor.fetchall()]
            
            for i, p_id in enumerate(p_ids):
                # Distribute products across collections
                coll = collections[i % len(collections)]
                cursor.execute("UPDATE products SET collection=%s WHERE id=%s", (coll, p_id))
            
            connection.commit()
            print(f"Successfully assigned {len(p_ids)} products to {len(collections)} collections.")
            
    except Exception as e:
        print(f"Migration failed: {e}")
    finally:
        if 'connection' in locals():
            connection.close()

if __name__ == "__main__":
    migrate()

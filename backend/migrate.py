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
            print("Adding new columns to 'products' table...")
            
            columns_to_add = [
                "ADD COLUMN category VARCHAR(50) NOT NULL DEFAULT 'men'",
                "ADD COLUMN type VARCHAR(50) NOT NULL DEFAULT 'sneakers'",
                "ADD COLUMN stock INT DEFAULT 10",
                "ADD COLUMN rating FLOAT DEFAULT 4.5",
                "ADD COLUMN description TEXT",
                "ADD COLUMN colors VARCHAR(255)",
                "ADD COLUMN sizes VARCHAR(255)"
            ]
            
            for col in columns_to_add:
                try:
                    cursor.execute(f"ALTER TABLE products {col}")
                    print(f"Executed: {col}")
                except pymysql.err.InternalError as e:
                    if e.args[0] == 1060: # Column already exists
                        print(f"Column already exists, skipping: {col.split(' ')[2]}")
                    else:
                        print(f"Error adding column: {e}")
            
            connection.commit()
            print("Migration complete!")
            
    except Exception as e:
        print(f"Connection failed: {e}")
    finally:
        if 'connection' in locals():
            connection.close()

if __name__ == "__main__":
    migrate()

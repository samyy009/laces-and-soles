import pymysql
import os
from dotenv import load_dotenv

# Load from the directory where this script is located
dotenv_path = os.path.join(os.path.dirname(__file__), '.env')
load_dotenv(dotenv_path)

def migrate():
    try:
        conn = pymysql.connect(
            host=os.getenv('DB_HOST', 'localhost'),
            user=os.getenv('DB_USER', 'root'),
            password=os.getenv('DB_PASSWORD', 'root'),
            database=os.getenv('DB_NAME', 'laces_and_soles'),
            port=int(os.getenv('DB_PORT', 3306))
        )
        cursor = conn.cursor()
        
        print("Checking for missing columns in 'users' table...")
        
        cursor.execute("DESCRIBE users")
        columns = [col[0] for col in cursor.fetchall()]
        
        needed_columns = [
            ('address', 'TEXT'),
            ('city', 'VARCHAR(100)'),
            ('state', 'VARCHAR(100)'),
            ('zip_code', 'VARCHAR(20)')
        ]
        
        for col_name, col_type in needed_columns:
            if col_name not in columns:
                print(f"Adding column '{col_name}'...")
                cursor.execute(f"ALTER TABLE users ADD COLUMN {col_name} {col_type} NULL")
                print(f"Successfully added '{col_name}'")
            else:
                print(f"Column '{col_name}' already exists.")
                
        conn.commit()
        conn.close()
        print("Migration complete.")
    except Exception as e:
        print(f"Migration failed: {e}")

if __name__ == "__main__":
    migrate()

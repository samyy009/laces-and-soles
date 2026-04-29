import sqlite3
import os

db_path = os.path.join(os.path.dirname(__file__), 'products.db')

def migrate():
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    print("Checking for missing columns in 'users' table...")
    
    # Check current columns
    cursor.execute("PRAGMA table_info(users)")
    columns = [col[1] for col in cursor.fetchall()]
    
    needed_columns = [
        ('address', 'TEXT'),
        ('city', 'VARCHAR(100)'),
        ('state', 'VARCHAR(100)'),
        ('zip_code', 'VARCHAR(20)')
    ]
    
    for col_name, col_type in needed_columns:
        if col_name not in columns:
            print(f"Adding column '{col_name}'...")
            try:
                cursor.execute(f"ALTER TABLE users ADD COLUMN {col_name} {col_type}")
                print(f"Successfully added '{col_name}'")
            except Exception as e:
                print(f"Error adding '{col_name}': {e}")
        else:
            print(f"Column '{col_name}' already exists.")
            
    conn.commit()
    conn.close()
    print("Migration complete.")

if __name__ == "__main__":
    migrate()

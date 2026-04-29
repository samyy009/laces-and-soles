import pymysql
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

host = os.getenv('DB_HOST', 'localhost')
user = os.getenv('DB_USER', 'root')
password = os.getenv('DB_PASSWORD', '')
db_name = os.getenv('DB_NAME', 'laces_and_soles')

print(f"Connecting to {db_name} on {host} as {user}...")

try:
    conn = pymysql.connect(
        host=host, 
        user=user, 
        password=password, 
        database=db_name,
        cursorclass=pymysql.cursors.DictCursor
    )
    cursor = conn.cursor()

    # Helper to check if column exists
    def column_exists(table, column):
        cursor.execute(f"SHOW COLUMNS FROM {table} LIKE '{column}'")
        return cursor.fetchone() is not None

    # Columns to add to 'orders' table
    columns_to_add = [
        ('driver_id', 'INT DEFAULT NULL'),
        ('driver_lat', 'FLOAT DEFAULT NULL'),
        ('driver_lng', 'FLOAT DEFAULT NULL'),
        ('shipping_address', 'TEXT DEFAULT NULL'),
        ('payment_method', 'VARCHAR(50) DEFAULT NULL')
    ]

    for col_name, col_def in columns_to_add:
        if not column_exists('orders', col_name):
            print(f"Adding column {col_name} to orders table...")
            cursor.execute(f"ALTER TABLE orders ADD COLUMN {col_name} {col_def}")
        else:
            print(f"Column {col_name} already exists in orders table.")

    # Add foreign key for driver_id if it doesn't exist
    try:
        cursor.execute("ALTER TABLE orders ADD CONSTRAINT fk_orders_driver FOREIGN KEY (driver_id) REFERENCES users(id)")
        print("Added foreign key constraint for driver_id.")
    except Exception as e:
        if "Duplicate foreign key constraint name" in str(e) or "already exists" in str(e).lower():
            print("Foreign key constraint for driver_id already exists.")
        else:
            print(f"Warning adding foreign key: {e}")

    conn.commit()
    print("Database schema updated successfully!")

except Exception as e:
    print(f"CRITICAL ERROR: {e}")
finally:
    if 'conn' in locals():
        conn.close()

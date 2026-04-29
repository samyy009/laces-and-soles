import pymysql
from dotenv import load_dotenv
import os

load_dotenv()

def fix_db():
    try:
        connection = pymysql.connect(
            host=os.getenv('DB_HOST', 'localhost'),
            user=os.getenv('DB_USER', 'root'),
            password=os.getenv('DB_PASSWORD', 'root@123'),
            database=os.getenv('DB_NAME', 'laces_and_soles'),
            charset='utf8mb4',
            cursorclass=pymysql.cursors.DictCursor
        )
        
        with connection.cursor() as cursor:
            print("Adding missing columns to 'users' table...")
            # Add columns to users table
            try:
                cursor.execute("ALTER TABLE users ADD COLUMN driver_range VARCHAR(50) NULL")
                print("Added 'driver_range' to 'users'")
            except Exception as e:
                print(f"Note: 'driver_range' might already exist: {e}")
                
            try:
                cursor.execute("ALTER TABLE users ADD COLUMN phone_number VARCHAR(20) NULL")
                print("Added 'phone_number' to 'users'")
            except Exception as e:
                print(f"Note: 'phone_number' might already exist: {e}")

            print("\nAdding missing columns to 'orders' table...")
            # Add columns to orders table
            try:
                cursor.execute("ALTER TABLE orders ADD COLUMN distance_km FLOAT NULL")
                print("Added 'distance_km' to 'orders'")
            except Exception as e:
                print(f"Note: 'distance_km' might already exist: {e}")
                
            try:
                cursor.execute("ALTER TABLE orders ADD COLUMN delivery_otp VARCHAR(6) NULL")
                print("Added 'delivery_otp' to 'orders'")
            except Exception as e:
                print(f"Note: 'delivery_otp' might already exist: {e}")
                
            try:
                cursor.execute("ALTER TABLE orders ADD COLUMN is_otp_verified BOOLEAN DEFAULT FALSE")
                print("Added 'is_otp_verified' to 'orders'")
            except Exception as e:
                print(f"Note: 'is_otp_verified' might already exist: {e}")

            connection.commit()
            print("\nDatabase schema updated successfully!")

    except Exception as e:
        print(f"Error updating database: {e}")
    finally:
        if 'connection' in locals():
            connection.close()

if __name__ == "__main__":
    fix_db()

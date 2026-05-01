
from app import app, db
from sqlalchemy import text, inspect

def fix_schema():
    with app.app_context():
        inspector = inspect(db.engine)
        columns = [c['name'] for c in inspector.get_columns('orders')]
        print(f"Current columns in 'orders': {columns}")
        
        # Orders Table
        missing_orders = {
            'created_at': 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
            'distance_km': 'FLOAT',
            'delivery_otp': 'VARCHAR(6)',
            'is_otp_verified': 'BOOLEAN DEFAULT FALSE',
            'failure_reason': 'VARCHAR(255)',
            'return_reason': 'VARCHAR(255)',
            'cancellation_reason': 'VARCHAR(255)',
            'shipping_address': 'TEXT',
            'pincode': 'VARCHAR(20)',
            'payment_method': 'VARCHAR(50)'
        }
        
        for col, col_type in missing_orders.items():
            if col not in columns:
                print(f"Adding missing column to 'orders': {col}")
                try:
                    db.session.execute(text(f"ALTER TABLE orders ADD COLUMN {col} {col_type}"))
                    db.session.commit()
                except Exception as e:
                    db.session.rollback()
                    print(f"Error adding {col} to orders: {e}")

        # Products Table
        prod_columns = [c['name'] for c in inspector.get_columns('products')]
        missing_products = {
            'stock': 'INTEGER DEFAULT 10',
            'discount': 'FLOAT DEFAULT 0',
            'reviews_count': 'INTEGER DEFAULT 0'
        }
        for col, col_type in missing_products.items():
            if col not in prod_columns:
                print(f"Adding missing column to 'products': {col}")
                try:
                    db.session.execute(text(f"ALTER TABLE products ADD COLUMN {col} {col_type}"))
                    db.session.commit()
                except Exception as e:
                    db.session.rollback()
                    print(f"Error adding {col} to products: {e}")

        # User Table
        user_columns = [c['name'] for c in inspector.get_columns('users')]
        missing_users = {
            'phone_number': 'VARCHAR(20)',
            'address': 'TEXT',
            'city': 'VARCHAR(100)',
            'state': 'VARCHAR(100)',
            'zip_code': 'VARCHAR(20)'
        }
        for col, col_type in missing_users.items():
            if col not in user_columns:
                print(f"Adding missing column to 'users': {col}")
                try:
                    db.session.execute(text(f"ALTER TABLE users ADD COLUMN {col} {col_type}"))
                    db.session.commit()
                except Exception as e:
                    db.session.rollback()
                    print(f"Error adding {col} to users: {e}")

if __name__ == "__main__":
    fix_schema()

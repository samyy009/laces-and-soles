from app import app, db
from sqlalchemy import text

with app.app_context():
    try:
        db.session.execute(text("ALTER TABLE orders ADD COLUMN tracking_id VARCHAR(50)"))
        db.session.execute(text("CREATE UNIQUE INDEX ix_orders_tracking_id ON orders (tracking_id)"))
        db.session.commit()
        print("Column tracking_id added to orders successfully.")
    except Exception as e:
        print(f"Error or already exists: {e}")

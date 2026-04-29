from app import app, db
from models import Order
import random, string

with app.app_context():
    orders = Order.query.filter(Order.tracking_id == None).all()
    for o in orders:
        chars = string.ascii_uppercase + string.digits
        rand_id = ''.join(random.choices(chars, k=8))
        o.tracking_id = f"L&S-{rand_id}"
    db.session.commit()
    print(f"Backfilled {len(orders)} orders with new L&S IDs.")

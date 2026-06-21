import os
import sys
import urllib.parse
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

# Add parent dir to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from models import User, Product, Coupon, NewsletterSubscriber, Order, OrderItem, Review, EmailLog

load_dotenv()

# 1. Database Connections
DB_USER = os.environ.get('DB_USER', 'postgres')
DB_PASSWORD = os.environ.get('DB_PASSWORD', 'root')
DB_HOST = os.environ.get('DB_HOST', 'localhost')
DB_NAME = os.environ.get('DB_NAME', 'laces_and_soles')
encoded_password = urllib.parse.quote_plus(DB_PASSWORD)
local_url = f'postgresql://{DB_USER}:{encoded_password}@{DB_HOST}/{DB_NAME}'

neon_url = "postgresql://neondb_owner:npg_HTZOF5eWY7vt@ep-divine-term-ao7tomnz-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

print("Connecting to local database...")
local_engine = create_engine(local_url)
LocalSession = sessionmaker(bind=local_engine)
local_session = LocalSession()

print("Connecting to Neon production database...")
neon_engine = create_engine(neon_url)
NeonSession = sessionmaker(bind=neon_engine)
neon_session = NeonSession()

# 2. Sync Users
print("\n--- Syncing Users ---")
local_users = local_session.query(User).all()
print(f"Found {len(local_users)} users locally.")

for lu in local_users:
    # Check if user exists in production
    pu = neon_session.query(User).filter_by(email=lu.email).first()
    if not pu:
        print(f"Creating user in production: {lu.email} ({lu.role})")
        pu = User()
        pu.full_name = lu.full_name
        pu.email = lu.email
        pu.password_hash = lu.password_hash
        pu.role = lu.role
        pu.driver_range = lu.driver_range
        pu.delivery_zones = lu.delivery_zones
        pu.phone_number = lu.phone_number
        pu.address = lu.address
        pu.city = lu.city
        pu.state = lu.state
        pu.zip_code = lu.zip_code
        pu.created_at = lu.created_at
        neon_session.add(pu)
    else:
        print(f"Updating user in production: {lu.email}")
        pu.full_name = lu.full_name
        pu.password_hash = lu.password_hash
        pu.role = lu.role
        pu.driver_range = lu.driver_range
        pu.delivery_zones = lu.delivery_zones
        pu.phone_number = lu.phone_number
        pu.address = lu.address
        pu.city = lu.city
        pu.state = lu.state
        pu.zip_code = lu.zip_code

# 3. Sync Products
print("\n--- Syncing Products ---")
local_products = local_session.query(Product).all()
print(f"Found {len(local_products)} products locally.")

for lp in local_products:
    pp = neon_session.query(Product).filter_by(id=lp.id).first()
    if not pp:
        print(f"Creating product in production: {lp.title} (ID: {lp.id})")
        pp = Product()
        pp.id = lp.id
        pp.title = lp.title
        pp.price = lp.price
        pp.old_price = lp.old_price
        pp.brand = lp.brand
        pp.image_url = lp.image_url
        pp.badge = lp.badge
        pp.category = lp.category
        pp.type = lp.type
        pp.stock = lp.stock
        pp.rating = lp.rating
        pp.description = lp.description
        pp.colors = lp.colors
        pp.sizes = lp.sizes
        pp.collection = lp.collection
        pp.gallery = lp.gallery
        pp.discount = lp.discount
        pp.reviews_count = lp.reviews_count
        pp.created_at = lp.created_at
        neon_session.add(pp)
    else:
        print(f"Updating product in production: {lp.title} (ID: {lp.id})")
        pp.title = lp.title
        pp.price = lp.price
        pp.old_price = lp.old_price
        pp.brand = lp.brand
        pp.image_url = lp.image_url
        pp.badge = lp.badge
        pp.category = lp.category
        pp.type = lp.type
        pp.stock = lp.stock
        pp.rating = lp.rating
        pp.description = lp.description
        pp.colors = lp.colors
        pp.sizes = lp.sizes
        pp.collection = lp.collection
        pp.gallery = lp.gallery
        pp.discount = lp.discount
        pp.reviews_count = lp.reviews_count

# 4. Sync Coupons
print("\n--- Syncing Coupons ---")
local_coupons = local_session.query(Coupon).all()
print(f"Found {len(local_coupons)} coupons locally.")

for lc in local_coupons:
    pc = neon_session.query(Coupon).filter_by(code=lc.code).first()
    if not pc:
        print(f"Creating coupon in production: {lc.code}")
        pc = Coupon()
        pc.code = lc.code
        pc.discount_percentage = lc.discount_percentage
        pc.is_active = lc.is_active
        neon_session.add(pc)
    else:
        print(f"Updating coupon in production: {lc.code}")
        pc.discount_percentage = lc.discount_percentage
        pc.is_active = lc.is_active

# 5. Sync Newsletter Subscribers
print("\n--- Syncing Newsletter Subscribers ---")
local_subscribers = local_session.query(NewsletterSubscriber).all()
print(f"Found {len(local_subscribers)} subscribers locally.")

for ls in local_subscribers:
    ps = neon_session.query(NewsletterSubscriber).filter_by(email=ls.email).first()
    if not ps:
        print(f"Creating subscriber in production: {ls.email}")
        ps = NewsletterSubscriber()
        ps.email = ls.email
        ps.created_at = ls.created_at
        neon_session.add(ps)

# 6. Sync Orders
print("\n--- Syncing Orders ---")
local_orders = local_session.query(Order).all()
print(f"Found {len(local_orders)} orders locally.")

for lo in local_orders:
    po = neon_session.query(Order).filter_by(id=lo.id).first()
    if not po:
        print(f"Creating order in production: ID {lo.id} for User {lo.user_id}")
        po = Order()
        po.id = lo.id
        po.user_id = lo.user_id
        po.total_amount = lo.total_amount
        po.status = lo.status
        po.driver_id = lo.driver_id
        po.driver_lat = lo.driver_lat
        po.driver_lng = lo.driver_lng
        po.shipping_address = lo.shipping_address
        po.pincode = lo.pincode
        po.tracking_id = lo.tracking_id
        po.payment_method = lo.payment_method
        po.distance_km = lo.distance_km
        po.delivery_otp = lo.delivery_otp
        po.is_otp_verified = lo.is_otp_verified
        po.failure_reason = lo.failure_reason
        po.return_reason = lo.return_reason
        po.cancellation_reason = lo.cancellation_reason
        po.created_at = lo.created_at
        neon_session.add(po)
    else:
        print(f"Updating order in production: ID {lo.id}")
        po.user_id = lo.user_id
        po.total_amount = lo.total_amount
        po.status = lo.status
        po.driver_id = lo.driver_id
        po.driver_lat = lo.driver_lat
        po.driver_lng = lo.driver_lng
        po.shipping_address = lo.shipping_address
        po.pincode = lo.pincode
        po.tracking_id = lo.tracking_id
        po.payment_method = lo.payment_method
        po.distance_km = lo.distance_km
        po.delivery_otp = lo.delivery_otp
        po.is_otp_verified = lo.is_otp_verified
        po.failure_reason = lo.failure_reason
        po.return_reason = lo.return_reason
        po.cancellation_reason = lo.cancellation_reason
        po.created_at = lo.created_at

# 7. Sync Order Items
print("\n--- Syncing Order Items ---")
local_items = local_session.query(OrderItem).all()
print(f"Found {len(local_items)} order items locally.")

for li in local_items:
    pi = neon_session.query(OrderItem).filter_by(id=li.id).first()
    if not pi:
        print(f"Creating order item in production: ID {li.id} for Order {li.order_id}")
        pi = OrderItem()
        pi.id = li.id
        pi.order_id = li.order_id
        pi.product_id = li.product_id
        pi.quantity = li.quantity
        pi.price = li.price
        neon_session.add(pi)
    else:
        print(f"Updating order item in production: ID {li.id}")
        pi.order_id = li.order_id
        pi.product_id = li.product_id
        pi.quantity = li.quantity
        pi.price = li.price

# 8. Sync Reviews
print("\n--- Syncing Reviews ---")
local_reviews = local_session.query(Review).all()
print(f"Found {len(local_reviews)} reviews locally.")

for lr in local_reviews:
    pr = neon_session.query(Review).filter_by(id=lr.id).first()
    if not pr:
        print(f"Creating review in production: ID {lr.id} by User {lr.user_id}")
        pr = Review()
        pr.id = lr.id
        pr.user_id = lr.user_id
        pr.product_id = lr.product_id
        pr.rating = lr.rating
        pr.comment = lr.comment
        pr.created_at = lr.created_at
        neon_session.add(pr)
    else:
        print(f"Updating review in production: ID {lr.id}")
        pr.user_id = lr.user_id
        pr.product_id = lr.product_id
        pr.rating = lr.rating
        pr.comment = lr.comment
        pr.created_at = lr.created_at

# 9. Sync Email Logs
print("\n--- Syncing Email Logs ---")
try:
    local_logs = local_session.query(EmailLog).all()
    print(f"Found {len(local_logs)} email logs locally.")

    for ll in local_logs:
        pl = neon_session.query(EmailLog).filter_by(id=ll.id).first()
        if not pl:
            print(f"Creating email log in production: ID {ll.id}")
            pl = EmailLog()
            pl.id = ll.id
            pl.recipient = ll.recipient
            pl.subject = ll.subject
            pl.email_type = ll.email_type
            pl.status = ll.status
            pl.error_msg = ll.error_msg
            pl.created_at = ll.created_at
            neon_session.add(pl)
        else:
            print(f"Updating email log in production: ID {ll.id}")
            pl.recipient = ll.recipient
            pl.subject = ll.subject
            pl.email_type = ll.email_type
            pl.status = ll.status
            pl.error_msg = ll.error_msg
            pl.created_at = ll.created_at
except Exception as e:
    print(f"Skipping email logs sync (table might not exist locally): {e}")

# 10. Commit Transactions
try:
    print("\nSaving changes to Neon production database...")
    neon_session.commit()
    print("Database sync to Neon completed successfully!")
except Exception as e:
    neon_session.rollback()
    print(f"Error during commit: {e}")
finally:
    local_session.close()
    neon_session.close()

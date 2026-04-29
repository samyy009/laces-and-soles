from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    full_name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), default='user') # 'user', 'admin', or 'driver'
    driver_range = db.Column(db.String(50), nullable=True) # 'short', 'mid', 'long'
    delivery_zones = db.Column(db.Text, nullable=True) # comma separated zip codes e.g. "110001, 110002"
    phone_number = db.Column(db.String(20), nullable=True)
    address = db.Column(db.Text, nullable=True)
    city = db.Column(db.String(100), nullable=True)
    state = db.Column(db.String(100), nullable=True)
    zip_code = db.Column(db.String(20), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    orders = db.relationship('Order', backref='customer', lazy=True, foreign_keys='Order.user_id')
    assigned_deliveries = db.relationship('Order', backref='driver', lazy=True, foreign_keys='Order.driver_id')
    cart_items = db.relationship('CartItem', backref='user', lazy=True)
    wishlist_items = db.relationship('WishlistItem', backref='user', lazy=True)
    reviews = db.relationship('Review', backref='user', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'full_name': self.full_name,
            'email': self.email,
            'role': self.role,
            'driver_range': self.driver_range,
            'delivery_zones': self.delivery_zones,
            'phone_number': self.phone_number,
            'address': self.address,
            'city': self.city,
            'state': self.state,
            'zip_code': self.zip_code,
            'created_at': self.created_at.isoformat() + 'Z' if self.created_at else None
        }

class Product(db.Model):
    __tablename__ = 'products'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    price = db.Column(db.Float, nullable=False)
    old_price = db.Column(db.Float, nullable=True)
    brand = db.Column(db.String(100), nullable=False)
    image_url = db.Column(db.Text, nullable=False)
    badge = db.Column(db.String(50), nullable=True)
    category = db.Column(db.String(50), nullable=False, default='men')
    type = db.Column(db.String(50), nullable=False, default='sneakers')
    stock = db.Column(db.Integer, default=10)
    rating = db.Column(db.Float, default=4.5)
    description = db.Column(db.Text, nullable=True)
    colors = db.Column(db.String(255), nullable=True) # comma separated
    sizes = db.Column(db.String(255), nullable=True)  # comma separated
    collection = db.Column(db.String(100), nullable=True) # e.g. 'urban-explorer'
    gallery = db.Column(db.Text, nullable=True) # comma separated image URLs
    discount = db.Column(db.Float, default=0) # percentage discount
    reviews_count = db.Column(db.Integer, default=10) # mock review count
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    reviews = db.relationship('Review', backref='product', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'price': self.price,
            'oldPrice': self.old_price,
            'brand': self.brand,
            'image': self.image_url,
            'badge': self.badge,
            'category': self.category,
            'type': self.type,
            'stock': self.stock,
            'rating': self.rating,
            'discount': self.discount,
            'reviews_count': self.reviews_count,
            'description': self.description,
            'colors': self.colors.split(',') if self.colors else [],
            'sizes': self.sizes.split(',') if self.sizes else [],
            'collection': self.collection,
            'gallery': self.gallery.split(',') if self.gallery else []
        }

class Order(db.Model):
    __tablename__ = 'orders'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    total_amount = db.Column(db.Float, nullable=False)
    status = db.Column(db.String(50), default='Pending') # Pending, Packed, Shipped, Out for Delivery, Delivered, Cancelled
    driver_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    driver_lat = db.Column(db.Float, nullable=True)
    driver_lng = db.Column(db.Float, nullable=True)
    shipping_address = db.Column(db.Text, nullable=True)
    pincode = db.Column(db.String(20), nullable=True)
    tracking_id = db.Column(db.String(50), unique=True, nullable=True)
    payment_method = db.Column(db.String(50), nullable=True)
    
    # New Fields for Delivery Confirmation
    distance_km = db.Column(db.Float, nullable=True)
    delivery_otp = db.Column(db.String(6), nullable=True)
    is_otp_verified = db.Column(db.Boolean, default=False)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    items = db.relationship('OrderItem', backref='order', lazy=True)
    # The backrefs 'customer' and 'driver' are defined in the User model relationships above

    def to_dict(self):
        return {
            'id': self.id,
            'tracking_id': self.tracking_id or f"L&S-{self.id}",
            'user_id': self.user_id,
            'customer_name': self.customer.full_name if self.customer else 'N/A',
            'customer_email': self.customer.email if self.customer else 'N/A',
            'customer_phone': self.customer.phone_number if self.customer else 'N/A',
            'total_amount': self.total_amount,
            'status': self.status,
            'driver_id': self.driver_id,
            'driver_name': self.driver.full_name if self.driver else 'Unassigned',
            'driver_lat': self.driver_lat,
            'driver_lng': self.driver_lng,
            'distance_km': self.distance_km,
            'delivery_otp': self.delivery_otp,
            'is_otp_verified': self.is_otp_verified,
            'shipping_address': self.shipping_address,
            'pincode': self.pincode,
            'payment_method': self.payment_method,
            'created_at': self.created_at.isoformat() + 'Z' if self.created_at else None,
            'items': [item.to_dict() for item in self.items]
        }

class OrderItem(db.Model):
    __tablename__ = 'order_items'
    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey('orders.id'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False)
    quantity = db.Column(db.Integer, nullable=False, default=1)
    price = db.Column(db.Float, nullable=False) # price at time of purchase
    
    product = db.relationship('Product')

    def to_dict(self):
        return {
            'id': self.id,
            'product': self.product.to_dict() if self.product else None,
            'quantity': self.quantity,
            'price': self.price
        }

class CartItem(db.Model):
    __tablename__ = 'cart_items'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False)
    quantity = db.Column(db.Integer, nullable=False, default=1)
    
    product = db.relationship('Product')

    def to_dict(self):
        return {
            'id': self.id,
            'product': self.product.to_dict() if self.product else None,
            'quantity': self.quantity
        }

class WishlistItem(db.Model):
    __tablename__ = 'wishlist_items'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False)
    
    product = db.relationship('Product')

    def to_dict(self):
        return {
            'id': self.id,
            'product': self.product.to_dict() if self.product else None
        }

class Review(db.Model):
    __tablename__ = 'reviews'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id', ondelete='CASCADE'), nullable=False)
    rating = db.Column(db.Integer, nullable=False)
    comment = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'user': self.user.full_name if self.user else 'Anonymous',
            'rating': self.rating,
            'comment': self.comment,
            'date': self.created_at.strftime('%Y-%m-%d %H:%M:%S')
        }

class PasswordReset(db.Model):
    __tablename__ = 'password_resets'
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), nullable=False)
    otp = db.Column(db.String(6), nullable=False)
    expiry = db.Column(db.DateTime, nullable=False)
    is_verified = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def is_expired(self):
        return datetime.utcnow() > self.expiry

class Coupon(db.Model):
    __tablename__ = 'coupons'
    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(50), unique=True, nullable=False)
    discount_percentage = db.Column(db.Float, nullable=False)
    is_active = db.Column(db.Boolean, default=True)

    def to_dict(self):
        return {
            'id': self.id,
            'code': self.code,
            'discount_percentage': self.discount_percentage,
            'is_active': self.is_active
        }

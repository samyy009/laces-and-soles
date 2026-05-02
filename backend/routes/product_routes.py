from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
import logging

from extensions import db
from models import Product, Review, Order, OrderItem

logger = logging.getLogger(__name__)
product_bp = Blueprint('products', __name__)

@product_bp.route('/api/products', methods=['GET'])
def get_products():
    category = request.args.get('category')
    brand = request.args.get('brand')
    prod_type = request.args.get('type')
    collection = request.args.get('collection')
    min_price = request.args.get('min_price', type=float)
    max_price = request.args.get('max_price', type=float)
    search = request.args.get('search')
    sort = request.args.get('sort')
    page = request.args.get('page', 1, type=int)
    limit = request.args.get('limit', 1000, type=int)

    query = Product.query

    if category:
        query = query.filter(Product.category == category)
    if collection:
        query = query.filter(Product.collection == collection)
    if brand and brand.lower() != 'all':
        query = query.filter(Product.brand.ilike(brand))
    if prod_type:
        query = query.filter(Product.type == prod_type)
    if min_price is not None:
        query = query.filter(Product.price >= min_price)
    if max_price is not None:
        query = query.filter(Product.price <= max_price)
    if search:
        query = query.filter(
            (Product.title.ilike(f'%{search}%')) | 
            (Product.brand.ilike(f'%{search}%')) |
            (Product.description.ilike(f'%{search}%'))
        )

    if sort == 'price_asc':
        query = query.order_by(Product.price.asc())
    elif sort == 'price_desc':
        query = query.order_by(Product.price.desc())
    elif sort == 'newest':
        query = query.order_by(Product.created_at.desc())
    elif sort == 'popular':
        query = query.order_by(Product.rating.desc())
    else:
        query = query.order_by(Product.created_at.desc())

    total = query.count()
    products = query.offset((page - 1) * limit).limit(limit).all()

    return jsonify({
        'products': [p.to_dict() for p in products],
        'total': total,
        'page': page,
        'limit': limit,
        'pages': (total + limit - 1) // limit
    }), 200

@product_bp.route('/api/products/<int:product_id>', methods=['GET'])
def get_product(product_id):
    product = db.session.get(Product, product_id)
    if not product:
        return jsonify({'error': 'Product not found'}), 404
    
    reviews = Review.query.filter_by(product_id=product_id).order_by(Review.created_at.desc()).all()
    res = product.to_dict()
    res['reviews'] = [r.to_dict() for r in reviews]
    
    if reviews:
        res['rating'] = sum([r.rating for r in reviews]) / len(reviews)
    
    return jsonify({'product': res}), 200

@product_bp.route('/api/products/<int:product_id>/reviews', methods=['POST'])
@jwt_required()
def add_review(product_id):
    user_id = int(get_jwt_identity())
    data = request.get_json()
    rating = data.get('rating')
    comment = data.get('comment')
    
    if not rating or not (1 <= rating <= 5):
        return jsonify({'error': 'Rating (1-5) is required'}), 400
        
    product = db.session.get(Product, product_id)
    if not product:
        return jsonify({'error': 'Product not found'}), 404
        
    has_purchased = db.session.query(Order).join(OrderItem).filter(
        Order.user_id == user_id,
        OrderItem.product_id == product_id,
        Order.status == 'Delivered'
    ).first()
    
    if not has_purchased:
        return jsonify({'error': 'Only customers who have purchased and received this item can leave a review.'}), 403
        
    review = Review(user_id=user_id, product_id=product_id, rating=rating, comment=comment)
    db.session.add(review)
    db.session.commit()
    
    return jsonify({'message': 'Review added successfully', 'review': review.to_dict()}), 201

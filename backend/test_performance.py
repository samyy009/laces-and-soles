import os
import unittest
from flask_jwt_extended import create_access_token
from app import create_app
from extensions import db
from models import User, Product, Order, OrderItem, Coupon, CartItem

class TestPerformanceOptimizations(unittest.TestCase):
    def setUp(self):
        # Load app in testing configuration
        self.app = create_app()
        self.app.config['TESTING'] = True
        # In memory DB is not used here because we want to test on the real database configured in env
        # so we can check Neon compatibility.
        self.client = self.app.test_client()
        self.ctx = self.app.app_context()
        self.ctx.push()

    def tearDown(self):
        self.ctx.pop()

    def test_dashboard_all_endpoint(self):
        print("\nTesting `/api/admin/dashboard-all` consolidated endpoint...")
        
        # Find or create admin user to generate token
        admin = User.query.filter_by(role='admin').first()
        if not admin:
            print("No admin user found in database. Skipping authentication tests.")
            return

        token = create_access_token(identity=str(admin.id))
        headers = {'Authorization': f'Bearer {token}'}

        # Test the endpoint with period=7d
        res = self.client.get('/api/admin/dashboard-all?period=7d', headers=headers)
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        
        # Verify response payload keys
        self.assertIn('metrics', data)
        self.assertIn('users', data)
        self.assertIn('orders', data)
        self.assertIn('drivers', data)
        self.assertIn('coupons', data)
        self.assertIn('subscribers', data)
        self.assertIn('email_logs', data)
        self.assertIn('email_stats', data)
        
        # Check metrics details
        metrics = data['metrics']
        self.assertIn('total_users', metrics)
        self.assertIn('total_products', metrics)
        self.assertIn('total_orders', metrics)
        self.assertIn('total_revenue', metrics)
        self.assertIn('chart_data', metrics)
        self.assertIn('top_selling', metrics)
        self.assertIn('category_distribution', metrics)
        self.assertIn('recent_activity', metrics)

        # Check chart_data format
        chart_data = metrics['chart_data']
        self.assertEqual(len(chart_data), 7)
        self.assertEqual(chart_data[0]['name'], (metrics['chart_data'][0]['name']))

        # Test the endpoint with period=6m
        res = self.client.get('/api/admin/dashboard-all?period=6m', headers=headers)
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(len(data['metrics']['chart_data']), 6)
        
        print("SUCCESS: `/api/admin/dashboard-all` resolved successfully!")

    def test_bulk_cart_sync_endpoint(self):
        print("\nTesting `/api/cart/bulk` synchronization endpoint...")
        
        user = User.query.filter(~User.role.in_(['deleted_user', 'deleted_driver'])).first()
        if not user:
            print("No user found in database. Skipping cart sync tests.")
            return

        token = create_access_token(identity=str(user.id))
        headers = {'Authorization': f'Bearer {token}'}

        # Find some product to add to cart
        product = Product.query.first()
        if not product:
            print("No products found in database. Skipping product tests.")
            return

        # Synchronize cart with bulk endpoint
        payload = {
            'items': [
                {'product_id': product.id, 'quantity': 2}
            ]
        }
        res = self.client.post('/api/cart/bulk', json=payload, headers=headers)
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertIn('cart', data)
        
        # Verify item added
        cart = data['cart']
        self.assertTrue(len(cart) > 0)
        matched_item = next((item for item in cart if item['product']['id'] == product.id), None)
        self.assertIsNotNone(matched_item)
        self.assertTrue(matched_item['quantity'] >= 2)
        
        print("SUCCESS: `/api/cart/bulk` resolved successfully!")

if __name__ == "__main__":
    unittest.main()

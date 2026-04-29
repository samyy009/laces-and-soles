import os
import sys
from flask import Flask
from sqlalchemy import text
from dotenv import load_dotenv

base_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.join(base_dir, 'backend')
from backend.models import db

load_dotenv(os.path.join(backend_dir, '.env'))
app = Flask(__name__)
DB_USER = os.environ.get('DB_USER', 'postgres')
DB_PASSWORD = os.environ.get('DB_PASSWORD', 'root@123')
DB_HOST = os.environ.get('DB_HOST', 'localhost')
DB_NAME = os.environ.get('DB_NAME', 'laces_and_soles')

import urllib.parse
encoded_password = urllib.parse.quote_plus(DB_PASSWORD)
app.config['SQLALCHEMY_DATABASE_URI'] = f'postgresql://{DB_USER}:{encoded_password}@{DB_HOST}/{DB_NAME}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)

with app.app_context():
    try:
        # Get all table names
        result = db.session.execute(text("SELECT tablename FROM pg_tables WHERE schemaname = 'public'"))
        tables = [row[0] for row in result]
        
        # Drop all tables with CASCADE
        for table in tables:
            print(f"Dropping table {table} CASCADE...")
            db.session.execute(text(f'DROP TABLE "{table}" CASCADE'))
        
        db.session.commit()
        print("All tables dropped successfully.")
    except Exception as e:
        print(f"Error dropping tables: {e}")

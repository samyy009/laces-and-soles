from app import app, db, User
import sys

def cleanup_test_users():
    with app.app_context():
        print("🔍 Scanning for test accounts...")
        
        # We only delete users with role 'user'. Admins are preserved.
        test_users = User.query.filter_by(role='user').all()
        count = len(test_users)
        
        if count == 0:
            print("✅ Database is already clean. No test users found.")
            return

        print(f"⚠️ Found {count} test user(s) to be removed.")
        confirm = input("Are you sure you want to PERMANENTLY delete these users? (y/n): ")
        
        if confirm.lower() == 'y':
            for user in test_users:
                print(f"Deleting: {user.email}")
                db.session.delete(user)
            
            db.session.commit()
            print(f"✨ Successfully cleaned {count} test accounts from the database.")
        else:
            print("❌ Cleanup aborted by user.")

if __name__ == "__main__":
    cleanup_test_users()

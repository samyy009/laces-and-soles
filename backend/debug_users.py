from app import app, db, User

with app.app_context():
    users = User.query.all()
    print("USER_DB_DUMP_START")
    for u in users:
        print(f"EMAIL:[{u.email}] ROLE:[{u.role}]")
    print("USER_DB_DUMP_END")

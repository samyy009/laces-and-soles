from app import app, db, PasswordReset

with app.app_context():
    reset = PasswordReset.query.filter_by(email='samsam.123samyy@gmail.com').first()
    if reset:
        print(f"Reset Record for {reset.email}:")
        print(f"- OTP: {reset.otp}")
        print(f"- Expiry: {reset.expiry}")
        print(f"- Verified: {reset.is_verified}")
    else:
        print("No reset record found for samsam.123samyy@gmail.com")

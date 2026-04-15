"""
Run this from the Backend directory:
  python debug_login.py <email> <password>
It will tell you exactly why login is failing.
"""
import sys
from app.db.session import SessionLocal
from app.models.user import User
from app.core.security import verify_password

if len(sys.argv) < 3:
    print("Usage: python debug_login.py <email> <password>")
    sys.exit(1)

email = sys.argv[1]
password = sys.argv[2]

db = SessionLocal()
try:
    user = db.query(User).filter(User.email == email).first()

    if not user:
        # Try case-insensitive search
        user_ci = db.query(User).filter(User.email.ilike(email)).first()
        if user_ci:
            print(f"[FAIL] User not found with exact email '{email}'")
            print(f"       But found with different case: '{user_ci.email}'")
            print(f"       Fix: use '{user_ci.email}' to login, or update the stored email.")
        else:
            print(f"[FAIL] No user found with email '{email}' (case-insensitive search also failed)")
            print("       All users in DB:")
            all_users = db.query(User).all()
            for u in all_users:
                print(f"         - '{u.email}' (active={u.is_active}, role={u.role})")
    else:
        print(f"[OK]   User found: {user.email} (id={user.id}, active={user.is_active}, role={user.role})")
        pw_ok = verify_password(password, user.hashed_password)
        if pw_ok:
            print(f"[OK]   Password matches! Login should work.")
            if not user.is_active:
                print(f"[FAIL] But user is INACTIVE — that's why login fails.")
        else:
            print(f"[FAIL] Password does NOT match.")
            print(f"       Stored hash starts with: {user.hashed_password[:20]}...")
            if not user.hashed_password.startswith("$2b$") and not user.hashed_password.startswith("$2a$"):
                print(f"       WARNING: Hash doesn't look like bcrypt! It may be stored as plain text or a different algorithm.")
finally:
    db.close()

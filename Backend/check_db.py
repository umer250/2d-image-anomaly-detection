from app.db.session import SessionLocal
from app.models.image import Image
from app.models.result import Result
from app.models.user import User

db = SessionLocal()
try:
    image_count = db.query(Image).count()
    result_count = db.query(Result).count()
    users = db.query(User).all()
    print(f"Total Images: {image_count}")
    print(f"Total Results: {result_count}")
    print("Users:")
    for u in users:
        img_count = db.query(Image).filter(Image.user_id == u.id).count()
        print(f"  - {u.email} (ID: {u.id}): {img_count} images")
except Exception as e:
    print(f"Error: {e}")
finally:
    db.close()

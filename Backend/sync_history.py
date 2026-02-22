import os
from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.models.history import History
from app.models.user import User
from app.core.config import settings

def sync_history():
    db = SessionLocal()
    try:
        # Get admin user as default owner for orphan files
        admin = db.query(User).filter(User.role == "admin").first()
        if not admin:
            print("No admin user found. Please create one first.")
            return

        upload_dir = "static/uploads"
        if not os.path.exists(upload_dir):
            print(f"Directory {upload_dir} does not exist.")
            return

        files = os.listdir(upload_dir)
        print(f"Found {len(files)} files in {upload_dir}")

        for filename in files:
            if filename.endswith(".jpg") or filename.endswith(".png"):
                # Check if record already exists
                existing = db.query(History).filter(History.filename == filename).first()
                if not existing:
                    file_path = os.path.join(upload_dir, filename)
                    # We don't know the score/status for old files, so we default to Normal/0.0
                    # or try to find a matching result?
                    # For now, let's just create a basic record.
                    new_record = History(
                        user_id=admin.id,
                        filename=filename,
                        file_path=file_path,
                        status="Normal",
                        score=0.0
                    )
                    db.add(new_record)
                    print(f"Synced {filename}")
        
        db.commit()
        print("Sync complete.")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    sync_history()

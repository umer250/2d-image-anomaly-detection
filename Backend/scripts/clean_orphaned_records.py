"""
Cleanup script to delete database records for images that no longer exist on the physical disk.
This fixes the 404 errors in the Admin panel when physical files are deleted manually
or lost during project transfer.
"""

import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.session import SessionLocal
from app.models.image import Image
from app.models.result import Result
from app.models.history import History

def clean_orphans():
    db = SessionLocal()
    try:
        # 1. Clean History records
        history = db.query(History).all()
        history_deleted = 0
        for h in history:
            # If the physical file doesn't exist, delete the record
            if not os.path.exists(h.file_path):
                db.delete(h)
                history_deleted += 1
        
        # 2. Clean Image and Result records
        images = db.query(Image).all()
        images_deleted = 0
        for img in images:
            if not os.path.exists(img.file_path):
                # Delete associated results first (foreign key constraint)
                db.query(Result).filter(Result.image_id == img.id).delete()
                # Delete the image
                db.delete(img)
                images_deleted += 1

        db.commit()
        print(f"Cleanup Complete:")
        print(f"  - Deleted {images_deleted} orphaned Image records")
        print(f"  - Deleted {history_deleted} orphaned History records")
        
    except Exception as e:
        print(f"Error during cleanup: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    clean_orphans()

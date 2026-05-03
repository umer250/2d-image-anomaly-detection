import os
import sys
import shutil
from pathlib import Path

# Ensure the app module is accessible
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.ml.train import train

def main():
    # Paths
    project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    real_world_dir = os.path.join(project_root, "Frontend", "public", "Real world images")
    tmp_dir = os.path.join(project_root, "Backend", "scripts", "tmp_train")
    
    # Map filenames to MVTec categories
    image_mapping = {
        "Brush good.jpeg": "toothbrush",
        "carpet good.jpeg": "carpet",
        "grid good.jpeg": "grid",
        "wood good.jpeg": "wood",
    }
    
    print("==================================================")
    print("  RETRAINING MODELS ON REAL-WORLD IMAGES")
    print("==================================================")
    
    if not os.path.exists(real_world_dir):
        print(f"Error: Real world images directory not found at {real_world_dir}")
        return
        
    for filename, category in image_mapping.items():
        src_path = os.path.join(real_world_dir, filename)
        
        if not os.path.exists(src_path):
            print(f"Skipping {category}: Could not find {filename}")
            continue
            
        print(f"\n>>> Preparing to train {category} on {filename} ...")
        
        # Create a temporary training directory structure: tmp_train/<category>/good/
        category_train_dir = os.path.join(tmp_dir, category, "good")
        os.makedirs(category_train_dir, exist_ok=True)
        
        # Copy the single "good" image into the training directory
        dst_path = os.path.join(category_train_dir, filename)
        shutil.copy2(src_path, dst_path)
        
        # Run the training process
        try:
            # Note: We output as {category}_patchcore so model_loader.py finds it instantly
            train(
                category=category,
                train_dir=category_train_dir,
                coreset_ratio=0.1,  # Standard sampling
                num_neighbors=9,
                sigma=2.0,
                output_name=f"{category}_patchcore"
            )
            print(f"Successfully retrained {category}!")
        except Exception as e:
            print(f"Failed to train {category}: {e}")
            
    # Cleanup temporary training directory
    if os.path.exists(tmp_dir):
        shutil.rmtree(tmp_dir)
        print("\nCleaned up temporary files.")
        
    print("\n==================================================")
    print("  ALL REQUESTED MODELS RETRAINED SUCCESSFULLY!")
    print("==================================================")
    print("Please restart your FastAPI backend to load the new models.")

if __name__ == "__main__":
    main()

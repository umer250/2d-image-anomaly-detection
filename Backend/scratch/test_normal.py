import cv2
import numpy as np
import os
import sys

# Add current dir to sys.path
sys.path.insert(0, os.getcwd())

from app.ml.inference import run_inference

# Create a 'normal' looking image (white square)
normal_img = np.ones((400, 400, 3), dtype=np.uint8) * 255
os.makedirs('scratch', exist_ok=True)
cv2.imwrite('scratch/normal.jpg', normal_img)

# Run inference
res = run_inference('scratch/normal.jpg', category='bottle')
score = res['anomaly_score']
threshold = res['threshold']
is_anomaly = res['is_anomaly']

print(f"Normal Image Score: {score:.4f}")
print(f"Threshold: {threshold:.4f}")
print(f"Is Anomaly: {is_anomaly}")

if not is_anomaly:
    print("SUCCESS: Normal image correctly identified as normal.")
else:
    print("WARNING: Normal image identified as anomalous. Checking math...")

import matplotlib.pyplot as plt
import seaborn as sns
import pandas as pd
import numpy as np

# Set the style for a professional look
sns.set_theme(style="whitegrid")

# Data for all 15 MVTec AD categories (example AUROC scores based on standard PatchCore results)
# You can update these values with the exact final results of your model
data = {
    'Category': [
        'Carpet', 'Grid', 'Leather', 'Tile', 'Wood',            # Textures
        'Bottle', 'Cable', 'Capsule', 'Hazelnut', 'Metal Nut',  # Objects
        'Pill', 'Screw', 'Toothbrush', 'Transistor', 'Zipper'
    ],
    'Image-Level AUROC (%)': [
        98.7, 98.2, 100.0, 98.7, 99.2, 
        100.0, 99.5, 98.1, 100.0, 100.0, 
        96.6, 98.1, 100.0, 100.0, 99.4
    ],
    'Pixel-Level AUROC (%)': [
        98.9, 97.3, 99.3, 95.6, 95.0, 
        98.6, 98.4, 98.8, 98.7, 98.4, 
        97.1, 99.4, 98.1, 96.3, 98.5
    ]
}

df = pd.DataFrame(data)
df = df.sort_values(by='Image-Level AUROC (%)', ascending=True)

# Create a figure with a 'vertical photo' aspect ratio
plt.figure(figsize=(10, 14))

# Plotting
bar_height = 0.35
index = np.arange(len(df['Category']))

# Plot Image-Level
plt.barh(index, df['Image-Level AUROC (%)'], bar_height, 
         label='Image-Level AUROC', color='#1f77b4', edgecolor='black')

# Plot Pixel-Level
plt.barh(index + bar_height, df['Pixel-Level AUROC (%)'], bar_height, 
         label='Pixel-Level AUROC', color='#ff7f0e', edgecolor='black')

# Formatting the plot
plt.xlabel('AUROC Score (%)', fontsize=14, fontweight='bold')
plt.ylabel('MVTec AD Categories', fontsize=14, fontweight='bold')
plt.title('Anomaly Detection Accuracy Across All 15 Categories (PatchCore)', 
          fontsize=16, fontweight='bold', pad=20)

plt.yticks(index + bar_height / 2, df['Category'], fontsize=12)
plt.xticks(np.arange(90, 101, 1), fontsize=12)
plt.xlim(90, 101)  # Setting x-limit from 90 to 101 to highlight the differences clearly

# Add value labels to the end of each bar
for i, (img_val, pix_val) in enumerate(zip(df['Image-Level AUROC (%)'], df['Pixel-Level AUROC (%)'])):
    plt.text(img_val + 0.1, i, f'{img_val:.1f}%', va='center', fontsize=10)
    plt.text(pix_val + 0.1, i + bar_height, f'{pix_val:.1f}%', va='center', fontsize=10)

# Add Legend
plt.legend(loc='lower right', fontsize=12)

# Adjust layout and save the vertical image
plt.tight_layout()
plt.savefig('mvtec_accuracy_vertical.png', dpi=300, bbox_inches='tight')

# Display the plot inside Kaggle
plt.show()

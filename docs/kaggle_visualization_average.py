import matplotlib.pyplot as plt
import seaborn as sns
import pandas as pd

# Set the style for a professional look
sns.set_theme(style="whitegrid")

# Average AUROC scores for PatchCore across all 15 MVTec AD categories
# You can update these with your exact calculated averages
data = {
    'Metric': ['Image-Level AUROC', 'Pixel-Level AUROC'],
    'Average Accuracy (%)': [98.1, 97.4]
}

df = pd.DataFrame(data)

# Create a figure with a vertical layout
plt.figure(figsize=(6, 8))

# Define colors for the bars
colors = ['#1f77b4', '#ff7f0e']

# Plotting the vertical bar chart
bars = plt.bar(df['Metric'], df['Average Accuracy (%)'], color=colors, edgecolor='black', width=0.5)

# Formatting the plot
plt.ylabel('Average AUROC Score (%)', fontsize=14, fontweight='bold')
plt.title('Overall Average Accuracy (PatchCore)', fontsize=16, fontweight='bold', pad=20)
plt.xticks(fontsize=13, fontweight='bold')
plt.yticks(fontsize=12)
plt.ylim(90, 100) # Zoomed in Y-axis to highlight the high accuracy scores

# Add value labels on top of each bar
for bar in bars:
    yval = bar.get_height()
    plt.text(bar.get_x() + bar.get_width()/2, yval + 0.2, f'{yval}%', 
             ha='center', va='bottom', fontsize=14, fontweight='bold')

# Adjust layout and save the image
plt.tight_layout()
plt.savefig('patchcore_overall_average.png', dpi=300, bbox_inches='tight')

# Display the plot inside Kaggle
plt.show()

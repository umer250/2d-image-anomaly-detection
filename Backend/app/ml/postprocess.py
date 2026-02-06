
from PIL import Image, ImageDraw
import os

def generate_heatmap(original_image_path: str, output_path: str, anomaly_score: float, threshold: float = 0.6):
    """
    Generate a dummy heatmap image.
    In a real scenario, this would overlay the model's attention map / Grad-CAM.
    
    Args:
        original_image_path: Path to the input image
        output_path: Path to save the generated heatmap image
        anomaly_score: The detected anomaly score
        threshold: The threshold for considering it an anomaly
    """
    try:
        # Open original image to get dimensions
        with Image.open(original_image_path).convert("RGBA") as base:
            # Create a transparent overlay
            overlay = Image.new("RGBA", base.size, (255, 0, 0, 0))
            draw = ImageDraw.Draw(overlay)
            
            w, h = base.size
            
            # If it's an anomaly, verify by drawing a red box
            if anomaly_score > threshold:
                # Draw a semi-transparent red rectangle in a random-ish looking spot
                # (Fixed spot for consistency in mock)
                margin_x = w // 4
                margin_y = h // 4
                
                # Draw a red highlight zone
                draw.rectangle(
                    [margin_x, margin_y, w - margin_x, h - margin_y], 
                    fill=(255, 0, 0, 80),  # Red with low alpha
                    outline=(255, 0, 0, 200),
                    width=3
                )
                
                # Add text label (optional, but helper for debug)
                # draw.text((10, 10), f"Anomaly: {anomaly_score:.2f}", fill=(255, 255, 255, 255))
            else:
                # If normal, maybe draw a green tint or nothing
                # Let's draw a subtle green border
                draw.rectangle(
                    [0, 0, w-1, h-1],
                    outline=(0, 255, 0, 100),
                    width=5
                )

            # Composite the overlay onto the base image
            combined = Image.alpha_composite(base, overlay)
            
            # Save as PNG to preserve visual fidelity
            combined.save(output_path, format="PNG")
            
    except Exception as e:
        print(f"Error generating heatmap: {e}")
        # If error, just copy original to output so flow doesn't break
        try:
            Image.open(original_image_path).save(output_path)
        except:
            pass

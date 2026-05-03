from PIL import Image, ImageDraw, ImageFont
import os

os.makedirs('docs/images', exist_ok=True)

def create_wireframe(filename, title, elements, index_text):
    width = 600
    height = 800
    img = Image.new('RGB', (width, height), color='white')
    draw = ImageDraw.Draw(img)
    
    try:
        font = ImageFont.truetype("arial.ttf", 20)
        index_font = ImageFont.truetype("arial.ttf", 18)
    except IOError:
        font = ImageFont.load_default()
        index_font = font

    # Draw outer box
    draw.rectangle([20, 20, 580, 780], outline='black', width=2)
    
    # Title
    draw.rectangle([100, 50, 500, 120], outline='black', width=1)
    draw.text((110, 75), title, fill='black', font=font)
    
    for el in elements:
        typ, coords, text = el
        if typ == 'text':
            draw.text((coords[0], coords[1]), text, fill='black', font=font)
        elif typ == 'dropzone':
            draw.rectangle(coords, outline='black', width=1, fill='#f0f0f0')
            lines = text.split('\n')
            for i, line in enumerate(lines):
                draw.text((coords[0]+10, coords[1]+10 + i*25), line, fill='black', font=font)
        else:
            draw.rectangle(coords, outline='black', width=1)
            draw.text((coords[0]+10, coords[1]+10), text, fill='black', font=font)
        
    # Index Box
    draw.rectangle([40, 560, 560, 750], outline='black', width=1)
    for i, line in enumerate(index_text):
        draw.text((50, 570 + i*25), line, fill='black', font=index_font)

    img.save(filename)

# Screen 1: Login
el1 = [
    ('label', [100, 160, 260, 200], 'S2: Email'),
    ('input', [300, 160, 500, 200], 'T1:'),
    ('label', [100, 230, 260, 270], 'S3: Password'),
    ('input', [300, 230, 500, 270], 'T2:'),
    ('button', [200, 310, 400, 360], 'B1: Submit')
]
idx1 = [
    "S1: static text (Title)", "S2: static text (Email Label)", "S3: static text (Password Label)",
    "T1: text box 1 (Email Input)", "T2: text box 2 (Password Input)", "B1: button (Submit Login)"
]
create_wireframe('docs/images/sb_login.png', 'S1: 2D Image Anomaly Detection', el1, idx1)

# Screen 2: Detection
el2 = [
    ('nav', [40, 140, 560, 180], 'S2: Navigation (Dashboard | Detection | History)'),
    ('title2', [100, 210, 500, 250], 'S3: Upload Image for Inspection'),
    ('label', [100, 280, 260, 320], 'S4: Category'),
    ('input', [300, 280, 500, 320], 'D1: Dropdown (Bottle...)'),
    ('dropzone', [100, 350, 500, 450], 'S5: Drag & Drop Area\n\nB1: Browse Files'),
    ('button', [200, 480, 400, 530], 'B2: Detect Anomaly')
]
idx2 = [
    "S1: static text (App Title)", "S2: static text (Navigation Links)", "S3: static text (Page Title)",
    "S4: static text (Category Label)", "D1: dropdown menu (Category Selector)", "S5: static text (Dropzone Info)",
    "B1: button (Browse File)", "B2: button (Run Model Inference)"
]
create_wireframe('docs/images/sb_detection.png', 'S1: 2D Image Anomaly Detection', el2, idx2)

# Screen 3: Results
el3 = [
    ('nav', [40, 140, 560, 180], 'S2: Navigation (Dashboard | Detection | History)'),
    ('title2', [100, 210, 500, 250], 'S3: Inspection Result'),
    ('img1', [80, 280, 280, 400], 'IMG1: Original Product Image'),
    ('img2', [320, 280, 520, 400], 'IMG2: Heatmap Overlay'),
    ('badge', [180, 440, 420, 480], 'S4: STATUS: ANOMALY (98%)'),
    ('button', [200, 500, 400, 550], 'B1: Scan Another Image')
]
idx3 = [
    "S1: static text (App Title)", "S2: static text (Navigation Links)", "S3: static text (Page Title)",
    "IMG1: image area (Original Product Upload)", "IMG2: image area (Model Heatmap Overlay)", "S4: static text (Detection Verdict)",
    "B1: button (Reset State for new scan)"
]
create_wireframe('docs/images/sb_results.png', 'S1: 2D Image Anomaly Detection', el3, idx3)

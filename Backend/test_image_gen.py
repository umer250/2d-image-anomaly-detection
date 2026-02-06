
from PIL import Image, ImageDraw

def create_test_image():
    img = Image.new('RGB', (224, 224), color = (73, 109, 137))
    d = ImageDraw.Draw(img)
    d.text((10,10), "Test Image", fill=(255,255,0))
    img.save('test_image.jpg')

if __name__ == "__main__":
    create_test_image()

from PIL import Image, ImageDraw, ImageFont
import requests
from io import BytesIO
import os

class GiftImageEditor:
    def __init__(self, template_url):
        self.template_url = template_url
        self.left_x = 385
        self.right_x = 872
        self.y_position = 479
        
    def download_template(self):
        """Download the template image"""
        response = requests.get(self.template_url)
        if response.status_code == 200:
            return Image.open(BytesIO(response.content))
        raise Exception("Failed to download template image")
    
    def calculate_text_position(self, draw, text, font):
        """Calculate centered position between left and right coordinates"""
        # Get text dimensions
        bbox = draw.textbbox((0, 0), text, font=font)
        text_width = bbox[2] - bbox[0]
        
        # Calculate center position
        center_x = (self.left_x + self.right_x) // 2
        text_x = center_x - (text_width // 2)
        text_y = self.y_position - 20  # Adjust vertical alignment
        
        return (text_x, text_y)
    
    def add_text_to_image(self, text, font_path=None):
        """
        Add gift code text to the template image
        Text will be centered between left and right coordinates
        """
        # Download template
        image = self.download_template()
        
        # Create drawing context
        draw = ImageDraw.Draw(image)
        
        # Load font
        try:
            if font_path and os.path.exists(font_path):
                font = ImageFont.truetype(font_path, 40)
            else:
                # Try to load a default font
                try:
                    font = ImageFont.truetype("arial.ttf", 40)
                except:
                    font = ImageFont.load_default()
        except:
            font = ImageFont.load_default()
        
        # Calculate position
        text_position = self.calculate_text_position(draw, text, font)
        
        # Add text to image
        draw.text(
            text_position,
            text,
            font=font,
            fill=(255, 255, 255),  # White color
            stroke_width=2,
            stroke_fill=(0, 0, 0)  # Black outline
        )
        
        return image
    
    def save_image(self, image, output_path):
        """Save the edited image"""
        image.save(output_path, "JPEG", quality=95)
        
    def get_image_bytes(self, image):
        """Convert image to bytes for Telegram"""
        img_bytes = BytesIO()
        image.save(img_bytes, format='JPEG', quality=95)
        img_bytes.seek(0)
        return img_bytes

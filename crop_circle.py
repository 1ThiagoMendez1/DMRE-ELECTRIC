import sys
from PIL import Image, ImageDraw

def process_logo(input_path, output_path):
    print(f"Processing {input_path}")
    img = Image.open(input_path).convert("RGBA")
    w, h = img.size
    
    # We assume the logo is centered and circular.
    # The image is a square (w == h). The circle usually has a tiny bit of padding or touches the edges.
    # Let's use the minimum dimension as diameter.
    diameter = min(w, h)
    
    # Optional: we can apply a tiny inset if the circle doesn't touch the very edge, 
    # but looking at the thumbnail, it touches the edge or is very close.
    # Let's just use diameter - 2 pixels to be safe.
    r = (diameter / 2) - 1
    cx, cy = w / 2, h / 2
    
    # Create mask
    mask = Image.new("L", (w, h), 0)
    draw = ImageDraw.Draw(mask)
    draw.ellipse((cx - r, cy - r, cx + r, cy + r), fill=255)
    
    img.putalpha(mask)
    
    img.save(output_path, "PNG")
    print(f"Saved to {output_path}")

if __name__ == "__main__":
    process_logo(sys.argv[1], sys.argv[2])

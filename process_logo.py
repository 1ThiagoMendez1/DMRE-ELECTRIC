import sys
from PIL import Image, ImageDraw, ImageOps
import math

def process_logo(input_path, output_path):
    print(f"Processing {input_path}")
    img = Image.open(input_path).convert("RGBA")
    w, h = img.size
    
    # Create a circular mask
    mask = Image.new("L", (w, h), 0)
    draw = ImageDraw.Draw(mask)
    
    # We assume the logo is centered and circular.
    # The edges might have some anti-aliasing.
    
    # Find bounding box of the non-white pixels
    # Convert to grayscale to find edges
    gray = img.convert("L")
    bg = Image.new("L", (w, h), 255)
    diff = ImageChops.difference(gray, bg) if 'ImageChops' in globals() else None
    
    # Actually, the user logo is perfectly circular, let's just make a circle based on the minimum dimension
    # Some padding might be needed if the circle is not touching the edges exactly.
    # We can detect the first non-white pixel from the center outwards
    cx, cy = w/2, h/2
    radius = min(w, h) / 2
    
    # Draw circle
    draw.ellipse((0, 0, w, h), fill=255)
    
    # But wait, is the circle perfectly filling the square?
    # Let's crop to the dark ring. Let's look for the first non-white pixel from top middle.
    pixels = img.load()
    top_y = 0
    for y in range(int(h/2)):
        r,g,b,a = pixels[w/2, y]
        # if not almost white
        if r < 240 or g < 240 or b < 240:
            top_y = y
            break
            
    bottom_y = h - 1
    for y in range(h-1, int(h/2), -1):
        r,g,b,a = pixels[w/2, y]
        if r < 240 or g < 240 or b < 240:
            bottom_y = y
            break
            
    left_x = 0
    for x in range(int(w/2)):
        r,g,b,a = pixels[x, h/2]
        if r < 240 or g < 240 or b < 240:
            left_x = x
            break
            
    right_x = w - 1
    for x in range(w-1, int(w/2), -1):
        r,g,b,a = pixels[x, h/2]
        if r < 240 or g < 240 or b < 240:
            right_x = x
            break

    # Real center and radius
    real_cx = (left_x + right_x) / 2
    real_cy = (top_y + bottom_y) / 2
    real_rx = (right_x - left_x) / 2
    real_ry = (bottom_y - top_y) / 2
    
    # Use the minimum to keep it a perfect circle
    real_r = min(real_rx, real_ry)
    
    # Draw new mask
    mask = Image.new("L", (w, h), 0)
    draw = ImageDraw.Draw(mask)
    # Give it a 1 pixel inner padding to avoid white edges
    draw.ellipse((real_cx - real_r + 1, real_cy - real_r + 1, real_cx + real_r - 1, real_cy + real_r - 1), fill=255)
    
    # Apply anti-aliasing
    # Since we drew a hard ellipse, to make it smooth we could supersample, but PIL does ok.
    
    img.putalpha(mask)
    
    # Crop to the bounding box of the circle
    box = (int(real_cx - real_r), int(real_cy - real_r), int(real_cx + real_r), int(real_cy + real_r))
    img = img.crop(box)
    
    # Save
    img.save(output_path, "PNG")
    print(f"Saved to {output_path}")

if __name__ == "__main__":
    import sys
    from PIL import ImageChops # Import here to ensure it's available
    process_logo(sys.argv[1], sys.argv[2])

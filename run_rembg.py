import sys
import os

# Ensure the user site-packages are in the path because pip installed there
sys.path.append(os.path.expanduser('~\\AppData\\Roaming\\Python\\Python314\\site-packages'))

try:
    from rembg import remove
except ImportError as e:
    print(f"Failed to import rembg: {e}")
    sys.exit(1)

def process(input_path, output_path):
    print(f"Removing background from {input_path}")
    with open(input_path, 'rb') as i:
        with open(output_path, 'wb') as o:
            input_data = i.read()
            output_data = remove(input_data)
            o.write(output_data)
    print(f"Saved to {output_path}")

if __name__ == '__main__':
    process(sys.argv[1], sys.argv[2])

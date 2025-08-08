#!/usr/bin/env python3
"""
Simple script to create extension icons using PIL
Run with: python3 create-icons.py
"""

try:
    from PIL import Image, ImageDraw
    import os
    
    def create_icon(size):
        # Create a new image with transparent background
        img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)
        
        # Scale factor
        scale = size / 128
        
        # Draw camera body (blue rectangle)
        body_x1 = int(20 * scale)
        body_y1 = int(40 * scale)
        body_x2 = int(108 * scale)
        body_y2 = int(100 * scale)
        draw.rectangle([body_x1, body_y1, body_x2, body_y2], fill=(0, 124, 186, 255))
        
        # Draw camera lens (dark blue circle)
        lens_center_x = int(64 * scale)
        lens_center_y = int(70 * scale)
        lens_radius = int(25 * scale)
        lens_x1 = lens_center_x - lens_radius
        lens_y1 = lens_center_y - lens_radius
        lens_x2 = lens_center_x + lens_radius
        lens_y2 = lens_center_y + lens_radius
        draw.ellipse([lens_x1, lens_y1, lens_x2, lens_y2], fill=(0, 90, 135, 255))
        
        # Draw lens center (white circle)
        inner_radius = int(15 * scale)
        inner_x1 = lens_center_x - inner_radius
        inner_y1 = lens_center_y - inner_radius
        inner_x2 = lens_center_x + inner_radius
        inner_y2 = lens_center_y + inner_radius
        draw.ellipse([inner_x1, inner_y1, inner_x2, inner_y2], fill=(255, 255, 255, 255))
        
        # Draw flash (yellow rectangle)
        flash_x1 = int(30 * scale)
        flash_y1 = int(30 * scale)
        flash_x2 = int(45 * scale)
        flash_y2 = int(45 * scale)
        draw.rectangle([flash_x1, flash_y1, flash_x2, flash_y2], fill=(255, 255, 0, 255))
        
        # Draw viewfinder (dark rectangle)
        vf_x1 = int(85 * scale)
        vf_y1 = int(25 * scale)
        vf_x2 = int(105 * scale)
        vf_y2 = int(35 * scale)
        draw.rectangle([vf_x1, vf_y1, vf_x2, vf_y2], fill=(51, 51, 51, 255))
        
        return img
    
    # Create icons directory
    os.makedirs('icons', exist_ok=True)
    
    # Generate icons of different sizes
    sizes = [16, 32, 48, 128]
    
    for size in sizes:
        icon = create_icon(size)
        icon.save(f'icons/icon{size}.png')
        print(f'Created icon{size}.png')
    
    print('All icons created successfully!')
    
except ImportError:
    print("PIL not available. Creating simple placeholder icons...")
    
    # Create simple text-based icons as fallback
    import os
    os.makedirs('icons', exist_ok=True)
    
    # Create a simple SVG icon that can be converted
    svg_content = '''<svg width="128" height="128" xmlns="http://www.w3.org/2000/svg">
    <rect width="128" height="128" fill="#007cba"/>
    <rect x="20" y="40" width="88" height="60" fill="#005a87"/>
    <circle cx="64" cy="70" r="25" fill="#ffffff"/>
    <circle cx="64" cy="70" r="15" fill="#007cba"/>
    <rect x="30" y="30" width="15" height="15" fill="#ffff00"/>
    <rect x="85" y="25" width="20" height="10" fill="#333333"/>
    <text x="64" y="115" text-anchor="middle" fill="white" font-size="12" font-family="Arial">📸</text>
</svg>'''
    
    with open('icons/icon.svg', 'w') as f:
        f.write(svg_content)
    
    print("Created SVG icon. You can convert it to PNG files manually or use an online converter.")
    print("Alternatively, install PIL with: pip install Pillow")
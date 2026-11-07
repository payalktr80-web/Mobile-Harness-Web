import os
from PIL import Image, ImageDraw, ImageFont

def create_mobile_harness_web_icon(size=512):
    # Create base image with alpha channel
    img = Image.new("RGBA", (size, size), (11, 14, 20, 255)) # #0B0E14
    draw = ImageDraw.Draw(img)

    scale = size / 108.0

    # Draw rounded rectangle background
    radius = int(24 * scale)
    draw.rounded_rectangle([0, 0, size, size], radius=radius, fill=(11, 14, 20, 255))

    # Center group scaled
    # In SVG: path fill="#F28C52" d="M22 26h47c10 0 18 8 18 18v20c0 10-8 18-18 18H51L39 93V82H22Z"
    # Let's draw the chat bubble
    bubble_color = (242, 140, 82, 255) # #F28C52
    
    # Coordinates mapped to scale
    bx0 = int(22 * scale)
    by0 = int(24 * scale)
    bx1 = int(87 * scale)
    by1 = int(80 * scale)
    bubble_radius = int(16 * scale)

    # Main rounded box of the speech bubble
    draw.rounded_rectangle([bx0, by0, bx1, by1], radius=bubble_radius, fill=bubble_color)

    # Speech bubble tail triangle: H51L39 93V82
    tail_points = [
        (int(53 * scale), int(80 * scale)),
        (int(39 * scale), int(93 * scale)),
        (int(39 * scale), int(80 * scale)),
    ]
    draw.polygon(tail_points, fill=bubble_color)

    # Cutout code brackets in center: < >
    # In SVG: "m39 43-10 10 10 10 5-5-5-5 5-5Zm17 0-5 5 5 5-5 5 5 5 10-10Z"
    dark_color = (11, 14, 20, 255)
    
    # Left bracket <
    # Pointing left at (29, 53), top at (39, 43), bottom at (39, 63)
    p_left = [
        (int(40 * scale), int(42 * scale)),
        (int(29 * scale), int(53 * scale)),
        (int(40 * scale), int(64 * scale)),
        (int(44 * scale), int(59 * scale)),
        (int(36 * scale), int(53 * scale)),
        (int(44 * scale), int(47 * scale)),
    ]
    draw.polygon(p_left, fill=dark_color)

    # Right bracket >
    # Pointing right at (67, 53), top at (56, 43), bottom at (56, 63)
    p_right = [
        (int(56 * scale), int(42 * scale)),
        (int(67 * scale), int(53 * scale)),
        (int(56 * scale), int(64 * scale)),
        (int(52 * scale), int(59 * scale)),
        (int(60 * scale), int(53 * scale)),
        (int(52 * scale), int(47 * scale)),
    ]
    draw.polygon(p_right, fill=dark_color)

    # Draw "WEB" badge in bottom right corner
    badge_w = int(48 * scale)
    badge_h = int(22 * scale)
    badge_x0 = size - badge_w - int(6 * scale)
    badge_y0 = size - badge_h - int(8 * scale)
    badge_x1 = badge_x0 + badge_w
    badge_y1 = badge_y0 + badge_h
    badge_r = int(7 * scale)

    # Badge background
    draw.rounded_rectangle([badge_x0, badge_y0, badge_x1, badge_y1], radius=badge_r, fill=(142, 168, 255, 255)) # PocketBlue #8EA8FF
    draw.rounded_rectangle([badge_x0, badge_y0, badge_x1, badge_y1], radius=badge_r, outline=(11, 14, 20, 255), width=max(1, int(2 * scale)))

    # Try to load a nice bold font or fallback to default
    try:
        font_path = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
        if not os.path.exists(font_path):
            font_path = "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf"
        font_size = int(13 * scale)
        font = ImageFont.truetype(font_path, font_size)
    except Exception:
        font = ImageFont.load_default()

    text = "WEB"
    # Measure text bounding box
    bbox = draw.textbbox((0, 0), text, font=font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]

    tx = badge_x0 + (badge_w - tw) / 2
    ty = badge_y0 + (badge_h - th) / 2 - int(1.5 * scale)

    # Draw text in dark color #001F58 / #0B0E14
    draw.text((tx, ty), text, font=font, fill=(0, 31, 88, 255))

    return img

def main():
    print("Generating Mobile Harness Web favicon and icons with Python...")
    
    # 512x512
    img512 = create_mobile_harness_web_icon(512)
    img512.save("public/assets/icon-512.png", "PNG")
    print("Saved public/assets/icon-512.png")

    # 192x192
    img192 = img512.resize((192, 192), Image.Resampling.LANCZOS)
    img192.save("public/assets/icon-192.png", "PNG")
    print("Saved public/assets/icon-192.png")

    # 64x64 favicon
    img64 = img512.resize((64, 64), Image.Resampling.LANCZOS)
    img64.save("public/favicon.png", "PNG")
    img64.save("public/favicon.ico", "ICO")
    print("Saved public/favicon.png and public/favicon.ico")

    # Also create an SVG version with "WEB" badge
    svg_content = '''<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 108 108">
  <rect width="108" height="108" rx="24" fill="#0B0E14"/>
  <g transform="translate(54 50) scale(1.05) translate(-54 -54)">
    <path fill="#F28C52" d="M22 26h47c10 0 18 8 18 18v20c0 10-8 18-18 18H51L39 93V82H22Z"/>
    <path fill="#0B0E14" d="m39 43-10 10 10 10 5-5-5-5 5-5Zm17 0-5 5 5 5-5 5 5 5 10-10Z"/>
  </g>
  <!-- WEB Badge -->
  <rect x="54" y="78" width="48" height="22" rx="7" fill="#8EA8FF" stroke="#0B0E14" stroke-width="2"/>
  <text x="78" y="93.5" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="900" font-size="12" fill="#001F58" text-anchor="middle">WEB</text>
</svg>
'''
    with open("public/assets/logo.svg", "w") as f:
        f.write(svg_content)
    with open("public/favicon.svg", "w") as f:
        f.write(svg_content)
    print("Saved public/assets/logo.svg and public/favicon.svg with WEB badge!")

if __name__ == "__main__":
    main()

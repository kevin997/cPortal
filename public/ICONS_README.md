# PWA Icons

## Required Icons

You need to create the following icon files for the PWA:

1. **icon-192x192.png** (192x192 pixels)
   - Used for mobile home screen icon
   - Should have a transparent or solid background
   - Simple, recognizable design

2. **icon-512x512.png** (512x512 pixels)
   - Used for splash screen and larger displays
   - Same design as 192x192, just higher resolution

3. **favicon.ico** (32x32 pixels)
   - Browser tab icon
   - Should be the same design as the main icons

## Design Suggestions

For **cPortal**, consider:

- **Letters "cP"** in a modern font
- **Graduation cap** icon (represents education/bootcamp)
- **Portal/Door** symbol (represents the portal concept)
- **People/Users** icon (represents student management)

### Color Scheme
- Primary: #6366f1 (blue/purple)
- Background: White or transparent
- Accent: Gradient or solid color

## Quick Icon Creation

### Option 1: Use Figma/Canva
1. Create a 512x512 canvas
2. Design your icon
3. Export as PNG at 512x512 and 192x192
4. Convert 32x32 to .ico format

### Option 2: Use Online Tools
- **Favicon.io**: https://favicon.io
- **RealFaviconGenerator**: https://realfavicongenerator.net
- **Canva**: https://canva.com

### Option 3: AI Generation
Use AI image generators like:
- DALL-E
- Midjourney
- Stable Diffusion

Prompt: "A modern, minimalist app icon for a bootcamp management portal, featuring the letters 'cP' or a graduation cap, in blue/purple color scheme, on white background"

## Once You Have the Icons

Place them in this directory:
```
/home/atlas/Projects/CSL/cPortal/public/
├── icon-192x192.png
├── icon-512x512.png
└── favicon.ico
```

The PWA will automatically use these icons when users install the app to their home screen!

## Temporary Solution

Until you create proper icons, you can use placeholder icons:
1. Create simple colored squares with "cP" text
2. Or use free icon resources like:
   - Font Awesome
   - Material Icons
   - Heroicons

The app will work fine without custom icons, but custom icons provide a more professional appearance.

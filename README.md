# Landing Page Mockup

This is a prototype of the “cool landing page” with 3D + media + Buy button integration.

### Structure

- `index.html` — entry point, includes canvas and UI overlays  
- `style.css` — base styles for layout and UI  
- `main.js` — WebGL / Three.js logic: rendering, click handling, navigation  
- `assets/` — folder to hold media (video, textures, etc.)  

### Usage

1. Place a sample video in `assets/sample-video.mp4`.  
2. Modify `main.js` to add more media items / objects and their associated Shopify buy links.  
3. Commit & push to GitHub.  
4. Enable GitHub Pages in your repo (e.g., serve from `main` or `docs`).  
5. Visit your GitHub Pages URL and test the mockup.

### Next Steps

- Replace cube with custom meshes or planes that display media thumbnails  
- Add multiple items / hotspots  
- Fetch product data from Shopify Storefront API  
- Improve transitions, camera movements, state preservation  
- Deploy to permanent hosting and switch asset / data URLs via configuration  

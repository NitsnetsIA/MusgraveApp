# Deployment Guide

## Overview
This project is configured for static deployment on Replit. The build process generates files optimized for static hosting with proper SPA (Single Page Application) routing support.

## Deployment Process

### Automated Deployment
1. Run the deployment preparation script:
   ```bash
   npm run build
   node scripts/deploy-prepare.js
   ```

2. The script will:
   - Build the React frontend to `dist/public/`
   - Copy all static files from `dist/public/` to `dist/`
   - Create a `_redirects` file for SPA routing support
   - Prepare files for Replit's static deployment

### Manual Steps (if needed)
If the automated script isn't available, you can manually prepare for deployment:

1. Build the project:
   ```bash
   npm run build
   ```

2. Copy files from `dist/public/` to `dist/`:
   ```bash
   cp -r dist/public/* dist/
   ```

3. Create a `_redirects` file in `dist/` with content:
   ```
   /* /index.html 200
   ```

## Deployment Configuration

The deployment is configured in `.replit` with:
- **Build Command**: `npm run build`
- **Public Directory**: `dist` (matches where our script places the files)
- **SPA Routing**: Handled by `_redirects` file

## Files Structure After Build

```
dist/
├── index.html          # Main React app entry point
├── assets/             # CSS, JS, and other static assets
├── _redirects          # SPA routing configuration
└── index.js           # Server file (not used in static deployment)
```

## Troubleshooting

### Common Issues
1. **Missing index.html**: Ensure `npm run build` completed successfully
2. **404 on routes**: Verify `_redirects` file exists and contains the SPA redirect rule
3. **Assets not loading**: Check that the `assets/` directory was copied correctly

### Verification
After deployment preparation, verify these files exist in `dist/`:
- `index.html`
- `assets/` directory with CSS and JS files
- `_redirects` file

## Notes
- The project uses Vite for building, which outputs to `dist/public/`
- Our deployment script moves files to `dist/` to match Replit's expected structure
- The `_redirects` file ensures all routes are handled by the React app for client-side routing
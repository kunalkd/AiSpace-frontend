# AiSpace Frontend

A modern, responsive React application built with Vite, TypeScript, and Tailwind CSS. This project showcases an AI-focused marketing agency website with smooth animations and optimized performance.

## 🚀 Features

- **Responsive Design**: Mobile-first approach with adaptive layouts
- **Performance Optimized**: Throttled scroll listeners, lazy loading, and visibility-based animation pausing
- **Modern UI**: Built with Tailwind CSS and Framer Motion animations
- **WebGL Effects**: Custom galaxy background and 3D image galleries
- **TypeScript**: Full type safety throughout the application

## 🛠️ Tech Stack

- **Frontend Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS with custom animations
- **Animations**: Framer Motion
- **3D Graphics**: OGL (WebGL)
- **Icons**: Lucide React and Phosphor Icons
- **UI Components**: Radix UI primitives

## 📋 Prerequisites

- Node.js (v18 or higher)
- npm or yarn

## 🔧 Installation

1. Clone the repository:
```bash
git clone https://github.com/EhsaasChaudhary/AiSpace-frontend.git
cd AiSpace-frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:8080`

## 🏗️ Building for Production

To build the application for production:

```bash
npm run build
```

This will create a `dist` folder with optimized static files.

## 🌐 Deploying to Apache Server

### Option 1: Deploy to Root Directory

1. **Build the application**:
```bash
npm run build
```

2. **Upload the `dist` folder** to your Apache server's document root (usually `/var/www/html/` or `/public_html/`).

3. **Ensure Apache has the correct permissions**:
```bash
sudo chown -R www-data:www-data /var/www/html/
sudo chmod -R 755 /var/www/html/
```

4. **Configure Apache** (if needed) to serve the index.html for client-side routing:
   - Create or edit `.htaccess` in the document root:
   ```apache
   <IfModule mod_rewrite.c>
     RewriteEngine On
     RewriteBase /
     RewriteRule ^index\.html$ - [L]
     RewriteCond %{REQUEST_FILENAME} !-f
     RewriteCond %{REQUEST_FILENAME} !-d
     RewriteRule . /index.html [L]
   </IfModule>
   ```

5. **Restart Apache**:
```bash
sudo systemctl restart apache2
```

### Option 2: Deploy to Subdirectory

If deploying to a subdirectory (e.g., `https://example.com/aispace/`):

1. **Update Vite configuration** (`vite.config.mts`):
```typescript
export default defineConfig(({ mode }) => ({
  base: '/aispace/', // Add your subdirectory path
  // ... rest of config
}))
```

2. **Rebuild the application**:
```bash
npm run build
```

3. **Upload the `dist` folder** to your subdirectory on the server.

4. **Update `.htaccess`** for the subdirectory:
```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /aispace/
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /aispace/index.html [L]
</IfModule>
```

## 🔍 Apache Configuration Notes

- **Enable mod_rewrite**: Ensure Apache has `mod_rewrite` enabled for client-side routing.
- **MIME Types**: The build process handles MIME types correctly, but ensure your server serves `.js` and `.css` files properly.
- **HTTPS**: For production, configure SSL certificates for secure connections.
- **Compression**: Enable gzip compression in Apache for better performance.

## 📱 Performance Optimizations

This application includes several performance optimizations:

- **Lazy Loading**: Heavy components (WebGL galleries) are lazy-loaded
- **Animation Pausing**: Animations pause when components are not visible
- **Throttled Scroll**: Scroll event listeners are throttled to prevent excessive calls
- **Code Splitting**: Automatic code splitting for better loading times

## 🐛 Troubleshooting

### Common Apache Issues:

1. **404 Errors on Refresh**: Ensure `.htaccess` is configured for client-side routing.
2. **Assets Not Loading**: Check file permissions and ensure the `dist` folder is uploaded completely.
3. **WebGL Not Working**: Ensure the server supports WebGL and modern browsers.

### Build Issues:

- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Clear Vite cache: `rm -rf node_modules/.vite`
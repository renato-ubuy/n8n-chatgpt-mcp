#!/usr/bin/env node

// Right API Website Build Script

const fs = require('fs-extra');
const path = require('path');
const { minify: minifyHTML } = require('html-minifier-terser');
const { minify: minifyJS } = require('terser');
const CleanCSS = require('clean-css');
const chokidar = require('chokidar');
const glob = require('glob');

class WebsiteBuildTool {
  constructor() {
    this.srcDir = path.join(__dirname, 'src');
    this.assetsDir = path.join(__dirname, 'assets');
    this.distDir = path.join(__dirname, 'dist');
    this.isProduction = process.env.NODE_ENV === 'production';
    this.isWatching = process.argv.includes('--watch');
  }

  async build() {
    console.log('🚀 Building Right API Website...');
    
    try {
      // Clean dist directory
      await fs.remove(this.distDir);
      await fs.ensureDir(this.distDir);
      
      // Copy and process files
      await this.processHTML();
      await this.processCSS();
      await this.processJS();
      await this.copyAssets();
      await this.generateSitemap();
      await this.generateManifest();
      
      console.log('✅ Build completed successfully!');
      
      if (this.isWatching) {
        this.startWatching();
      }
      
    } catch (error) {
      console.error('❌ Build failed:', error);
      process.exit(1);
    }
  }

  async processHTML() {
    console.log('📄 Processing HTML files...');
    
    const htmlFiles = await glob('**/*.html', { cwd: this.srcDir });
    
    for (const file of htmlFiles) {
      const srcPath = path.join(this.srcDir, file);
      const distPath = path.join(this.distDir, file);
      
      let content = await fs.readFile(srcPath, 'utf8');
      
      // Replace placeholders
      content = content.replace(/\{\{YEAR\}\}/g, new Date().getFullYear());
      content = content.replace(/\{\{VERSION\}\}/g, '1.0.0');
      content = content.replace(/\{\{BUILD_TIME\}\}/g, new Date().toISOString());
      
      // Minify HTML in production
      if (this.isProduction) {
        content = await minifyHTML(content, {
          removeComments: true,
          removeRedundantAttributes: true,
          removeScriptTypeAttributes: true,
          removeStyleLinkTypeAttributes: true,
          sortClassName: true,
          useShortDoctype: true,
          collapseWhitespace: true,
          conservativeCollapse: true,
          minifyCSS: true,
          minifyJS: true
        });
      }
      
      await fs.ensureDir(path.dirname(distPath));
      await fs.writeFile(distPath, content);
    }
  }

  async processCSS() {
    console.log('🎨 Processing CSS files...');
    
    const cssFiles = await glob('**/*.css', { cwd: this.assetsDir });
    const assetsDistDir = path.join(this.distDir, 'assets');
    
    for (const file of cssFiles) {
      const srcPath = path.join(this.assetsDir, file);
      const distPath = path.join(assetsDistDir, file);
      
      let content = await fs.readFile(srcPath, 'utf8');
      
      // Process CSS (add vendor prefixes, minify, etc.)
      if (this.isProduction) {
        const result = new CleanCSS({
          level: 2,
          returnPromise: true
        }).minify(content);
        
        content = (await result).styles;
      }
      
      await fs.ensureDir(path.dirname(distPath));
      await fs.writeFile(distPath, content);
    }
  }

  async processJS() {
    console.log('⚡ Processing JavaScript files...');
    
    const jsFiles = await glob('**/*.js', { cwd: this.assetsDir });
    const assetsDistDir = path.join(this.distDir, 'assets');
    
    for (const file of jsFiles) {
      const srcPath = path.join(this.assetsDir, file);
      const distPath = path.join(assetsDistDir, file);
      
      let content = await fs.readFile(srcPath, 'utf8');
      
      // Minify JavaScript in production
      if (this.isProduction) {
        const result = await minifyJS(content, {
          compress: true,
          mangle: true,
          format: {
            comments: false
          }
        });
        
        if (result.error) {
          throw new Error(`JS minification failed for ${file}: ${result.error}`);
        }
        
        content = result.code;
      }
      
      await fs.ensureDir(path.dirname(distPath));
      await fs.writeFile(distPath, content);
    }
  }

  async copyAssets() {
    console.log('📁 Copying static assets...');
    
    // Copy images, fonts, and other assets
    const assetPatterns = ['**/*.{png,jpg,jpeg,gif,svg,ico,woff,woff2,ttf,eot,webp}'];
    
    for (const pattern of assetPatterns) {
      const files = await glob(pattern, { cwd: this.assetsDir });
      
      for (const file of files) {
        const srcPath = path.join(this.assetsDir, file);
        const distPath = path.join(this.distDir, 'assets', file);
        
        await fs.ensureDir(path.dirname(distPath));
        await fs.copy(srcPath, distPath);
      }
    }
    
    // Generate placeholder images if they don't exist
    await this.generatePlaceholderImages();
  }

  async generatePlaceholderImages() {
    const placeholders = [
      { name: 'logo.svg', width: 32, height: 32 },
      { name: 'n8n-logo.svg', width: 40, height: 40 },
      { name: 'slack-logo.svg', width: 40, height: 40 },
      { name: 'github-logo.svg', width: 40, height: 40 },
      { name: 'notion-logo.svg', width: 40, height: 40 }
    ];
    
    const imagesDir = path.join(this.distDir, 'assets', 'images');
    await fs.ensureDir(imagesDir);
    
    for (const placeholder of placeholders) {
      const filePath = path.join(imagesDir, placeholder.name);
      
      if (!(await fs.pathExists(filePath))) {
        // Generate SVG placeholder
        const svg = `<svg width="${placeholder.width}" height="${placeholder.height}" viewBox="0 0 ${placeholder.width} ${placeholder.height}" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="${placeholder.width}" height="${placeholder.height}" fill="#2563eb"/>
          <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="8">${placeholder.name.split('-')[0].toUpperCase()}</text>
        </svg>`;
        
        await fs.writeFile(filePath, svg);
      }
    }
    
    // Generate favicon if it doesn't exist
    const faviconPath = path.join(this.distDir, 'favicon.ico');
    if (!(await fs.pathExists(faviconPath))) {
      // Copy a placeholder favicon or generate one
      const placeholderFavicon = path.join(imagesDir, 'favicon-32x32.png');
      if (await fs.pathExists(placeholderFavicon)) {
        await fs.copy(placeholderFavicon, faviconPath);
      }
    }
  }

  async generateSitemap() {
    console.log('🗺️ Generating sitemap...');
    
    const pages = [
      { url: 'https://right-api.com/', priority: '1.0', changefreq: 'weekly' },
      { url: 'https://right-api.com/#features', priority: '0.8', changefreq: 'monthly' },
      { url: 'https://right-api.com/#plugins', priority: '0.8', changefreq: 'weekly' },
      { url: 'https://right-api.com/#pricing', priority: '0.9', changefreq: 'monthly' },
      { url: 'https://docs.right-api.com/', priority: '0.7', changefreq: 'weekly' },
      { url: 'https://plugins.right-api.com/', priority: '0.6', changefreq: 'daily' }
    ];
    
    const lastmod = new Date().toISOString().split('T')[0];
    
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map(page => `  <url>
    <loc>${page.url}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('\n')}
</urlset>`;
    
    await fs.writeFile(path.join(this.distDir, 'sitemap.xml'), sitemap);
  }

  async generateManifest() {
    console.log('📱 Generating web manifest...');
    
    const manifest = {
      name: "Right API - MCP Gateway",
      short_name: "Right API",
      description: "The developer-first MCP Gateway for Claude.ai integrations",
      start_url: "/",
      display: "standalone",
      background_color: "#ffffff",
      theme_color: "#2563eb",
      orientation: "portrait-primary",
      icons: [
        {
          src: "/assets/images/icon-192x192.png",
          sizes: "192x192",
          type: "image/png"
        },
        {
          src: "/assets/images/icon-512x512.png",
          sizes: "512x512",
          type: "image/png"
        }
      ],
      categories: ["developer", "productivity", "tools"],
      shortcuts: [
        {
          name: "Documentation",
          short_name: "Docs",
          description: "View the documentation",
          url: "https://docs.right-api.com",
          icons: [{ src: "/assets/images/docs-icon.png", sizes: "96x96" }]
        },
        {
          name: "Plugins",
          short_name: "Plugins",
          description: "Browse plugins marketplace",
          url: "https://plugins.right-api.com",
          icons: [{ src: "/assets/images/plugins-icon.png", sizes: "96x96" }]
        }
      ]
    };
    
    await fs.writeFile(
      path.join(this.distDir, 'manifest.json'),
      JSON.stringify(manifest, null, 2)
    );
  }

  startWatching() {
    console.log('👀 Watching for changes...');
    
    const watcher = chokidar.watch([this.srcDir, this.assetsDir], {
      ignored: /(^|[\/\\])\../,
      persistent: true
    });
    
    watcher
      .on('change', async (path) => {
        console.log(`📝 File changed: ${path}`);
        await this.build();
      })
      .on('add', async (path) => {
        console.log(`➕ File added: ${path}`);
        await this.build();
      })
      .on('unlink', async (path) => {
        console.log(`➖ File removed: ${path}`);
        await this.build();
      });
  }
}

// Run the build
if (require.main === module) {
  const builder = new WebsiteBuildTool();
  builder.build().catch(console.error);
}

module.exports = WebsiteBuildTool;
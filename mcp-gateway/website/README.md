# 🌐 Right API Website

Professional, fast, and SEO-optimized website for Right API - The Developer's MCP Gateway.

## ✨ Features

- **🚀 Lightning Fast**: Optimized for speed with compression, caching, and CDN
- **📱 Responsive Design**: Perfect on all devices from mobile to desktop  
- **🔍 SEO Optimized**: Meta tags, structured data, sitemap, and analytics
- **🔒 Security First**: Security headers, CSP, and rate limiting
- **🐳 Docker Ready**: Containerized with Traefik integration
- **📊 Analytics**: Built-in support for Plausible and Google Analytics
- **⚡ Production Ready**: SSL certificates, monitoring, and health checks

## 🏗️ Architecture

```
Browser → Traefik → Nginx → Static Website
          ↓
     Let's Encrypt SSL
          ↓
     Analytics & Monitoring
```

## 🚀 Quick Start

### **Local Development**
```bash
# Clone and setup
git clone <repository>
cd website

# Install dependencies
npm install

# Build and serve
npm run build
npm run serve

# Development with watch mode
npm run dev
```

### **Production Deployment**
```bash
# Environment setup
cp .env.example .env
# Edit .env with your settings

# Deploy with Docker
docker-compose up -d

# Check status
docker-compose ps
docker-compose logs -f
```

## 🔧 Configuration

### **Environment Variables**
```bash
# Required
DOMAIN=right-api.com
ACME_EMAIL=admin@right-api.com

# Optional
TRAEFIK_LOG_LEVEL=INFO
TRAEFIK_AUTH=admin:password_hash
GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

### **SSL Certificates**
Automatic SSL certificates via Let's Encrypt:
- Automatic renewal
- HTTP to HTTPS redirect
- Security headers included

### **Domain Configuration**
The website handles multiple domains:
- `right-api.com` (primary)
- `www.right-api.com` (redirects to primary)
- `traefik.right-api.com` (Traefik dashboard)

## 📊 Performance

### **Optimization Features**
- ✅ Gzip/Brotli compression
- ✅ Image optimization
- ✅ CSS/JS minification
- ✅ Browser caching
- ✅ CDN ready

### **Lighthouse Scores**
Target scores for production:
- **Performance**: 95+
- **Accessibility**: 100
- **Best Practices**: 95+
- **SEO**: 100

## 🔒 Security

### **Security Headers**
- X-Frame-Options: SAMEORIGIN
- X-Content-Type-Options: nosniff
- X-XSS-Protection: 1; mode=block
- Strict-Transport-Security
- Content-Security-Policy

### **Rate Limiting**
- 100 requests per minute per IP
- Burst protection
- DDoS mitigation

## 📈 Analytics

### **Plausible Analytics** (Privacy-focused)
```bash
# Enable analytics profile
docker-compose --profile analytics up -d

# Access at: https://analytics.right-api.com
```

### **Google Analytics** (Optional)
Set `GA_MEASUREMENT_ID` in environment variables.

## 🛠️ Build Process

### **Build Scripts**
```bash
npm run build     # Production build
npm run dev       # Development with watch
npm run serve     # Local server
npm run lint      # Code linting
npm run validate  # HTML validation
npm run optimize  # Performance optimization
```

### **Build Features**
- HTML minification
- CSS optimization and minification
- JavaScript minification
- Image optimization
- Sitemap generation
- Web manifest creation

## 🐳 Docker

### **Dockerfile Features**
- Multi-stage build for optimization
- Security best practices
- Health checks
- Non-root user
- Minimal Alpine Linux base

### **Docker Compose Services**
- **Website**: Nginx serving static files
- **Traefik**: Reverse proxy with SSL
- **Analytics**: Optional Plausible setup
- **Monitoring**: Optional metrics collection

## 🔍 SEO

### **Implemented SEO Features**
- ✅ Meta descriptions and titles
- ✅ Open Graph tags
- ✅ Twitter Card tags
- ✅ Structured data (JSON-LD)
- ✅ XML sitemap
- ✅ Robots.txt
- ✅ Canonical URLs
- ✅ Fast loading speed

### **Content Optimization**
- Semantic HTML structure
- Proper heading hierarchy
- Alt tags for images
- Internal linking
- Mobile-first design

## 📱 Progressive Web App

### **PWA Features**
- Web manifest
- Service worker (coming soon)
- Offline functionality (coming soon)
- Install prompts
- Native app-like experience

## 🚀 Deployment

### **Production Checklist**
- [ ] Set environment variables
- [ ] Configure DNS records
- [ ] Deploy with Docker Compose
- [ ] Verify SSL certificates
- [ ] Test all functionality
- [ ] Setup monitoring
- [ ] Configure analytics
- [ ] Submit to search engines

### **DNS Configuration**
```
A     right-api.com                 → your-server-ip
CNAME www.right-api.com             → right-api.com
CNAME traefik.right-api.com         → right-api.com
CNAME analytics.right-api.com       → right-api.com
```

### **Monitoring URLs**
- Website: https://right-api.com
- Health: https://right-api.com/health
- Traefik: https://traefik.right-api.com
- Analytics: https://analytics.right-api.com

## 🔧 Maintenance

### **Regular Tasks**
- Monitor SSL certificate renewal
- Check application logs
- Review analytics data
- Update dependencies
- Backup configuration

### **Troubleshooting**
```bash
# Check container status
docker-compose ps

# View logs
docker-compose logs -f right-api-website
docker-compose logs -f traefik

# Restart services
docker-compose restart

# SSL certificate issues
docker-compose logs traefik | grep acme
```

## 📄 License

MIT License - see LICENSE file for details.

---

**Built with ❤️ for the Right API community**

[Website](https://right-api.com) | [Documentation](https://docs.right-api.com) | [Support](mailto:support@right-api.com)
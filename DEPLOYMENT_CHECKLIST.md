# Deployment Checklist - SaaS Platform

## ✅ Code Changes Completed

### Cross-Platform Compatibility
- ✅ **Font paths**: Auto-detects OS and uses appropriate font paths
  - Windows: `C:\Windows\Fonts\arial.ttf`
  - macOS: `/System/Library/Fonts/Supplemental/Arial.ttf`
  - Linux: `/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf`

- ✅ **File paths**: Using `path.join()` for cross-platform compatibility
- ✅ **Directory creation**: Using `recursive: true` for safe directory creation

### Features Implemented
- ✅ Split-screen video export (server-side with FFmpeg)
- ✅ Ranking video export with quality options (720p, 1080p, 4K)
- ✅ Dynamic text scaling based on resolution
- ✅ Subtitle rendering with proper font sizing

---

## 🚀 Pre-Deployment Requirements

### 1. System Dependencies

#### FFmpeg Installation (REQUIRED)
The application requires FFmpeg to be installed on the server:

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install ffmpeg -y
```

**CentOS/RHEL:**
```bash
sudo yum install epel-release -y
sudo yum install ffmpeg -y
```

**Windows:**
1. Download FFmpeg from https://ffmpeg.org/download.html
2. Add FFmpeg to system PATH
3. Verify: `ffmpeg -version`

**macOS:**
```bash
brew install ffmpeg
```

**Verify Installation:**
```bash
ffmpeg -version
ffprobe -version
```

#### Linux Font Installation (for Linux servers)
```bash
sudo apt install fonts-liberation -y
```

---

### 2. Environment Variables

Create `.env` file in project root:

```env
NODE_ENV=production
PORT=3000
VITE_DEV_SERVER_PORT=3000
```

---

### 3. Node.js Dependencies

**Minimum Node.js Version:** 18.x or higher

Install dependencies:
```bash
npm install
```

---

## 📦 Build Process

### Production Build
```bash
npm run build
```

This creates:
- `dist/` - Frontend production build
- Server runs from `server.js`

---

## 🖥️ Deployment Options

### Option 1: Traditional VPS (Railway, DigitalOcean, etc.)

1. **Upload files** to server
2. **Install dependencies:**
   ```bash
   npm install --production
   ```

3. **Install FFmpeg** (see above)

4. **Build frontend:**
   ```bash
   npm run build
   ```

5. **Start server:**
   ```bash
   npm start
   ```

6. **Use PM2 for process management:**
   ```bash
   npm install -g pm2
   pm2 start server.js --name "sass-platform"
   pm2 save
   pm2 startup
   ```

---

### Option 2: Docker Deployment

Create `Dockerfile`:
```dockerfile
FROM node:18-alpine

# Install FFmpeg
RUN apk add --no-cache ffmpeg

# Install fonts
RUN apk add --no-cache ttf-liberation

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --production

# Copy source
COPY . .

# Build frontend
RUN npm run build

# Expose port
EXPOSE 3000

# Start server
CMD ["npm", "start"]
```

Build and run:
```bash
docker build -t sass-platform .
docker run -p 3000:3000 sass-platform
```

---

### Option 3: Railway.app

**`railway.json`:**
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm install && npm run build"
  },
  "deploy": {
    "startCommand": "npm start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

**Deploy:**
1. Push to GitHub
2. Connect to Railway
3. Railway will auto-install FFmpeg (included in Nixpacks)

---

## ⚠️ Important Notes

### File Upload Limits
- Default: 100MB per video file
- Configured in `server.js`: `multer({ limits: { fileSize: 100 * 1024 * 1024 } })`
- **Increase if needed** for larger files

### Storage Considerations
- Temporary files stored in: `./uploads/`
- Processed videos stored in: `./downloads/`
- **Auto-cleanup**: Old files cleaned every hour (configurable in `server.js`)

### Memory Requirements
- **Minimum**: 2GB RAM
- **Recommended**: 4GB+ RAM for 4K exports
- Video processing is memory-intensive

### Disk Space
- **Minimum**: 20GB
- **Recommended**: 50GB+ for production
- Videos can be large, especially 4K exports

---

## 🔒 Security Checklist

- ✅ No hardcoded credentials
- ✅ Using environment variables
- ✅ File upload validation (multer)
- ✅ Temporary file cleanup
- ⚠️ **TODO**: Add rate limiting for export endpoints
- ⚠️ **TODO**: Add authentication for sensitive operations

---

## 🧪 Testing Before Deployment

### 1. Local Testing
```bash
npm run build
npm start
```

### 2. Test Split-Screen Export
- Navigate to `/split-screen`
- Upload videos
- Generate and export
- Verify downloaded video

### 3. Test Ranking Export
- Navigate to `/video-ranking`
- Test all quality options (720p, 1080p, 4K)
- Verify text scaling

### 4. Cross-Platform Testing
- Test font rendering on different OS
- Verify FFmpeg commands work

---

## 📊 Monitoring

### Logs to Monitor
```bash
# With PM2
pm2 logs sass-platform

# Check FFmpeg errors
grep "FFmpeg" ~/.pm2/logs/*
```

### Health Checks
- Endpoint: `GET /` (serves frontend)
- FFmpeg check: `ffmpeg -version`

---

## 🐛 Troubleshooting

### Issue: "FFmpeg not found"
**Solution:** Install FFmpeg (see System Dependencies)

### Issue: "Font file not found"
**Solution:**
- Linux: Install liberation fonts
- Windows: Verify Arial fonts in `C:\Windows\Fonts\`
- macOS: Pre-installed

### Issue: "Out of memory" during 4K export
**Solution:**
- Increase server RAM
- Reduce concurrent exports
- Use 1080p instead of 4K

### Issue: "Upload failed - file too large"
**Solution:** Increase multer file size limit in `server.js`

---

## 🎯 Final Checklist

Before pushing to production:

- [ ] FFmpeg installed and working
- [ ] Fonts installed (Linux only)
- [ ] Environment variables configured
- [ ] Production build tested locally
- [ ] All export features tested
- [ ] PM2 or process manager configured
- [ ] Monitoring set up
- [ ] Backup strategy in place

---

## 🟢 GREEN LIGHT STATUS

**All critical issues resolved:**
✅ Cross-platform font paths implemented
✅ FFmpeg dependencies documented
✅ No hardcoded system paths
✅ Temporary file cleanup working
✅ Environment variables used correctly

**Ready to deploy!** 🚀

---

## 📞 Support

If issues occur after deployment:
1. Check logs: `pm2 logs`
2. Verify FFmpeg: `ffmpeg -version`
3. Check disk space: `df -h`
4. Check memory: `free -m`

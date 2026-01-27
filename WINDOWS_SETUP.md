# Windows Setup Guide

## System Requirements

- **Node.js**: 20.0.0 or higher
- **npm**: 10.0.0 or higher
- **yt-dlp**: Latest version (command-line tool)
- **FFmpeg**: Latest version (command-line tool)

---

## Step-by-Step Installation

### 1. Install Node.js

Download and install from: https://nodejs.org/

Choose the **LTS version** (20.x or higher)

Verify installation:
```powershell
node --version
# Should show: v20.x.x or higher

npm --version
# Should show: 10.x.x or higher
```

---

### 2. Install yt-dlp

**Option A: Using Chocolatey (Recommended)**

1. Install Chocolatey if you don't have it:
   - Visit: https://chocolatey.org/install
   - Open PowerShell as Administrator
   - Run the installation command from the website

2. Install yt-dlp:
```powershell
choco install yt-dlp
```

3. Verify:
```powershell
yt-dlp --version
```

**Option B: Using winget (Windows 10+)**

```powershell
winget install yt-dlp
```

**Option C: Manual Installation**

1. Download `yt-dlp.exe` from:
   https://github.com/yt-dlp/yt-dlp/releases/latest

2. Create a directory:
   ```powershell
   mkdir "C:\Program Files\yt-dlp"
   ```

3. Move `yt-dlp.exe` to: `C:\Program Files\yt-dlp\`

4. Add to PATH:
   - Press `Win + X` → System
   - Click "Advanced system settings"
   - Click "Environment Variables"
   - Under "System Variables", find "Path"
   - Click "Edit"
   - Click "New"
   - Add: `C:\Program Files\yt-dlp`
   - Click OK on all dialogs

5. **Restart your terminal** and verify:
   ```powershell
   yt-dlp --version
   ```

---

### 3. Install FFmpeg

**Option A: Using Chocolatey (Recommended)**

```powershell
choco install ffmpeg
```

**Option B: Manual Installation**

1. Download from: https://ffmpeg.org/download.html
   - Choose "Windows builds from gyan.dev"
   - Download "ffmpeg-release-essentials.zip"

2. Extract to: `C:\Program Files\ffmpeg`

3. Add to PATH:
   - Follow the same PATH steps as yt-dlp
   - Add: `C:\Program Files\ffmpeg\bin`

4. **Restart your terminal** and verify:
   ```powershell
   ffmpeg -version
   ffprobe -version
   ```

---

### 4. Clone and Install Project

```powershell
# Clone the repository
git clone <your-repo-url>
cd Sass-platform

# Install dependencies
npm install

# The postinstall script will automatically run and copy FFmpeg files
```

---

### 5. Run the Application

**Development Mode:**
```powershell
npm run dev
```

**Production Mode:**
```powershell
# Build the frontend
npm run build

# Start the server
npm start
```

The application will be available at: http://localhost:3000

---

## Troubleshooting

### Issue: "yt-dlp is not found"

**Solution:**
1. Make sure yt-dlp is installed: `yt-dlp --version`
2. If not found, add it to PATH (see Step 2 above)
3. **Restart your terminal** after adding to PATH
4. Try again

### Issue: "FFmpeg not found"

**Solution:**
1. Make sure FFmpeg is installed: `ffmpeg -version`
2. If not found, add it to PATH (see Step 3 above)
3. **Restart your terminal** after adding to PATH
4. Try again

### Issue: "Permission denied" during npm install

**Solution:**
Run PowerShell as Administrator:
```powershell
# Right-click PowerShell → "Run as Administrator"
cd path\to\Sass-platform
npm install
```

### Issue: Postinstall script fails

**Solution:**
Run the postinstall script manually:
```powershell
node scripts/postinstall.js
```

### Issue: "Cannot find module" errors

**Solution:**
1. Delete `node_modules` and `package-lock.json`:
   ```powershell
   rmdir /s node_modules
   del package-lock.json
   ```

2. Reinstall:
   ```powershell
   npm install
   ```

### Issue: FFmpeg filter parsing error during video export

**Error Message:**
```
[AVFilterGraph] No option name near 'WindowsFontsarialbd.ttf...'
Error parsing filterchain... Invalid argument
```

**Solution:**
This issue has been fixed in the latest version. The application now uses forward slashes in font paths (which FFmpeg accepts on all platforms including Windows) and properly escapes filter parameters.

If you still encounter this error:
1. Make sure you have the latest code: `git pull`
2. Reinstall dependencies: `npm install`
3. Verify FFmpeg is installed: `ffmpeg -version`
4. Try exporting again

### Issue: "yt-dlp finished but MP4 file not found"

**Error Message:**
```
yt-dlp finished but MP4 file not found for id (dev): MTc2ODE1Nzc0ODI5
```

**Root Cause:**
yt-dlp requires FFmpeg to merge video and audio streams when downloading from platforms like TikTok, Instagram, and YouTube. Without FFmpeg in PATH, yt-dlp completes but doesn't produce the final MP4 file.

**Solution:**

1. **Verify both yt-dlp AND FFmpeg are installed:**
   ```powershell
   yt-dlp --version
   ffmpeg -version
   ```

2. **If FFmpeg is missing, install it** (see Step 3 above for installation)

3. **Make sure BOTH are in your PATH:**
   - Press `Win + X` → System
   - Click "Advanced system settings"
   - Click "Environment Variables"
   - Under "System Variables", find "Path"
   - Verify these entries exist:
     - `C:\Program Files\yt-dlp` (or wherever you installed yt-dlp)
     - `C:\Program Files\ffmpeg\bin` (or wherever you installed FFmpeg)

4. **CRITICAL: Restart your terminal completely**
   - Close all PowerShell/CMD windows
   - Restart your code editor/IDE
   - Open a fresh terminal

5. **Test both commands work:**
   ```powershell
   yt-dlp --version
   ffmpeg -version
   ```

6. **If still not working, manually tell yt-dlp where FFmpeg is:**
   - Find where FFmpeg is installed: `where ffmpeg`
   - Note the path (e.g., `C:\Program Files\ffmpeg\bin\ffmpeg.exe`)
   - The application will automatically use FFmpeg from PATH

7. **Try the download feature again in the application**

**Why this happens:**
- yt-dlp downloads video and audio as separate streams from most platforms
- FFmpeg is needed to merge them into a single MP4 file
- If FFmpeg isn't found, yt-dlp completes the download but can't create the final file

---

## Package Versions

These are the exact versions used in this project:

```json
{
  "dependencies": {
    "@ffmpeg/core": "^0.12.6",
    "@ffmpeg/ffmpeg": "^0.12.15",
    "@ffmpeg/util": "^0.12.2",
    "express": "^4.18.2",
    "multer": "^2.0.2",
    "react": "^19.2.0",
    "react-dom": "^19.2.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^5.0.0",
    "typescript": "~5.8.2",
    "vite": "^6.2.0"
  },
  "engines": {
    "node": ">=20.0.0",
    "npm": ">=10.0.0"
  }
}
```

---

## System Binary Versions

**yt-dlp:**
- Latest stable version from: https://github.com/yt-dlp/yt-dlp/releases
- Check version: `yt-dlp --version`

**FFmpeg:**
- Latest stable version from: https://ffmpeg.org/download.html
- Check version: `ffmpeg -version`

---

## Need Help?

If you encounter any issues:

1. Check that Node.js version is 20.0.0 or higher: `node --version`
2. Check that yt-dlp is installed and in PATH: `yt-dlp --version`
3. Check that FFmpeg is installed and in PATH: `ffmpeg -version`
4. Make sure you **restarted your terminal** after adding to PATH
5. Try running PowerShell as Administrator

For more help, contact the project maintainer.

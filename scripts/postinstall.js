import { existsSync, mkdirSync, cpSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

console.log('📦 Running postinstall script...');

try {
  const publicFFmpegDir = join(projectRoot, 'public', 'ffmpeg');
  const ffmpegCoreSource = join(projectRoot, 'node_modules', '@ffmpeg', 'core', 'dist');

  // Check if source exists
  if (!existsSync(ffmpegCoreSource)) {
    console.warn('⚠️  FFmpeg core not found at:', ffmpegCoreSource);
    console.warn('⚠️  Skipping FFmpeg setup. You may need to run npm install again.');
    process.exit(0);
  }

  // Create public/ffmpeg directory if it doesn't exist
  if (!existsSync(publicFFmpegDir)) {
    console.log('📁 Creating directory:', publicFFmpegDir);
    mkdirSync(publicFFmpegDir, { recursive: true });
  }

  // Copy FFmpeg core files (works on Windows, macOS, Linux)
  console.log('📋 Copying FFmpeg core files...');
  cpSync(ffmpegCoreSource, publicFFmpegDir, { recursive: true });

  console.log('✅ Postinstall complete!');
  console.log('📂 FFmpeg files copied to:', publicFFmpegDir);
} catch (error) {
  console.error('❌ Postinstall error:', error.message);
  process.exit(1);
}

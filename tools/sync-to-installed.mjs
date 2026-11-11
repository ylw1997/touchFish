import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const extDir = path.join(process.env.USERPROFILE || '', '.vscode', 'extensions');

function sync() {
  if (!fs.existsSync(extDir)) {
    console.error('VS Code extensions directory not found:', extDir);
    return;
  }

  // 找到已安装的 ylw.touchfish-数字 目录（排除 touchfish-fund）
  const dirs = fs.readdirSync(extDir).filter(d => /^ylw\.touchfish-\d+/.test(d));
  if (dirs.length === 0) {
    console.error('No installed ylw.touchfish extension found in', extDir);
    return;
  }

  dirs.sort().reverse();
  const targetDir = path.join(extDir, dirs[0]);
  console.log(`Syncing build artifacts to installed extension: ${targetDir}`);

  // 1. 同步 extension.js
  const srcExtJs = path.join(rootDir, 'dist', 'extension.js');
  const dstExtJs = path.join(targetDir, 'dist', 'extension.js');
  if (fs.existsSync(srcExtJs)) {
    fs.copyFileSync(srcExtJs, dstExtJs);
    console.log('✔ Synced dist/extension.js');
  }

  // 2. 同步 xiaoyuzhou/dist
  const srcXyzDist = path.join(rootDir, 'xiaoyuzhou', 'dist');
  const dstXyzDist = path.join(targetDir, 'xiaoyuzhou', 'dist');
  if (fs.existsSync(srcXyzDist)) {
    fs.cpSync(srcXyzDist, dstXyzDist, { recursive: true });
    console.log('✔ Synced xiaoyuzhou/dist');
  }

  console.log('Successfully synced all artifacts to installed extension!');
}

sync();

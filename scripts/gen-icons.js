/**
 * Генерация icon-192.png и icon-512.png для PWA/APK.
 * Запуск: node scripts/gen-icons.js (из корня todo-pwa)
 * Требует: npm install canvas (или запустите gen-icons.html в браузере)
 */
const fs = require('fs');
const path = require('path');

const sizes = [192, 512];
const iconsDir = path.join(__dirname, '..', 'icons');

try {
  const { createCanvas } = require('canvas');
  if (!fs.existsSync(iconsDir)) fs.mkdirSync(iconsDir, { recursive: true });

  sizes.forEach((size) => {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');
    const r = size * 0.16;
    ctx.fillStyle = '#1a1b2e';
    ctx.beginPath();
    ctx.roundRect(0, 0, size, size, r);
    ctx.fill();
    ctx.fillStyle = '#e94560';
    const barH = size * 0.04;
    const barR = barH * 0.5;
    ctx.beginPath();
    ctx.roundRect(size * 0.19, size * 0.4 - barH / 2, size * 0.62, barH, barR);
    ctx.fill();
    ctx.fillStyle = '#16213e';
    ctx.beginPath();
    ctx.roundRect(size * 0.19, size * 0.56 - barH / 2, size * 0.42, barH, barR);
    ctx.fill();
    const out = path.join(iconsDir, `icon-${size}.png`);
    fs.writeFileSync(out, canvas.toBuffer('image/png'));
    console.log('Written', out);
  });
} catch (e) {
  if (e.code === 'MODULE_NOT_FOUND') {
    console.log('Модуль "canvas" не установлен. Варианты:');
    console.log('  1. npm install canvas && node scripts/gen-icons.js');
    console.log('  2. Откройте gen-icons.html в браузере и скачайте иконки в папку icons/');
  } else throw e;
}


import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      // تنظیم دقیق نام مخزن برای گیت‌هاب پیجز
      base: '/sabanour-cmms/', 
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      build: {
        target: 'es2015', // Ensure compatibility with older mobile browsers to prevent white screen
        outDir: 'dist',
        rollupOptions: {
            // این تنظیم باعث می‌شود اگر پکیج نصب نبود، بیلد فیل نشود و از CDN استفاده کند
            external: ['jsqr'],
            output: {
                globals: {
                    jsqr: 'jsQR'
                }
            }
        }
      },
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve('.'),
        }
      }
    };
});

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// GitHub Pages 公開用に base を設定（リポジトリ名に合わせる）
export default defineConfig({
  base: '/shikin-kanri/',
  // iPhone など同じWi-Fi内の端末からアクセスできるよう LAN にバインド
  // allowedHosts: true は一時HTTPSトンネル(trycloudflare等)経由のアクセスを許可するため
  server: { host: true, allowedHosts: true },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon-192.png', 'icon-512.png'],
      manifest: {
        name: '高橋商店 資金管理',
        short_name: '資金管理',
        start_url: '/shikin-kanri/',
        scope: '/shikin-kanri/',
        display: 'standalone',
        background_color: '#1a1a2e',
        theme_color: '#0f3460',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
    }),
  ],
});

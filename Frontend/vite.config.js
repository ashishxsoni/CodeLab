import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    server: {
      proxy: {
        "/api": {
          //  Now works properly this is crucial as (import.env )is for runtime
          // but here we need for the build time so we just use the loadEnv from vite and env.Vite_API
          target: String(env.VITE_API_URL), 
          changeOrigin: true,
          secure: false,
          ws: true,
          rewrite: (path) => path.replace(/^\/api/, "")
        }
      }
    },
    plugins: [react(), tailwindcss()],
  };
});

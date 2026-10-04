import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import fs from 'fs';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(), 
    tailwindcss(),
    {
      name: 'docx-mime-type',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url && req.url.includes('INFORME_TECNICO_DKIRAM_PASTELERIA.docx')) {
            const filePath = path.resolve('public', 'INFORME_TECNICO_DKIRAM_PASTELERIA.docx');
            if (fs.existsSync(filePath)) {
              const fileContent = fs.readFileSync(filePath);
              res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
              res.setHeader('Content-Disposition', 'attachment; filename="INFORME_TECNICO_DKIRAM_PASTELERIA.docx"');
              res.setHeader('Content-Length', fileContent.length);
              res.setHeader('Cache-Control', 'no-cache');
              res.end(fileContent);
              return;
            }
          }
          next();
        });
      }
    }
  ],
  server: {
    host: '0.0.0.0',
    port: 3000,
  },
});

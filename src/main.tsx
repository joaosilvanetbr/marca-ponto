import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { QueryProvider } from './contexts/QueryProvider'
import { AuthProvider } from './contexts/AuthProvider'

// Registra o Service Worker do PWA e força atualização quando há nova versão
if ('serviceWorker' in navigator) {
  import('virtual:pwa-register').then(({ registerSW }) => {
    registerSW({
      immediate: true,
      onNeedRefresh() {
        // Força recarregamento quando há nova versão
        if (confirm('Nova versão disponível. Recarregar agora?')) {
          location.reload();
        }
      },
    });
  }).catch(() => {
    // Fallback silencioso se o virtual module não estiver disponível
  });
}

// Marca que o JS carregou (para o fallback no index.html)
(window as Window & { __app_loaded?: boolean }).__app_loaded = true;

try {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    throw new Error('Elemento #root não encontrado');
  }
  createRoot(rootElement).render(
    <StrictMode>
      <QueryProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </QueryProvider>
    </StrictMode>,
  );
} catch (err) {
  console.error('Erro ao inicializar app:', err);
  const rootElement = document.getElementById('root');
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;padding:20px;font-family:system-ui,sans-serif;text-align:center;background:#F2F2F7;color:#333;">
        <div style="font-size:48px;margin-bottom:16px;">⚠️</div>
        <h2 style="margin:0 0 8px;font-size:20px;">Erro ao carregar o app</h2>
        <p style="margin:0 0 20px;color:#666;font-size:14px;">Tente recarregar a página ou limpar o cache do navegador.</p>
        <button onclick="location.reload()" style="padding:12px 24px;border:none;border-radius:12px;background:linear-gradient(135deg,#06b6d4,#3b82f6);color:white;font-size:16px;cursor:pointer;">
          Recarregar
        </button>
      </div>
    `;
  }
}

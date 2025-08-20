import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Global error handler for unhandled promise rejections
window.addEventListener('unhandledrejection', event => {
  console.error('Unhandled promise rejection:', event.reason);
  
  // Log more details if it's an error
  if (event.reason instanceof Error) {
    console.error('Error details:', {
      name: event.reason.name,
      message: event.reason.message,
      stack: event.reason.stack
    });
  }
  
  // Prevent the default browser behavior (showing the modal)
  event.preventDefault();
});

// Disable Vite error overlay
if (import.meta.hot) {
  import.meta.hot.on('vite:error', (error) => {
    console.error('Vite error (suppressed overlay):', error);
  });
}

// Disable any error overlays by removing them from DOM
const removeErrorOverlays = () => {
  // Remove Vite error overlay
  const viteOverlay = document.querySelector('vite-error-overlay');
  if (viteOverlay) {
    viteOverlay.remove();
  }
  
  // Remove any error overlay divs
  const errorOverlays = document.querySelectorAll('[id*="error"], [class*="error-overlay"], [class*="runtime-error"]');
  errorOverlays.forEach(overlay => {
    if (overlay.shadowRoot || overlay.innerHTML.includes('Failed to fetch')) {
      overlay.remove();
    }
  });
};

// Run removal function periodically
setInterval(removeErrorOverlays, 1000);

// Global error handler for uncaught errors
window.addEventListener('error', event => {
  console.error('Uncaught error:', event.error);
  
  // Log more details
  if (event.error instanceof Error) {
    console.error('Error details:', {
      name: event.error.name,
      message: event.error.message,
      stack: event.error.stack,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno
    });
  }
});

createRoot(document.getElementById("root")!).render(<App />);

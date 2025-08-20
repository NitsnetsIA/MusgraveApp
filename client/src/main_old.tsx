import { createRoot } from "react-dom/client";
import App from "./App_minimal";
import "./index.css";

// Minimal error handling
console.log('Starting Musgrave app...');

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

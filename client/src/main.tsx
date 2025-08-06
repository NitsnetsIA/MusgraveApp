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

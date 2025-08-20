import { createRoot } from "react-dom/client";
import "./index.css";

// Fallback component in case main App fails
function FallbackApp() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f3f4f6',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <div style={{
          display: 'inline-block',
          backgroundColor: '#10b981',
          color: 'white',
          fontSize: '2rem',
          fontWeight: 'bold',
          padding: '1rem',
          borderRadius: '8px',
          marginBottom: '1rem'
        }}>
          M
        </div>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111827', marginBottom: '1rem' }}>
          Musgrave
        </h1>
        <p style={{ color: '#6b7280', fontSize: '1.125rem' }}>
          Aplicación en modo recuperación
        </p>
        <button 
          onClick={() => window.location.reload()}
          style={{
            marginTop: '1rem',
            backgroundColor: '#3b82f6',
            color: 'white',
            padding: '0.5rem 1rem',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Recargar aplicación
        </button>
      </div>
    </div>
  );
}

// Dynamic import with fallback
async function loadApp() {
  try {
    const { default: App } = await import("./App");
    return App;
  } catch (error) {
    console.error("Error loading App component:", error);
    return FallbackApp;
  }
}

async function initializeApp() {
  const container = document.getElementById("root");
  if (!container) {
    throw new Error("Failed to find the root element");
  }

  const root = createRoot(container);
  
  try {
    const App = await loadApp();
    root.render(<App />);
  } catch (renderError) {
    console.error("Render error:", renderError);
    root.render(<FallbackApp />);
  }
}

// Initialize the app
initializeApp().catch(console.error);
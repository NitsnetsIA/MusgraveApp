import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

// Simple React component without any complex imports
function SimpleApp() {
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
        <h1 style={{
          fontSize: '2rem',
          fontWeight: 'bold',
          color: '#111827',
          marginBottom: '1rem'
        }}>
          Musgrave
        </h1>
        <p style={{
          color: '#6b7280',
          fontSize: '1.125rem'
        }}>
          React funcionando sin Fast Refresh
        </p>
        <button 
          onClick={() => alert('¡React funciona!')}
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
          Probar React
        </button>
      </div>
    </div>
  );
}

const container = document.getElementById("root");
if (container) {
  const root = createRoot(container);
  root.render(
    <StrictMode>
      <SimpleApp />
    </StrictMode>
  );
}
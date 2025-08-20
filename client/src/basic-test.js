// Test básico sin React para verificar que JavaScript funciona
document.addEventListener('DOMContentLoaded', function() {
  const root = document.getElementById('root');
  if (root) {
    root.innerHTML = `
      <div style="
        min-height: 100vh; 
        display: flex; 
        align-items: center; 
        justify-content: center;
        background-color: #f3f4f6;
        font-family: Arial, sans-serif;
      ">
        <div style="text-align: center; padding: 2rem;">
          <div style="
            display: inline-block;
            background-color: #10b981;
            color: white;
            font-size: 2rem;
            font-weight: bold;
            padding: 1rem;
            border-radius: 8px;
            margin-bottom: 1rem;
          ">
            M
          </div>
          <h1 style="font-size: 2rem; font-weight: bold; color: #111827; margin-bottom: 1rem;">
            Musgrave
          </h1>
          <p style="color: #6b7280; font-size: 1.125rem;">
            Aplicación funcionando SIN React (JavaScript puro)
          </p>
          <button onclick="alert('¡Funciona!')" style="
            margin-top: 1rem;
            background-color: #3b82f6;
            color: white;
            padding: 0.5rem 1rem;
            border: none;
            border-radius: 4px;
            cursor: pointer;
          ">
            Probar
          </button>
        </div>
      </div>
    `;
  }
});
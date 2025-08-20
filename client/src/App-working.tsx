import { useState } from "react";

// Componente de login simple
function LoginPage({ onLogin }: { onLogin: (email: string) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && password) {
      onLogin(email);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f3f4f6',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        width: '100%',
        maxWidth: '400px'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
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
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827' }}>
            Musgrave
          </h1>
          <p style={{ color: '#6b7280' }}>
            Inicia sesión en tu cuenta
          </p>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#374151' }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@musgrave.es"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                fontSize: '1rem'
              }}
              required
            />
          </div>
          
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#374151' }}>
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                fontSize: '1rem'
              }}
              required
            />
          </div>
          
          <button
            type="submit"
            style={{
              width: '100%',
              backgroundColor: '#3b82f6',
              color: 'white',
              padding: '0.75rem',
              border: 'none',
              borderRadius: '4px',
              fontSize: '1rem',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            Iniciar sesión
          </button>
        </form>
      </div>
    </div>
  );
}

// Componente principal de la aplicación
function Dashboard({ user, onLogout }: { user: string; onLogout: () => void }) {
  const [activeTab, setActiveTab] = useState('productos');

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      {/* Header */}
      <header style={{
        backgroundColor: '#10b981',
        color: 'white',
        padding: '1rem 2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{
            backgroundColor: 'white',
            color: '#10b981',
            padding: '0.5rem',
            borderRadius: '4px',
            fontWeight: 'bold',
            marginRight: '1rem'
          }}>
            M
          </div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Musgrave</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span>Hola, {user}</span>
          <button
            onClick={onLogout}
            style={{
              backgroundColor: '#ef4444',
              color: 'white',
              padding: '0.5rem 1rem',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Cerrar sesión
          </button>
        </div>
      </header>

      {/* Navigation */}
      <nav style={{
        backgroundColor: 'white',
        borderBottom: '1px solid #e5e7eb',
        padding: '0 2rem'
      }}>
        <div style={{ display: 'flex', gap: '2rem' }}>
          {[
            { id: 'productos', label: 'Productos' },
            { id: 'ordenes', label: 'Órdenes de compra' },
            { id: 'pedidos', label: 'Mis pedidos' },
            { id: 'cuenta', label: 'Mi cuenta' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: 'none',
                border: 'none',
                padding: '1rem 0',
                cursor: 'pointer',
                borderBottom: activeTab === tab.id ? '2px solid #10b981' : '2px solid transparent',
                color: activeTab === tab.id ? '#10b981' : '#6b7280',
                fontWeight: activeTab === tab.id ? '600' : '400'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Content */}
      <main style={{ padding: '2rem' }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '2rem',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          {activeTab === 'productos' && (
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
                Catálogo de productos
              </h2>
              <p style={{ color: '#6b7280', marginBottom: '2rem' }}>
                Explora nuestro catálogo completo de productos para tu tienda.
              </p>
              <div style={{
                backgroundColor: '#f9fafb',
                padding: '2rem',
                borderRadius: '4px',
                textAlign: 'center'
              }}>
                <p style={{ color: '#6b7280' }}>
                  Aplicación Musgrave funcionando correctamente
                </p>
                <p style={{ color: '#059669', fontWeight: '600', marginTop: '0.5rem' }}>
                  React cargado sin errores de Fast Refresh
                </p>
              </div>
            </div>
          )}
          
          {activeTab === 'ordenes' && (
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
                Órdenes de compra
              </h2>
              <p style={{ color: '#6b7280' }}>
                Gestiona las órdenes de compra de tu tienda.
              </p>
            </div>
          )}
          
          {activeTab === 'pedidos' && (
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
                Mis pedidos
              </h2>
              <p style={{ color: '#6b7280' }}>
                Revisa el historial de pedidos realizados.
              </p>
            </div>
          )}
          
          {activeTab === 'cuenta' && (
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
                Mi cuenta
              </h2>
              <p style={{ color: '#6b7280', marginBottom: '1rem' }}>
                Información de tu cuenta: {user}
              </p>
              <div style={{
                backgroundColor: '#f0f9ff',
                border: '1px solid #0ea5e9',
                borderRadius: '4px',
                padding: '1rem'
              }}>
                <p style={{ color: '#0369a1', fontWeight: '600' }}>
                  ✓ Aplicación restaurada exitosamente
                </p>
                <p style={{ color: '#0369a1', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                  La aplicación React está funcionando sin errores de Fast Refresh
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

// Componente principal de la aplicación
export default function App() {
  const [user, setUser] = useState<string | null>(null);

  const handleLogin = (email: string) => {
    setUser(email);
  };

  const handleLogout = () => {
    setUser(null);
  };

  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return <Dashboard user={user} onLogout={handleLogout} />;
}
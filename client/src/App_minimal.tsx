function App() {
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
          Aplicación funcionando correctamente
        </p>
      </div>
    </div>
  );
}

export default App;
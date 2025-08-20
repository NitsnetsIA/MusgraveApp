import { createRoot } from "react-dom/client";

function BasicApp() {
  return (
    <div>
      <h1>Test básico de React</h1>
      <p>Si ves esto, React funciona</p>
    </div>
  );
}

const container = document.getElementById("root");
if (container) {
  const root = createRoot(container);
  root.render(<BasicApp />);
} else {
  console.error("No se encontró el elemento root");
}
export default function App() {
  return (
    <div style={{ padding: 20, background: "#111", color: "white", height: "100vh" }}>
      <h1 style={{ color: "#4ade80" }}>🌱 AgroTech Dashboard</h1>

      <div style={{ display: "flex", gap: 20, marginTop: 20 }}>
        <div style={{ background: "#1f2937", padding: 20, borderRadius: 10 }}>
          <h2>Soil Moisture</h2>
          <p style={{ fontSize: 24 }}>41.2%</p>
        </div>

        <div style={{ background: "#1f2937", padding: 20, borderRadius: 10 }}>
          <h2>Temperature</h2>
          <p style={{ fontSize: 24 }}>24.8°C</p>
        </div>
      </div>
    </div>
  );
}
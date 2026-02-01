/**
 * Simple test page to verify React is working
 */

export default function TestPage() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      background: '#FAFAFA',
      fontFamily: "'IBM Plex Mono', monospace",
    }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '24px', marginBottom: '16px' }}>Henry Travel Admin</h1>
        <p style={{ color: '#666666' }}>If you can see this, React is working!</p>
      </div>
    </div>
  );
}

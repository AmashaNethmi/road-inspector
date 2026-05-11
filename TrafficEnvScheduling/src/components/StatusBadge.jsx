// StatusBadge.jsx
export default function StatusBadge({ status }) {
  const styles = {
    ok:      { background: 'var(--success-bg)',  color: 'var(--success)',  border: '1px solid var(--success-border)', dot: 'var(--success)' },
    error:   { background: 'var(--danger-bg)',   color: 'var(--danger)',   border: '1px solid var(--danger-border)',  dot: 'var(--danger)' },
    loading: { background: 'var(--warning-bg)',  color: 'var(--warning)',  border: '1px solid rgba(245,158,11,0.3)', dot: 'var(--warning)' },
  };
  const s = styles[status] || styles.loading;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '0.5rem',
      padding: '0.4rem 0.875rem', borderRadius: '20px',
      fontSize: '0.8rem', fontWeight: '600', ...s
    }}>
      <span style={{
        width: 7, height: 7, borderRadius: '50%',
        background: s.dot,
        boxShadow: `0 0 6px ${s.dot}`,
        animation: status === 'ok' ? 'pulse 2s infinite' : 'none',
        display: 'inline-block'
      }} />
      {status === 'ok' ? 'AI Backend Online' : status === 'error' ? 'Backend Offline' : 'Connecting...'}
    </div>
  );
}

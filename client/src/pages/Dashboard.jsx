import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const API = '/api';

export default function Dashboard() {
  const [captures, setCaptures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(null);

  useEffect(() => {
    fetch(`${API}/captures`)
      .then((r) => r.json())
      .then((data) => { setCaptures(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const onUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file || !file.name.toLowerCase().endsWith('.pcap')) {
      alert('Please select a .pcap file');
      return;
    }
    setUploading(true);
    const form = new FormData();
    form.append('pcap', file);
    fetch(`${API}/captures/upload`, { method: 'POST', body: form })
      .then((r) => r.json())
      .then((c) => { setCaptures((prev) => [c, ...prev]); setUploading(false); })
      .catch((err) => { alert(err.message); setUploading(false); });
  };

  const runAnalyze = (id) => {
    setAnalyzing(id);
    fetch(`${API}/captures/${id}/analyze`, { method: 'POST' })
      .then((r) => r.json())
      .then(() => {
        setAnalyzing(null);
        setCaptures((prev) => prev.map((c) => (c._id === id ? { ...c, status: 'done' } : c)));
      })
      .catch((err) => { alert(err.message); setAnalyzing(null); });
  };

  const statusBadge = (status) => {
    const colors = { uploaded: '#8b949e', analyzing: '#d29922', done: '#3fb950', error: '#f85149' };
    return (
      <span style={{ ...badge, background: colors[status] || '#8b949e' }}>{status}</span>
    );
  };

  return (
    <div>
      <h1 style={h1}>Captures</h1>
      <div style={card}>
        <label style={uploadLabel}>
          <input type="file" accept=".pcap" onChange={onUpload} disabled={uploading} style={{ display: 'none' }} />
          {uploading ? 'Uploading…' : 'Upload PCAP file'}
        </label>
      </div>
      {loading ? (
        <p style={{ color: 'var(--text-muted)' }}>Loading captures…</p>
      ) : captures.length === 0 ? (
        <p style={{ color: 'var(--text-muted)' }}>No captures yet. Upload a .pcap file to get started.</p>
      ) : (
        <div style={tableWrap}>
          <table style={table}>
            <thead>
              <tr>
                <th style={th}>File</th>
                <th style={th}>Size</th>
                <th style={th}>Status</th>
                <th style={th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {captures.map((c) => (
                <tr key={c._id}>
                  <td style={td}>
                    <Link to={`/capture/${c._id}`} style={{ color: 'var(--accent)' }}>{c.originalName}</Link>
                  </td>
                  <td style={td}>{(c.size / 1024).toFixed(1)} KB</td>
                  <td style={td}>{statusBadge(c.status)}</td>
                  <td style={td}>
                    {c.status === 'uploaded' && (
                      <button
                        onClick={() => runAnalyze(c._id)}
                        disabled={analyzing === c._id}
                        style={btn}
                      >
                        {analyzing === c._id ? 'Analyzing…' : 'Analyze'}
                      </button>
                    )}
                    {c.status === 'done' && (
                      <Link to={`/capture/${c._id}`} style={btnLink}>View report</Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const h1 = { marginBottom: '1.5rem', fontWeight: 600 };
const card = { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '1.5rem', marginBottom: '1.5rem' };
const uploadLabel = { display: 'inline-block', padding: '0.5rem 1rem', background: 'var(--accent)', color: '#fff', borderRadius: 6, cursor: 'pointer', fontWeight: 500 };
const tableWrap = { overflow: 'auto', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8 };
const table = { width: '100%', borderCollapse: 'collapse' };
const th = { textAlign: 'left', padding: '0.75rem 1rem', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', fontWeight: 500 };
const td = { padding: '0.75rem 1rem', borderBottom: '1px solid var(--border)' };
const badge = { padding: '0.2rem 0.5rem', borderRadius: 4, fontSize: '0.8rem', color: '#fff', textTransform: 'capitalize' };
const btn = { padding: '0.4rem 0.8rem', background: 'var(--accent)', border: 'none', borderRadius: 6, color: '#fff', cursor: 'pointer', fontFamily: 'inherit' };
const btnLink = { padding: '0.4rem 0.8rem', background: 'var(--accent)', borderRadius: 6, color: '#fff', fontWeight: 500 };

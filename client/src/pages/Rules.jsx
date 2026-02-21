import { useState, useEffect } from 'react';

const API = '/api';

export default function Rules() {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState('domain');
  const [value, setValue] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    fetch(`${API}/rules`)
      .then((r) => r.json())
      .then((data) => { setRules(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const addRule = (e) => {
    e.preventDefault();
    if (!value.trim()) return;
    fetch(`${API}/rules`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, value: value.trim(), description: description.trim() || undefined }),
    })
      .then((r) => r.json())
      .then((newRule) => { setRules((prev) => [newRule, ...prev]); setValue(''); setDescription(''); })
      .catch((err) => alert(err.message));
  };

  const toggleRule = (r) => {
    fetch(`${API}/rules/${r._id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled: !r.enabled }),
    })
      .then((res) => res.json())
      .then((updated) => setRules((prev) => prev.map((x) => (x._id === updated._id ? updated : x))))
      .catch((err) => alert(err.message));
  };

  const deleteRule = (id) => {
    if (!confirm('Delete this rule?')) return;
    fetch(`${API}/rules/${id}`, { method: 'DELETE' })
      .then(() => setRules((prev) => prev.filter((x) => x._id !== id)))
      .catch((err) => alert(err.message));
  };

  return (
    <div>
      <h1 style={h1}>Blocking rules</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
        Rules apply when analyzing PCAP files. Block by IP, app name, or domain (SNI substring).
      </p>
      <div style={card}>
        <h2 style={h2}>Add rule</h2>
        <form onSubmit={addRule} style={form}>
          <select value={type} onChange={(e) => setType(e.target.value)} style={input}>
            <option value="ip">IP address</option>
            <option value="app">App (e.g. YOUTUBE, FACEBOOK)</option>
            <option value="domain">Domain (substring in SNI)</option>
          </select>
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={type === 'ip' ? '192.168.1.50' : type === 'app' ? 'YOUTUBE' : 'youtube'}
            style={input}
          />
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (optional)"
            style={input}
          />
          <button type="submit" style={btn}>Add</button>
        </form>
      </div>
      <div style={card}>
        <h2 style={h2}>Current rules</h2>
        {loading ? (
          <p style={{ color: 'var(--text-muted)' }}>Loading…</p>
        ) : rules.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>No rules. Add one above.</p>
        ) : (
          <div style={list}>
            {rules.map((r) => (
              <div key={r._id} style={listRow}>
                <span style={{ ...badge, background: r.enabled ? 'var(--success)' : 'var(--text-muted)' }}>{r.type}</span>
                <span className="mono" style={{ flex: 1 }}>{r.value}</span>
                {r.description && <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{r.description}</span>}
                <button onClick={() => toggleRule(r)} style={smallBtn}>{r.enabled ? 'Disable' : 'Enable'}</button>
                <button onClick={() => deleteRule(r._id)} style={{ ...smallBtn, color: 'var(--danger)' }}>Delete</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const h1 = { marginBottom: '0.25rem', fontWeight: 600 };
const h2 = { fontSize: '1rem', marginBottom: '1rem' };
const card = { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '1.5rem', marginBottom: '1.5rem' };
const form = { display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' };
const input = { padding: '0.5rem 0.75rem', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text)', fontFamily: 'inherit', minWidth: 120 };
const btn = { padding: '0.5rem 1rem', background: 'var(--accent)', border: 'none', borderRadius: 6, color: '#fff', cursor: 'pointer', fontFamily: 'inherit' };
const list = {};
const listRow = { display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.6rem 0', borderBottom: '1px solid var(--border)' };
const badge = { padding: '0.2rem 0.5rem', borderRadius: 4, fontSize: '0.75rem', color: '#fff' };
const smallBtn = { padding: '0.3rem 0.6rem', background: 'transparent', border: '1px solid var(--border)', borderRadius: 4, color: 'var(--text)', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.85rem' };

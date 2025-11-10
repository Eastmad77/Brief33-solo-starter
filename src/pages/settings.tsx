import { useState, useEffect } from 'react';
export default function Settings() {
  const [redact, setRedact] = useState(false);
  useEffect(() => setRedact(localStorage.getItem('redact') === '1'), []);
  return (
    <main className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>
      <div className="card space-y-3">
        <label className="flex items-center gap-3">
          <input type="checkbox" checked={redact} onChange={(e)=>{
            setRedact(e.target.checked); localStorage.setItem('redact', e.target.checked ? '1' : '0');
          }}/>
          <span>Redact emails & phone numbers before AI processing</span>
        </label>
        <p className="text-white/60 text-sm">API keys live on the server. No login required.</p>
      </div>
    </main>
  );
}

import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { db } from '../lib/db';
import { Meeting } from '../lib/types';
import { v4 as uuid } from 'uuid';

export default function Home() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  useEffect(() => { db.meetings.orderBy('createdAt').reverse().toArray().then(setMeetings); }, []);

  async function newMeeting() {
    const id = uuid();
    const m: Meeting = { id, createdAt: new Date().toISOString(), title: 'Untitled Meeting' };
    await db.meetings.put(m); location.href = `/m/${id}`;
  }

  return (
    <>
      <Head><title>Brief33</title></Head>
      <main className="max-w-3xl mx-auto p-6 space-y-6">
        <header className="flex items-center justify-between">
          <div className="text-2xl font-bold">
            <span className="inline-flex items-center gap-2">
              <img src="/brief33-logo.svg" alt="Brief33" className="h-6 w-auto" /> Brief33
            </span>
          </div>
          <nav className="space-x-3"><Link className="btn" href="/settings">Settings</Link></nav>
        </header>

        <section className="card">
          <h2 className="text-xl font-semibold mb-3">New Meeting</h2>
          <div className="flex gap-3">
            <button className="btn" onClick={newMeeting}>Start Recording</button>
            <label className="btn cursor-pointer">
              Import Audio
              <input type="file" accept="audio/*" className="hidden" onChange={async (e) => {
                const file = e.target.files?.[0]; if (!file) return;
                const id = uuid();
                const m: Meeting = { id, createdAt: new Date().toISOString(), title: file.name };
                await db.meetings.put(m); location.href = `/m/${id}`;
                const fd = new FormData(); fd.append('file', file);
                try {
                  const res = await fetch('/api/transcribe', { method: 'POST', body: fd });
                  const data = await res.json();
                  const transcript: string = data.transcript || '';
                  await db.meetings.put({ ...m, transcript });
                } catch {}
              }}/>
            </label>
          </div>
        </section>

        <section className="card">
          <h2 className="text-xl font-semibold mb-3">Recent Meetings</h2>
          <ul className="space-y-2">
            {meetings.map(m => (
              <li key={m.id} className="flex items-center justify-between bg-[#112947] rounded-xl p-3">
                <div><div className="font-medium">{m.title}</div>
                <div className="text-sm text-white/60">{new Date(m.createdAt).toLocaleString()}</div></div>
                <Link className="btn" href={`/m/${m.id}`}>Open</Link>
              </li>
            ))}
            {meetings.length === 0 && <div className="text-white/60">No meetings yet.</div>}
          </ul>
        </section>
      </main>
    </>
  );
}

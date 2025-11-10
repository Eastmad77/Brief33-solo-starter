import { useRouter } from 'next/router';
import { useEffect, useRef, useState } from 'react';
import { db } from '../../lib/db';
import { Meeting, MeetingSummary } from '../../lib/types';
import { exportSummaryToPDF } from '../../lib/pdf';

export default function MeetingPage() {
  const router = useRouter();
  const { id } = router.query;
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [recording, setRecording] = useState(false);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunks = useRef<BlobPart[]>([]);
  const [transcribing, setTranscribing] = useState(false);
  const [summarising, setSummarising] = useState(false);

  useEffect(() => {
    if (!id) return;
    db.meetings.get(String(id)).then(async (m) => { if (!m) return; setMeeting(m); });
  }, [id]);

  async function startRec() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mr = new MediaRecorder(stream);
    mediaRef.current = mr; chunks.current = [];
    mr.ondataavailable = e => chunks.current.push(e.data);
    mr.onstop = async () => {
      const blob = new Blob(chunks.current, { type: 'audio/webm' });
      const fd = new FormData(); fd.append('file', blob, 'meeting.webm');
      setTranscribing(true);
      const res = await fetch('/api/transcribe', { method: 'POST', body: fd });
      const data = await res.json();
      const transcript: string = data.transcript || '';
      const updated = { ...meeting!, transcript };
      await db.meetings.put(updated); setMeeting(updated);
      setTranscribing(false);
    };
    mr.start(); setRecording(true);
  }
  function stopRec() { mediaRef.current?.stop(); setRecording(false); }

  async function summarise() {
    if (!meeting?.transcript) return;
    setSummarising(true);
    const redact = localStorage.getItem('redact') === '1';
    const res = await fetch('/api/summarise', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transcript: meeting.transcript, redact })
    });
    const summary: MeetingSummary = await res.json();
    const updated = { ...meeting, summary };
    await db.meetings.put(updated); setMeeting(updated);
    setSummarising(false);
  }

  async function exportMarkdown() {
    if (!meeting?.summary) return;
    const s = meeting.summary;
    const md = `# ${s.title}\n\n**Summary**\n\n${s.summary}\n\n## Agenda\n- ${s.agenda.join('\n- ')}\n\n## Discussion\n${s.discussion.map(d => '- **'+d.topic+'**\n  - '+d.notes.join('\n  - ')).join('\n')}\n\n## Decisions\n- ${s.decisions.join('\n- ')}\n\n## Actions\n${s.actions.map(a => '- [ ] '+a.task+(a.due? ' _(due '+a.due+')_':'')).join('\n')}`;
    const blob = new Blob([md], { type: 'text/markdown' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = (s.title || 'meeting') + '.md'; a.click();
  }

  return (
    <main className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Meeting</h1>
        <div className="flex gap-3">
          {!recording && <button className="btn" onClick={startRec}>Start Recording</button>}
          {recording && <button className="btn" onClick={stopRec}>Stop</button>}
          {meeting?.transcript && <button className="btn" onClick={summarise} disabled={summarising}>Summarise</button>}
          {meeting?.summary && (<>
            <button className="btn" onClick={exportMarkdown}>Export .md</button>
            <button className="btn" onClick={() => exportSummaryToPDF(meeting.summary!)}>Export PDF</button>
          </>)}
        </div>
      </div>

      <section className="card">
        <h2 className="text-xl font-semibold mb-2 text-brief-aqua">Transcript</h2>
        {transcribing ? <div>Transcribing…</div> : <pre className="whitespace-pre-wrap">{meeting?.transcript || 'No transcript yet.'}</pre>}
      </section>

      <section className="card">
        <h2 className="text-xl font-semibold mb-2 text-brief-aqua">Summary</h2>
        {summarising ? <div>Summarising…</div> : meeting?.summary ? (
          <div className="space-y-3">
            <div className="text-lg font-semibold">{meeting.summary.title}</div>
            <p>{meeting.summary.summary}</p>
            <div><div className="font-semibold">Agenda</div>
              <ul className="list-disc list-inside">{meeting.summary.agenda.map((a,i)=><li key={i}>{a}</li>)}</ul></div>
            <div><div className="font-semibold">Discussion</div>
              <ul className="list-disc list-inside">{meeting.summary.discussion.map((d,i)=><li key={i}><b>{d.topic}:</b> {d.notes.join(' • ')}</li>)}</ul></div>
            <div><div className="font-semibold">Decisions</div>
              <ul className="list-disc list-inside">{meeting.summary.decisions.map((d,i)=><li key={i}>{d}</li>)}</ul></div>
            <div><div className="font-semibold">Actions</div>
              <ul className="list-disc list-inside">{meeting.summary.actions.map((a,i)=><li key={i}>{a.task}{a.due?` (due ${a.due})`:''}</li>)}</ul></div>
          </div>
        ) : <div>No summary yet.</div>}
      </section>
    </main>
  );
}

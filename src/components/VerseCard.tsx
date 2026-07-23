import type { Verse } from '../lib/verses';

export default function VerseCard({ verse }: { verse: Verse }) {
  return (
    <div className="verse-card">
      <p className="verse-text">“{verse.text}”</p>
      <p className="verse-ref">{verse.ref}</p>
    </div>
  );
}

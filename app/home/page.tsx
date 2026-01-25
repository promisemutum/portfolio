import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="blank-home">
      <Link href="/cyberfiction" className="cyberfiction-link">
        Cyberfiction
      </Link>
    </main>
  );
}

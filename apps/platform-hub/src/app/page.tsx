import Link from 'next/link';

interface GameCardProps {
  title: string;
  description: string;
  href: string;
  color: string;
}

function GameCard({ title, description, href, color }: GameCardProps) {
  return (
    <Link
      href={href}
      className={`
        block p-8 rounded-2xl border-2 border-border
        hover:border-primary hover:shadow-lg
        transition-all duration-200
        ${color}
      `}
    >
      <h2 className="text-3xl font-bold mb-4">{title}</h2>
      <p className="text-lg text-muted-foreground">{description}</p>
    </Link>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <h1 className="text-5xl font-bold mb-4">Beak Gaming Platform</h1>
      <p className="text-xl text-muted-foreground mb-12 text-center max-w-2xl">
        Fun, accessible games designed for retirement communities.
        Easy to run, fun to play.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl w-full mb-12">
        <GameCard
          title="Beak Bingo"
          description="Classic 75-ball bingo with dual-screen display. Perfect for bingo nights."
          href="http://localhost:3000"
          color="bg-blue-50 dark:bg-blue-950/20"
        />
        <GameCard
          title="Trivia Night"
          description="Team-based trivia with presenter controls. Great for group entertainment."
          href="http://localhost:3001"
          color="bg-green-50 dark:bg-green-950/20"
        />
      </div>

      <div className="flex gap-4">
        <Link
          href="/auth/login"
          className="inline-flex items-center justify-center min-h-[56px] px-8 py-4 text-xl font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Login
        </Link>
        <Link
          href="/auth/register"
          className="inline-flex items-center justify-center min-h-[56px] px-8 py-4 text-xl font-semibold rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/90 transition-colors"
        >
          Create Account
        </Link>
      </div>
    </main>
  );
}

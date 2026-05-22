import Link from 'next/link';

export default function Home() {
  return (
    <>
      <div className="mesh-bg"></div>
      <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center relative z-10">
        <div className="glass-panel glass-panel-hover max-w-lg w-full animate-fade-in-up">
          <div className="mb-10">
            <span className="badge badge-success mb-6 px-4 py-1">Live Prototype</span>
            <h1 className="text-5xl font-bold tracking-tight mb-4">Welcome to TAP</h1>
            <p className="text-lg">
              The intelligent, real-time Tutor & Test Assistant Project.
              Monitor your students&apos; progress instantly or launch a test session.
            </p>
          </div>
          
          <div className="flex flex-col gap-5">
            <Link href="/tutor" className="btn btn-primary w-full text-lg py-4">
              Launch Tutor Dashboard
            </Link>
            <Link href="/student" className="btn btn-outline w-full text-lg py-4">
              Join as Student
            </Link>
          </div>
        </div>
        
        <div className="mt-12 text-sm text-slate-500 font-light tracking-wide animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          Designed with Premium Aesthetics & Glassmorphism
        </div>
      </div>
    </>
  );
}

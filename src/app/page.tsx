import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center">
      <div className="glass-panel max-w-md w-full">
        <div className="mb-8">
          <span className="badge badge-success mb-4">Live Prototype</span>
          <h1>Welcome to TAP</h1>
          <p className="mt-4">
            The intelligent, real-time Tutor & Test Assistant Project.
            Launch a session as a Tutor or join one as a Student.
          </p>
        </div>
        
        <div className="flex flex-col gap-4">
          <Link href="/tutor" className="btn btn-primary w-full">
            Launch Tutor Portal
          </Link>
          <Link href="/student" className="btn btn-outline w-full">
            Join as Student
          </Link>
        </div>
      </div>
    </div>
  );
}

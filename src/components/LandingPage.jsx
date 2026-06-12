import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function LandingPage() {
  const [checked, setChecked] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (localStorage.getItem('user')) {
      navigate('/home', { replace: true });
    } else {
      setChecked(true);
    }
  }, [navigate]);

  if (!checked) return null;

  return (
    <div className="min-h-screen w-full bg-brand-gradient flex flex-col">

      {/* Navbar */}
      <nav className="sticky top-0 z-40 bg-white/10 backdrop-blur-sm border-b border-white/20 px-6 py-4 flex items-center justify-between">
        <span className="text-white text-xl font-bold tracking-tight">CaregiverConnect</span>
        <Link
          to="/login"
          className="bg-white text-[#667eea] font-semibold rounded-lg px-5 py-2.5 text-sm hover:bg-white/90 hover:shadow-md transition-all"
        >
          Login / Sign Up
        </Link>
      </nav>

      {/* Hero */}
      <section className="flex flex-col items-center justify-center text-center px-6 py-24 sm:py-32">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6 max-w-3xl">
          You don't have to do this alone.
        </h1>
        <p className="text-lg sm:text-xl text-white/85 max-w-2xl mb-10 leading-relaxed">
          A warm, private space for single parents and caregivers to share experiences,
          ask questions, find resources, and feel supported by people who truly understand.
        </p>
        <Link
          to="/login"
          className="bg-white text-[#667eea] font-bold rounded-lg px-8 py-4 text-lg hover:-translate-y-0.5 hover:shadow-xl transition-all inline-block"
        >
          Join the Community
        </Link>
      </section>

      {/* Features */}
      <section className="bg-white/10 px-6 py-16 sm:py-20">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-12">
            Everything you need, in one place
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">

            <div className="bg-white rounded-xl shadow-md p-6 sm:p-8 flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-full bg-[#667eea]/10 flex items-center justify-center text-2xl mb-4">
                💬
              </div>
              <h3 className="text-lg font-bold text-[#2d3748] mb-2">Community Discussions</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                Talk with others who get it. Share what's working, ask what's hard,
                and feel heard by people in the same boat.
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 sm:p-8 flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-full bg-[#667eea]/10 flex items-center justify-center text-2xl mb-4">
                📚
              </div>
              <h3 className="text-lg font-bold text-[#2d3748] mb-2">Trusted Resources</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                A curated library of guides, tools, and support links — chosen
                with caregivers in mind, not search engines.
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 sm:p-8 flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-full bg-[#667eea]/10 flex items-center justify-center text-2xl mb-4">
                🤖
              </div>
              <h3 className="text-lg font-bold text-[#2d3748] mb-2">AI Support Chat</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                Not sure where to start? Our friendly AI is available 24/7 to help
                you think through anything, with zero judgment.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="px-6 py-16 sm:py-20 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
          Ready to find your people?
        </h2>
        <p className="text-white/85 mb-8 max-w-xl mx-auto text-lg">
          Joining is free and takes about two minutes. Your community is waiting.
        </p>
        <Link
          to="/signup"
          className="bg-white text-[#667eea] font-bold rounded-lg px-8 py-4 text-lg hover:-translate-y-0.5 hover:shadow-xl transition-all inline-block"
        >
          Create Your Account
        </Link>
        <p className="mt-4 text-white/60 text-sm">
          Already have an account?{' '}
          <Link to="/login" className="text-white underline hover:text-white/80">
            Sign in here.
          </Link>
        </p>
      </section>

      {/* Footer */}
      <footer className="mt-auto text-center py-6 text-white/50 text-sm">
        © 2026 CaregiverConnect. A safe space for caregivers.
      </footer>

    </div>
  );
}

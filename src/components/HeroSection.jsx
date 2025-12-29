import React, { useEffect } from 'react';
import { ChevronRight } from 'lucide-react';
import '../fonts/fonts.css'; // Ensure the font is correctly imported via fonts.css

const HeroSection = () => {
  useEffect(() => {
    // Trigger animations on mount
    const elements = document.querySelectorAll('.animate-on-mount');
    elements.forEach((el, index) => {
      el.style.animationDelay = `${index * 0.2}s`;
    });
  }, []);

  return (
    <div className="relative min-h-[80vh] flex items-center justify-center overflow-hidden">
      {/* Animated background pattern */}
      <div 
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `
            linear-gradient(to right, #0f172a 1px, transparent 1px),
            linear-gradient(to bottom, #0f172a 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
          animation: 'moveGrid 20s linear infinite',
          mask: 'linear-gradient(to bottom, transparent, black 30%, black 70%, transparent)'
        }}
      />
      
      {/* Glowing orb background effects */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-500/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-cyan-500/30 rounded-full blur-3xl animate-pulse" 
          style={{ animationDelay: '1s' }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="animate-on-mount opacity-0 text-5xl md:text-7xl font-bold text-white mb-6"
            style={{
              fontFamily: '"Dune", sans-serif',
              animation: 'fadeInUp 0.8s ease forwards',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              backgroundImage: 'linear-gradient(90deg, #fff, #7dd3fc, #c084fc)',
              color: 'transparent',
            }}>
          Welcome to the Future
        </h1>
        <p className="animate-on-mount opacity-0 text-xl md:text-2xl text-gray-300 mb-8"
           style={{ animation: 'fadeInUp 0.8s ease forwards' }}>
          Experience the next generation of web design
        </p>
        <button className="animate-on-mount opacity-0 inline-flex items-center px-8 py-3 rounded-full bg-transparent border-2 border-cyan-500 text-white group hover:bg-cyan-500/20 transition-all duration-300"
                style={{ animation: 'fadeInUp 0.8s ease forwards' }}>
          <span>Get Started</span>
          <ChevronRight className="ml-2 group-hover:translate-x-1 transition-transform duration-300" />
        </button>
      </div>

      {/* Add the animations */}
      <style jsx>{`
        @keyframes moveGrid {
          0% {
            transform: translate(0, 0);
          }
          100% {
            transform: translate(50px, 50px);
          }
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Additional text effect animations for future use */
        @keyframes glitchText {
          0% {
            text-shadow: none;
          }
          20% {
            text-shadow: 0 0 2px #fff, 2px 2px #0ff, -2px -2px #f0f;
          }
          40% {
            text-shadow: none;
          }
          60% {
            text-shadow: 0 0 2px #fff, -2px 2px #0ff, 2px -2px #f0f;
          }
          80% {
            text-shadow: none;
          }
        }

        @keyframes typewriter {
          from {
            width: 0;
          }
          to {
            width: 100%;
          }
        }

        @keyframes gradientText {
          0% {
            background-position: 0% 50%;
          }
          100% {
            background-position: 100% 50%;
          }
        }

        @keyframes floatingText {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        @keyframes neonPulse {
          0%, 100% {
            text-shadow: 0 0 4px #fff,
                         0 0 11px #fff,
                         0 0 19px #fff,
                         0 0 40px #0ff,
                         0 0 80px #0ff,
                         0 0 90px #0ff,
                         0 0 100px #0ff,
                         0 0 150px #0ff;
          }
          50% {
            text-shadow: 0 0 4px #fff,
                         0 0 8px #fff,
                         0 0 15px #fff,
                         0 0 30px #0ff,
                         0 0 60px #0ff,
                         0 0 70px #0ff,
                         0 0 80px #0ff,
                         0 0 100px #0ff;
          }
        }
      `}</style>
    </div>
  );
};

export default HeroSection;
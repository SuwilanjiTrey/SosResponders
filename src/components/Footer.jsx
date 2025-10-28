import { Github, Twitter, Instagram } from 'lucide-react';


const Footer = () => {
  return (
    <footer className="relative overflow-hidden bg-gray-900">
      {/* Animated border top */}
      <div className="absolute top-0 left-0 right-0 h-[2px]">
        <div 
          className="h-full"
          style={{
            background: 'linear-gradient(90deg, #fff, #7dd3fc, #c084fc, #fff)',
            backgroundSize: '300% 100%',
            animation: 'border-rotate 4s linear infinite'
          }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-cyan-400">
              IKARIS
            </h3>
            <p className="text-gray-400">
              Building the future of web experiences
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="text-white font-semibold">Quick Links</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-400 hover:text-cyan-400 transition-colors">About Us</a></li>
              <li><a href="#" className="text-gray-400 hover:text-cyan-400 transition-colors">Services</a></li>
              <li><a href="#" className="text-gray-400 hover:text-cyan-400 transition-colors">Contact</a></li>
            </ul>
          </div>

          {/* Social Links */}
          <div className="space-y-4">
            <h4 className="text-white font-semibold">Connect</h4>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-cyan-400 transition-colors">
                <Github size={24} />
              </a>
              <a href="#" className="text-gray-400 hover:text-cyan-400 transition-colors">
                <Twitter size={24} />
              </a>
              <a href="#" className="text-gray-400 hover:text-cyan-400 transition-colors">
                <Instagram size={24} />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © 2025 IKARIS. All rights reserved.
            </p>
            <div className="flex space-x-4 mt-4 md:mt-0">
              <a href="#" className="text-gray-400 hover:text-cyan-400 transition-colors text-sm">
                Privacy Policy
              </a>
              <a href="#" className="text-gray-400 hover:text-cyan-400 transition-colors text-sm">
                Terms of Service
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
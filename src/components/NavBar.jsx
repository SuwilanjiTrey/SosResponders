import { useState } from "react";
import { Menu, X } from "lucide-react";
import styles from "../styles/NavBar.module.css"; // Ensure you have the CSS file

function NavBar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="p-4">
      <nav className="relative overflow-hidden bg-gray-900 rounded-full shadow-lg">
        {/* Animated Gradient Border */}
        <div className="absolute inset-0 w-full h-full rounded-full z-0">
          <div className={`absolute inset-[-2px] w-full h-full rounded-full ${styles.navbarBorder}`} />
          {/* Dark Overlay to Make the Glow More Subtle */}
          <div className="absolute inset-[1px] rounded-full bg-gray-900" />
        </div>

        {/* Navbar Content */}
        <div className="relative max-w-7xl mx-1 my-1 px-6 sm:px-8 lg:px-12 h-16 flex items-center justify-between z-10 bg-gray-900 rounded-full">
          {/* Logo */}
          <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-cyan-400">
            IKARIS
          </span>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <a href="#" className="text-gray-300 hover:text-purple-400 transition-colors duration-300">
              Home
            </a>
            <a href="#" className="text-gray-300 hover:text-purple-400 transition-colors duration-300">
              Features
            </a>
            <a href="#" className="text-gray-300 hover:text-purple-400 transition-colors duration-300">
              About
            </a>
            {/* Glowing Button */}
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-lg blur opacity-60 group-hover:opacity-100 transition duration-300" />
              <button className="relative px-6 py-2 bg-gray-900 rounded-lg text-gray-100 group-hover:text-white">
                Get Started
              </button>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-300 hover:text-purple-400 transition-colors duration-300"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="relative md:hidden bg-gray-900 rounded-lg shadow-lg mt-2">
            <div className="px-4 py-3 space-y-2">
              <a href="#" className="block text-gray-300 hover:text-purple-400 transition-colors duration-300">
                Home
              </a>
              <a href="#" className="block text-gray-300 hover:text-purple-400 transition-colors duration-300">
                Features
              </a>
              <a href="#" className="block text-gray-300 hover:text-purple-400 transition-colors duration-300">
                About
              </a>
              {/* Glowing Button */}
              <div className="relative group mt-2">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-lg blur opacity-60 group-hover:opacity-100 transition duration-300" />
                <button className="relative w-full px-3 py-2 bg-gray-900 rounded-lg text-gray-100 group-hover:text-white">
                  Get Started
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>
    </div>
  );
}

export default NavBar;
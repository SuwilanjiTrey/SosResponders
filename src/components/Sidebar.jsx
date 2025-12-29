// components/Sidebar.jsx
import React from 'react';
import { AlertCircle, User, LogOut, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../config/firebase';

const Sidebar = ({ activeView, setActiveView, responderData, isCollapsed, setIsCollapsed }) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div
      className={`h-screen bg-white shadow-lg flex flex-col transition-all duration-300 ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Logo / Title */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : ''}`}>
          {!isCollapsed && (
            <div>
              <h1 className="text-lg font-bold text-gray-900">SafeCircle</h1>
              <p className="text-xs text-gray-500">Responder Portal</p>
            </div>
          )}
        </div>

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 bg-blue-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          <li>
            <button
              onClick={() => setActiveView('dashboard')}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
                activeView === 'dashboard'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              {!isCollapsed && <span className="font-medium">Emergencies</span>}
            </button>
          </li>
          <li>
            <button
              onClick={() => setActiveView('settings')}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
                activeView === 'settings'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <User className="w-5 h-5 flex-shrink-0" />
              {!isCollapsed && <span className="font-medium">Settings</span>}
            </button>
          </li>
        </ul>
      </nav>

	{/* User Info & Logout */}
	<div className="p-4 border-t border-gray-200">
	  <div className={`flex items-center gap-3 mb-4 ${isCollapsed ? 'justify-center' : ''}`}>
		{/* Logo or Initial */}
		<div className="relative w-12 h-12 rounded-full overflow-hidden bg-gray-100 border-2 border-gray-300 flex-shrink-0">
		  {responderData?.logoBase64 ? (
		    <img
		      src={responderData.logoBase64}
		      alt="Institution logo"
		      className="w-full h-full object-cover"
		    />
		  ) : (
		    <div className="w-full h-full bg-blue-600 flex items-center justify-center text-white font-bold text-xl">
		      {responderData?.institutionName?.[0]?.toUpperCase() || 'R'}
		    </div>
		  )}
		</div>

		{!isCollapsed && (
		  <div className="flex-1 min-w-0">
		    <p className="font-medium text-gray-900 truncate">
		      {responderData?.institutionName || 'Responder'}
		    </p>
		    <p className="text-xs text-gray-500">On Duty</p>
		  </div>
		)}
	  </div>

	  <button
		onClick={handleLogout}
		className={`w-full flex items-center justify-center gap-2 px-3 py-3 rounded-lg transition-colors text-gray-700 font-medium hover:bg-gray-100 ${
		  isCollapsed ? '' : 'border border-gray-200'
		}`}
	  >
		<LogOut className="w-5 h-5 flex-shrink-0" />
		{!isCollapsed && <span>Logout</span>}
	  </button>
	</div>

    </div>
  );
};

export default Sidebar;

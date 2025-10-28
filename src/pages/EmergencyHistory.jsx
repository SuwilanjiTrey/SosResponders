// src/pages/EmergencyHistory.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './EmergencyHistory.css';

const EmergencyHistory = ({ emergencies }) => {
  const [filter, setFilter] = useState('all'); // all, active, resolved
  const [sortBy, setSortBy] = useState('newest'); // newest, oldest, priority

  // Filter emergencies based on selected filter
  const filteredEmergencies = emergencies.filter(emergency => {
    if (filter === 'active') return emergency.status === 'active';
    if (filter === 'resolved') return emergency.status === 'resolved';
    return true; // 'all'
  });

  // Sort emergencies based on selected sort
  const sortedEmergencies = [...filteredEmergencies].sort((a, b) => {
    if (sortBy === 'priority') {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    } else if (sortBy === 'oldest') {
      return new Date(a.reportedAt) - new Date(b.reportedAt);
    }
    // newest (default)
    return new Date(b.reportedAt) - new Date(a.reportedAt);
  });

  // Group emergencies by date
  const groupedByDate = sortedEmergencies.reduce((groups, emergency) => {
    const date = new Date(emergency.reportedAt).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(emergency);
    return groups;
  }, {});

  return (
    <div className="emergency-history">
      <header className="history-header">
        <Link to="/" className="back-button">
          ← Back to Dashboard
        </Link>
        <h1>Emergency History</h1>
      </header>

      <div className="history-controls">
        <div className="filter-controls">
          <h3>Filter:</h3>
          <div className="filter-buttons">
            <button 
              className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All
            </button>
            <button 
              className={`filter-btn ${filter === 'active' ? 'active' : ''}`}
              onClick={() => setFilter('active')}
            >
              Active
            </button>
            <button 
              className={`filter-btn ${filter === 'resolved' ? 'active' : ''}`}
              onClick={() => setFilter('resolved')}
            >
              Resolved
            </button>
          </div>
        </div>

        <div className="sort-controls">
          <h3>Sort By:</h3>
          <div className="sort-buttons">
            <button 
              className={`sort-btn ${sortBy === 'newest' ? 'active' : ''}`}
              onClick={() => setSortBy('newest')}
            >
              Newest
            </button>
            <button 
              className={`sort-btn ${sortBy === 'oldest' ? 'active' : ''}`}
              onClick={() => setSortBy('oldest')}
            >
              Oldest
            </button>
            <button 
              className={`sort-btn ${sortBy === 'priority' ? 'active' : ''}`}
              onClick={() => setSortBy('priority')}
            >
              Priority
            </button>
          </div>
        </div>
      </div>

      <div className="history-list">
        {Object.entries(groupedByDate).map(([date, dayEmergencies]) => (
          <div key={date} className="history-day">
            <h2 className="date-header">{date}</h2>
            <div className="day-emergencies">
              {dayEmergencies.map(emergency => (
                <Link 
                  to={`/emergency/${emergency.id}`} 
                  key={emergency.id}
                  className="history-item"
                >
                  <div className={`history-status ${emergency.status}`}>
                    {emergency.status === 'active' ? '🔴 Active' : '🟢 Resolved'}
                  </div>
                  <div className="history-info">
                    <h3>{emergency.title}</h3>
                    <p>{emergency.description}</p>
                    <div className="history-meta">
                      <span className={`priority ${emergency.priority}`}>{emergency.priority}</span>
                      <span className="category">{emergency.category}</span>
                      <span className="time">
                        {new Date(emergency.reportedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {emergency.status === 'resolved' && (
                        <span className="resolution-time">
                          Resolved in {Math.round((new Date(emergency.resolvedAt) - new Date(emergency.reportedAt)) / (1000 * 60))} min
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EmergencyHistory;

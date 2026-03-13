import React from 'react';
import './Loading.css';

const Loading = ({ type = 'spinner', message = 'Loading...' }) => {
  if (type === 'skeleton') {
    return (
      <div className="skeleton-card">
        <div className="skeleton skeleton-text" style={{ width: '80%' }} />
        <div className="skeleton skeleton-text" style={{ width: '90%' }} />
        <div className="skeleton skeleton-text" style={{ width: '70%' }} />
      </div>
    );
  }

  return (
    <div className="loading">
      <div className={`spinner ${type === 'small' ? 'small' : ''}`} />
      {message && <div className="loading-message">{message}</div>}
    </div>
  );
};

export default Loading;

import React from 'react';
import './Card.css';

const Card = ({ children, className = '' }) => {
  return <div className={`card ${className}`}>{children}</div>;
};

Card.Header = ({ children }) => <div className="card-header">{children}</div>;
Card.Body = ({ children }) => <div className="card-body">{children}</div>;
Card.Footer = ({ children }) => <div className="card-footer">{children}</div>;

export default Card;

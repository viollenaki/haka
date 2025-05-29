import React from 'react';
import { Link } from 'react-router-dom';
import './Header.css'

const Header = () => {
  return (
    <header className="app-header">
      <div className="header-content">
        <h1 className="logo">
          PopMap Recommender
        </h1>
        <nav className="nav-links">
          <Link to="/" className="nav-link">Карта</Link>
          <Link to="/population" className="nav-link">Население</Link>
          <Link to="/hexmap" className="nav-link">Гексагоны</Link>
          <Link to="/about" className="nav-link">О проекте</Link>
        </nav>
      </div>
    </header>
  );
};

export default Header;

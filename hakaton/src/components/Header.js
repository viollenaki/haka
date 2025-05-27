import React from 'react';
import { Link } from 'react-router-dom';

const Header = () => {
  return (
    <header className="header">
      <h1>InfraMap Recommender</h1>
      <nav>
        <Link to="/" style={{ color: 'white', marginRight: '15px' }}>Главная</Link>
        <Link to="/about" style={{ color: 'white' }}>О проекте</Link>
      </nav>
    </header>
  );
};

export default Header;

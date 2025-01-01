import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaBars, FaTimes } from 'react-icons/fa';
import './Navbar.css'; // Import your styles
import logo from '../assets/logo.png';
import camt from '../assets/camt.png';

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Logo Section */}
        <div className="navbar-logo">
          <h1>
            <span className="styled-heading">M</span>ake your
            <span className="styled-heading"> D</span>ata more
            <span className="styled-heading"> P</span>rivacy
          </h1>
          <h4>by K-Anonymity and get Degree of infomation loss</h4>
          
          <img src={logo} alt="Logo" className="logo-image" width={100} />
          <img src={camt} alt="Logo" className="logo-image" width={100} />
        </div>

        <div className="hamburger-icon" onClick={toggleMenu}>
          {isOpen ? <FaTimes /> : <FaBars />}
        </div>
        <ul className={`nav-links ${isOpen ? 'open' : ''}`}>
          <li>
            <Link to="/" onClick={() => setIsOpen(false)}>Home</Link>
          </li>

          <li>
            <Link to="/ExcelToCSVDownloader" onClick={() => setIsOpen(false)}>Excel to CSV file</Link>
          </li>

          <li>
            <Link to="/CSVLoader" onClick={() => setIsOpen(false)}>Make CSV data privacy</Link>
          </li>

        </ul>
      </div>
    </nav>
  );
};

export default Navbar;

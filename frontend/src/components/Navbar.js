import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/Navbar.css";
import logo from "../assets/images/logo.jpg";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUserCircle, faList, faHeart, faBars, faTimes } from "@fortawesome/free-solid-svg-icons";
import NotificationBell from './NotificationBell.js';

const Navbar = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <nav className="nc-navbar">
      <div className="nc-nav-logo">
        <img src={logo} alt="NC Logo" />
      </div>

      <button className="mobile-menu-btn" onClick={toggleMobileMenu}>
        <FontAwesomeIcon icon={isMobileMenuOpen ? faTimes : faBars} />
      </button>

      <div className={`nc-nav-content ${isMobileMenuOpen ? 'active' : ''}`}>
        <ul className="nc-nav-links">
          <li><Link to="/" onClick={() => setIsMobileMenuOpen(false)}>Home</Link></li>
          <li><Link to="/property-listing" onClick={() => setIsMobileMenuOpen(false)}>Browse Room</Link></li>
          <li><Link to="/add-property" onClick={() => setIsMobileMenuOpen(false)}>Post a Room</Link></li>
          <li><Link to="/about" onClick={() => setIsMobileMenuOpen(false)}>About Us</Link></li>
          <li><Link to="/contact" onClick={() => setIsMobileMenuOpen(false)}>Contact</Link></li>
        </ul>

        {!token ? (
          <div className="nc-auth-buttons">
            <Link to="/login" className="nc-login-btn" onClick={() => setIsMobileMenuOpen(false)}>Login</Link>
            <Link to="/signup" className="nc-signup-btn" onClick={() => setIsMobileMenuOpen(false)}>Sign Up</Link>
          </div>
        ) : (
          <div className="nc-user-tools">
            <Link to="/favorites" className="nc-icon-button" title="Favorites" onClick={() => setIsMobileMenuOpen(false)}>
              <FontAwesomeIcon icon={faHeart} />
            </Link>
            <NotificationBell/>
            <Link to="/my-listings" className="nc-icon-button" title="My Listings" onClick={() => setIsMobileMenuOpen(false)}>
              <FontAwesomeIcon icon={faList} />
            </Link>
            <Link to="/profile" className="nc-icon-button" title="Profile" onClick={() => setIsMobileMenuOpen(false)}>
              <FontAwesomeIcon icon={faUserCircle} />
            </Link>
            <button onClick={handleLogout} className="nc-logout-btn">Logout</button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
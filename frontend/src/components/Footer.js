import React from "react";
import "../styles/Footer.css";
import { FaFacebookF, FaTwitter, FaLinkedinIn, FaInstagram, FaYoutube, FaGoogle } from "react-icons/fa";
import { FiPhone, FiMapPin } from "react-icons/fi";
import { BsPrinter } from "react-icons/bs";
import logo from "../assets/images/logo.jpg";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-logo">
        <img src={logo} alt="Kotha Chaiyo Logo" />
        </div>

        <div className="footer-contact">
          <p><FiMapPin /> Lagan Tole, Kathmandu, Nepal</p>
          <p><FiPhone /> 9818681200</p>
          <p><BsPrinter /> 01-426869</p>
          <div className="social-media">
            <span>Social Media</span>
            <a href="https://www.facebook.com/" target="_blank" ><FaFacebookF /></a>
            <a href="https://www.skype.com/en/" target="_blank" ><FaTwitter /></a>
            <a href="https://np.linkedin.com/" target="_blank" ><FaLinkedinIn /></a>
            <a href="https://www.instagram.com/#" target="_blank" ><FaInstagram /></a>
            <a href="https://www.youtube.com/" target="_blank"><FaYoutube /></a>
            <a href="https://www.google.com/" target="_blank" ><FaGoogle /></a>
          </div>
        </div>

        <ul className="footer-links">
          <li><Link to="/about">ABOUT US</Link></li>
          <li><Link to="/contact">CONTACT US</Link></li>
          <li><Link to="/help">HELP</Link></li>
          <li><Link to="/privacy-policy">PRIVACY POLICY</Link></li>
        </ul>

        <p className="footer-copyright">
          © 2025 Kotha Chaiyo. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;

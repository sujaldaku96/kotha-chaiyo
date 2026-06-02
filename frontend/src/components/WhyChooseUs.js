import React from "react";
import "../styles/WhyChooseUs.css";
import { FaDollarSign, FaShieldAlt, FaLayerGroup, FaLeaf, FaBuilding, FaClock } from "react-icons/fa";
import Why from "../assets/images/Why.jpg"; 

const WhyChooseUs = () => {
  return (
    <section className="why-choose">
      <h2>Why Choose Kotha Chaiyo?</h2>
      <div className="why-choose-container">
        <img src={Why} alt="Why Choose Kotha Chaiyo" className="why-image" />
        <div className="benefits">
          <div className="benefit-card">
            <FaDollarSign className="icon" />
            <p>No Broker Fees!</p>
          </div>
          <div className="benefit-card">
            <FaShieldAlt className="icon" />
            <p>Verified Landlords!</p>
          </div>
          <div className="benefit-card">
            <FaLayerGroup className="icon" />
            <p>Secure Payments!</p>
          </div>
          <div className="benefit-card">
            <FaLeaf className="icon" />
            <p>Enjoy Peaceful Environment!</p>
          </div>
          <div className="benefit-card">
            <FaBuilding className="icon" />
            <p>Trusted Properties!</p>
          </div>
          <div className="benefit-card">
            <FaClock className="icon" />
            <p>Pay For What You Use!</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUs;

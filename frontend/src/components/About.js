import React from "react";
import "../styles/About.css";
import { Link } from "react-router-dom";
import Aboutus from "../assets/images/Aboutus.jpg"; 


const About = () => {
  return (
    <section className="about">
      <h2>About Us</h2>
      <div className="about-content">
        <img src={Aboutus} alt="About Us" />

        <p>
        Kotha Chaiyo was created to solve a simple problem: finding rental 
                spaces in Nepal was too difficult. As someone who struggled to find 
                good rental options, I built this platform to make the process easier, 
                faster, and more transparent for everyone.
        </p>
      </div>
      <Link to="/about" className="btn">Learn More</Link>
    </section>
  );
};

export default About;

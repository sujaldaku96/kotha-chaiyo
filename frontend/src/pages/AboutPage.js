import React from "react";
import Layout from "../components/layout.js";
import AboutImage from "../assets/images/Aboutus.jpg";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faHandshake, 
  faHome, 
  faShieldAlt, 
  faChartLine,
  faUsers,
  faHeart,
  faLightbulb,
  faBalanceScale
} from "@fortawesome/free-solid-svg-icons";
import "../styles/AboutPage.css";

const AboutPage = () => {
  const stats = [
    { number: "1000+", label: "Happy Users" },
    { number: "500+", label: "Properties Listed" },
    { number: "100+", label: "Cities Covered" },
    { number: "24/7", label: "Support" }
  ];

  const team = [
    {
      role: "Property Experts",
      description: "Our team of property experts ensures every listing meets our quality standards."
    },
    {
      role: "Customer Support",
      description: "Dedicated support team available to help you with any queries."
    },
    {
      role: "Tech Team",
      description: "Innovative developers keeping our platform cutting-edge and user-friendly."
    }
  ];

  return (
    <Layout>
      <div className="kc-about-wrapper">
        <div className="kc-about-hero">
          <div className="hero-content">
            <h1>About Kotha Chaiyo</h1>
            <p>Transforming the way people find their perfect home in Nepal</p>
          </div>
        </div>

        <div className="kc-about-section">
          <div className="kc-about-inner">
            <div className="section-header">
              <h2>Our Story</h2>
              <div className="underline"></div>
            </div>
            <div className="story-content">
              <div className="story-text">
                <p>
                  Kotha Chaiyo was born from a simple yet powerful vision: to revolutionize
                  the rental experience in Nepal. What started as a solution to our own
                  rental challenges has grown into a platform that helps hundreds of people
                  find their perfect space every month.
                </p>
                <p>
                  We understand the unique challenges of Nepal's rental market and have
                  built our platform to address these specific needs, making the process
                  simpler, more transparent, and more efficient for everyone involved.
                </p>
              </div>
              <div className="story-image">
                <img src={AboutImage} alt="Kotha Chaiyo Team" />
              </div>
            </div>
          </div>
        </div>

        <div className="kc-stats-section">
          <div className="stats-grid">
            {stats.map((stat, index) => (
              <div key={index} className="stat-box">
                <h3>{stat.number}</h3>
                <p>{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="kc-about-section kc-light-background">
          <div className="kc-about-inner">
            <div className="section-header">
              <h2>Our Mission</h2>
              <div className="underline"></div>
            </div>
            <div className="mission-content">
              <p className="mission-statement">
                To create a transparent, efficient, and trustworthy rental ecosystem
                that benefits both property owners and tenants in Nepal.
              </p>
              <div className="mission-points">
                <div className="mission-point">
                  <FontAwesomeIcon icon={faHandshake} />
                  <p>Easy-to-use platform</p>
                </div>
                <div className="mission-point">
                  <FontAwesomeIcon icon={faShieldAlt} />
                  <p>Verified listings</p>
                </div>
                <div className="mission-point">
                  <FontAwesomeIcon icon={faHome} />
                  <p>All budgets covered</p>
                </div>
                <div className="mission-point">
                  <FontAwesomeIcon icon={faChartLine} />
                  <p>Growing network</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="kc-about-section">
          <div className="kc-about-inner">
            <div className="section-header">
              <h2>Our Values</h2>
              <div className="underline"></div>
            </div>
            <div className="values-grid">
              <div className="value-box">
                <FontAwesomeIcon icon={faUsers} />
                <h3>User First</h3>
                <p>Every decision we make starts with our users' needs</p>
              </div>
              <div className="value-box">
                <FontAwesomeIcon icon={faBalanceScale} />
                <h3>Transparency</h3>
                <p>Clear, honest, and open in all our dealings</p>
              </div>
              <div className="value-box">
                <FontAwesomeIcon icon={faHeart} />
                <h3>Quality</h3>
                <p>Maintaining high standards in everything we do</p>
              </div>
              <div className="value-box">
                <FontAwesomeIcon icon={faLightbulb} />
                <h3>Innovation</h3>
                <p>Constantly improving and evolving our services</p>
              </div>
            </div>
          </div>
        </div>

        <div className="kc-about-section kc-light-background">
          <div className="kc-about-inner">
            <div className="section-header">
              <h2>Our Team</h2>
              <div className="underline"></div>
            </div>
            <div className="team-grid">
              {team.map((member, index) => (
                <div key={index} className="team-box">
                  <h3>{member.role}</h3>
                  <p>{member.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AboutPage;

import React from 'react';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import FeaturedListings from '../components/FeaturedListings';
import WhyChooseUs from '../components/WhyChooseUs';
import About from '../components/About';
import Footer from '../components/Footer';
import "../styles/LandingPage.css";

const HomePage = () => {
  return (
    <div>
      <Navbar />
      <Hero />
      <FeaturedListings />
      <WhyChooseUs />
      <About />
      <Footer />
    </div>
  );
};

export default HomePage;

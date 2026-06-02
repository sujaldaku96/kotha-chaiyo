import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Hero.css";
import heroImage from "../assets/images/Hero.jpg";
import axios from "axios";

const Hero = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchTerm.trim().length > 0) {
        fetchProperties(searchTerm);
      } else {
        setSearchResults([]);
        setShowResults(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const fetchProperties = async (query) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.get(`http://localhost:5000/api/properties?search=${query}`);
      setSearchResults(response.data);
      setShowResults(true);
    } catch (err) {
      console.error("Error fetching properties:", err);
      setError("Failed to fetch properties. Please try again.");
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleResultClick = (property) => {
    setSearchTerm(property.title);
    setShowResults(false);
    navigate(`/property-details/${property._id}`);
  };

  const renderPropertyDetails = (property) => {
    return (
      <div className="search-result-item" key={property._id} onClick={() => handleResultClick(property)}>
        <div className="search-result-content">
          <img 
            src={`http://localhost:5000/uploads/${property.images[0]}`}
            alt={property.title}
            className="search-result-image"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "https://via.placeholder.com/80x80?text=No+Image";
            }}
          />
          <div className="search-result-details">
            <h4>{property.title}</h4>
            <p>{property.location.address}, {property.location.city} • Rs {property.price.toLocaleString()}</p>
            <div className="property-type">{property.propertyType}</div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <header className="hero" style={{ backgroundImage: `url(${heroImage})` }}>
      <div className="hero-overlay">
        <h1 className="heroh1">Find Your Perfect Room Today!</h1>
        <p className="herop">
          Easily discover, compare, and rent the best rooms in your area with Kotha Chaiyo.
        </p>
        
        <div className="search-container">
          <input
            type="text"
            placeholder="🔍 Search by location, city, or property type..."
            className="search-bar"
            value={searchTerm}
            onChange={handleSearchChange}
            onFocus={() => searchTerm && setShowResults(true)}
          />
          
          {showResults && (
            <div className="search-results">
              {isLoading ? (
                <div className="search-loading">Loading...</div>
              ) : error ? (
                <div className="search-error">{error}</div>
              ) : searchResults.length > 0 ? (
                searchResults.map(property => renderPropertyDetails(property))
              ) : (
                <div className="no-results">No properties found matching your search</div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Hero;
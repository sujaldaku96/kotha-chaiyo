import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/FeaturedListings.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHeart } from "@fortawesome/free-solid-svg-icons";

const FeaturedListings = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentImageIndices, setCurrentImageIndices] = useState({});
  const navigate = useNavigate();
  const featuredLimit = 6;

  useEffect(() => {
    const fetchFeaturedProperties = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/properties?limit=${featuredLimit}`);
        
        const limitedProperties = response.data.slice(0, featuredLimit);
        setProperties(limitedProperties);
        
        // Initialize image indices
        const indices = {};
        limitedProperties.forEach(property => {
          indices[property._id] = 0;
        });
        setCurrentImageIndices(indices);
        
        setLoading(false);
      } catch (err) {
        console.error("Error fetching featured properties", err);
        setError("Failed to load featured properties");
        setLoading(false);
      }
    };

    fetchFeaturedProperties();
  }, [featuredLimit]);

  const handleNextImage = (propertyId, e) => {
    e.stopPropagation();
    setCurrentImageIndices(prev => {
      const property = properties.find(p => p._id === propertyId);
      const maxIndex = property.images.length - 1;
      return {
        ...prev,
        [propertyId]: prev[propertyId] < maxIndex ? prev[propertyId] + 1 : 0
      };
    });
  };

  const handlePrevImage = (propertyId, e) => {
    e.stopPropagation();
    setCurrentImageIndices(prev => {
      const property = properties.find(p => p._id === propertyId);
      const maxIndex = property.images.length - 1;
      return {
        ...prev,
        [propertyId]: prev[propertyId] > 0 ? prev[propertyId] - 1 : maxIndex
      };
    });
  };

  const handleViewAll = () => {
    navigate("/property-listing");
  };

  if (loading) {
    return (
      <section className="fl-featured-listings">
        <div className="fl-featured-header">
          <h2>Featured Listings</h2>
          <button className="fl-view-all-btn" onClick={handleViewAll}>View All</button>
        </div>
        <div className="fl-loading">Loading properties...</div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="fl-featured-listings">
        <div className="fl-featured-header">
          <h2>Featured Listings</h2>
          <button className="fl-view-all-btn" onClick={handleViewAll}>View All</button>
        </div>
        <div className="fl-error">{error}</div>
      </section>
    );
  }

  if (properties.length === 0) {
    return (
      <section className="fl-featured-listings">
        <div className="fl-featured-header">
          <h2>Featured Listings</h2>
          <button className="fl-view-all-btn" onClick={handleViewAll}>View All</button>
        </div>
        <div className="fl-no-properties">No featured properties available</div>
      </section>
    );
  }

  return (
     <section className="fl-featured-listings">
      <div className="fl-featured-header">
        <h2>List of Rentals</h2>
        <button className="fl-view-all-btn" onClick={handleViewAll}>View All</button>
      </div>
      <div className="fl-featured-grid">
        {properties.map((property) => (
          <PropertyCard 
            key={property._id}
            property={property}
            currentIndex={currentImageIndices[property._id] || 0}
            onNext={handleNextImage}
            onPrev={handlePrevImage}
          />
        ))}
      </div>
    </section>
  );
};

const PropertyCard = ({ property, currentIndex, onNext, onPrev }) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const token = localStorage.getItem("token");

  useEffect(() => {
    const checkFavoriteStatus = async () => {
      if (!token) return;
      
      try {
        const response = await axios.get(`http://localhost:5000/api/favorites/check/${property._id}`, {
          headers: {
            "x-auth-token": token
          }
        });
        setIsFavorite(response.data.isFavorite);
      } catch (err) {
        console.error("Error checking favorite status:", err);
      }
    };

    checkFavoriteStatus();
  }, [property._id, token]);

  const toggleFavorite = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!token) {
      return;
    }

    try {
      if (isFavorite) {
        await axios.delete(`http://localhost:5000/api/favorites/${property._id}`, {
          headers: {
            "x-auth-token": token
          }
        });
      } else {
        await axios.post(`http://localhost:5000/api/favorites`, 
          { propertyId: property._id },
          {
            headers: {
              "x-auth-token": token
            }
          }
        );
      }
      setIsFavorite(!isFavorite);
    } catch (err) {
      console.error("Error toggling favorite:", err);
    }
  };

  return (
    <div className="fl-property-card">
      <div className="fl-image-gallery">
        <div className={`fl-status-badge ${property.bookingStatus === 'booked' ? 'booked' : 'available'}`}>
          {property.bookingStatus === 'booked' ? 'Booked' : 'Available'}
        </div>
        {property.images.length > 0 ? (
          <>
            <Link to={`/property-details/${property._id}`} className="fl-image-link">
              <img
                src={`http://localhost:5000/uploads/${property.images[currentIndex]}`}
                alt={property.title}
                className="fl-property-image"
              />
            </Link>
            <div className="fl-gallery-controls">
              <button 
                className="fl-nav-btn fl-prev" 
                onClick={(e) => onPrev(property._id, e)}
              >
                &lt;
              </button>
              <div className="fl-image-counter">
                {currentIndex + 1}/{property.images.length}
              </div>
              <button 
                className="fl-nav-btn fl-next" 
                onClick={(e) => onNext(property._id, e)}
              >
                &gt;
              </button>
            </div>
          </>
        ) : (
          <Link to={`/property-details/${property._id}`} className="fl-no-image">
            No Image Available
          </Link>
        )}
        <button 
          className={`fl-favorite-btn ${isFavorite ? "active" : ""}`}
          onClick={toggleFavorite}
        >
          <FontAwesomeIcon icon={faHeart} />
        </button>
      </div>
      
      <Link to={`/property-details/${property._id}`} className="fl-property-info">
        <h3>{property.title}</h3>
        <div className="fl-price">Rs {property.price.toLocaleString()}</div>
        <div className="fl-location">
          <span className="fl-city">{property.location.city}</span>, {property.location.address}
        </div>
        {property.propertyType === "Residential" && (
          <div className="fl-details">
            <span>{property.rooms.bedrooms} Beds</span>
            <span>{property.rooms.bathrooms} Baths</span>
            <span>{property.rooms.kitchen} Kitchen</span>
            <span>{property.rooms.livingRoom} Living Room</span>
          </div>
        )}
      </Link>
    </div>
  );
};

export default FeaturedListings;
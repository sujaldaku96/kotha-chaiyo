import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import Layout from "../components/layout.js";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHeart, faTimes } from "@fortawesome/free-solid-svg-icons";
import "../styles/Favorites.css"; 

const Favorites = () => {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentImageIndices, setCurrentImageIndices] = useState({});

  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setError("Please login to view favorites");
          setLoading(false);
          return;
        }

        const response = await axios.get("http://localhost:5000/api/favorites", {
          headers: {
            "x-auth-token": token
          }
        });
        
        // Initialize image indices
        const indices = {};
        response.data.forEach(property => {
          indices[property._id] = 0;
        });
        setCurrentImageIndices(indices);
        
        setFavorites(response.data);
        setLoading(false);
      } catch (err) {
        setError("Error fetching favorites");
        setLoading(false);
      }
    };

    fetchFavorites();
  }, []);

  const handleNextImage = (propertyId, e) => {
    e.stopPropagation();
    setCurrentImageIndices(prev => ({
      ...prev,
      [propertyId]: (prev[propertyId] + 1) % favorites.find(p => p._id === propertyId).images.length
    }));
  };

  const handlePrevImage = (propertyId, e) => {
    e.stopPropagation();
    setCurrentImageIndices(prev => {
      const property = favorites.find(p => p._id === propertyId);
      return {
        ...prev,
        [propertyId]: (prev[propertyId] - 1 + property.images.length) % property.images.length
      };
    });
  };

  const removeFromFavorites = async (propertyId, e) => {
    e.stopPropagation();
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`http://localhost:5000/api/favorites/${propertyId}`, {
        headers: {
          "x-auth-token": token
        }
      });
      
      setFavorites(favorites.filter(fav => fav._id !== propertyId));
    } catch (err) {
      console.error("Error removing favorite:", err);
    }
  };

  if (loading) {
    return <Layout><div className="loading">Loading favorites...</div></Layout>;
  }

  if (error) {
    return <Layout><div className="error">{error}</div></Layout>;
  }

  return (
    <Layout>
      <div className="fav-listing-container">
        <div className="fav-listing-header">
          <h1>Your Favorites</h1>
        </div>

        {favorites.length === 0 ? (
          <div className="fav-no-favorites">
            <p>You haven't added any properties to favorites yet.</p>
            <Link to="/property-listing" className="fav-browse-btn">
              Browse Properties
            </Link>
          </div>
        ) : (
          <div className="fav-property-grid">
            {favorites.map((property) => (
              <div key={property._id} className="fav-property-card">
                <div className="fav-image-gallery">
                  {property.images.length > 0 ? (
                    <>
                      <Link to={`/property-details/${property._id}`} className="fav-image-link">
                        <img
                          src={`http://localhost:5000/uploads/${property.images[currentImageIndices[property._id] || 0]}`}
                          alt={property.title}
                          className="fav-property-image"
                        />
                      </Link>
                      <div className={`fav-status-badge ${property.bookingStatus === 'booked' ? 'booked' : 'available'}`}>
                        {property.bookingStatus === 'booked' ? 'Booked' : 'Available'}
                      </div>
                      <div className="fav-gallery-controls">
                        <button 
                          className="fav-nav-btn fav-prev" 
                          onClick={(e) => handlePrevImage(property._id, e)}
                        >
                          &lt;
                        </button>
                        <div className="fav-image-counter">
                          {(currentImageIndices[property._id] || 0) + 1}/{property.images.length}
                        </div>
                        <button 
                          className="fav-nav-btn fav-next" 
                          onClick={(e) => handleNextImage(property._id, e)}
                        >
                          &gt;
                        </button>
                      </div>
                    </>
                  ) : (
                    <Link to={`/property-details/${property._id}`} className="fav-no-image">
                      No Image Available
                    </Link>
                  )}
                  <button 
                    className="fav-remove-btn"
                    onClick={(e) => removeFromFavorites(property._id, e)}
                  >
                    <FontAwesomeIcon icon={faTimes} />
                  </button>
                </div>
                
                <Link to={`/property-details/${property._id}`} className="fav-card-link">
                  <div className="fav-property-info">
                    <h3>{property.title}</h3>
                    <div className="fav-price">Rs {property.price.toLocaleString()}</div>
                    <div className="fav-location">
                      <span className="fav-city">{property.location.city}</span>, {property.location.address}
                    </div>
                    {property.propertyType === "Residential" && (
                      <div className="fav-details">
                        <span>{property.rooms.bedrooms} Beds</span>
                        <span>{property.rooms.bathrooms} Baths</span>
                        <span>{property.rooms.kitchen} Kitchen</span>
                        <span>{property.rooms.livingRoom} Living Room</span>
                      </div>
                    )}
                  </div>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Favorites;
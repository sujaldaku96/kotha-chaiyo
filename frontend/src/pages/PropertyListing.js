import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import "../styles/PropertyListing.css";
import Layout from "../components/layout.js";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHeart } from "@fortawesome/free-solid-svg-icons";

const PropertyListing = () => {
  const [residentialProperties, setResidentialProperties] = useState([]);
  const [commercialProperties, setCommercialProperties] = useState([]);
  const [activeTab, setActiveTab] = useState("residential");
  const [currentImageIndices, setCurrentImageIndices] = useState({});

  const staticResidentialProperties = [
    {
      _id: "1",
      propertyType: "Residential",
      title: "Modern Apartment in Kathmandu",
      price: 25000,
      location: {
        city: "Kathmandu",
        address: "Baneshwor"
      },
      rooms: {
        bedrooms: 2,
        bathrooms: 1,
        kitchen: 1,
        livingRoom: 1
      },
      images: [
       "1747982631050-3.jpg",
        "1747982631053-4.jpg",
        "1747984013207-bc.jpg"
      ],
      approved: true
    }
  ];

  const staticCommercialProperties = [
    {
      _id: "2",
      propertyType: "Commercial",
      title: "Office Space in Thamel",
      price: 75000,
      location: {
        city: "Kathmandu",
        address: "Thamel"
      },
      rooms: {
        bedrooms: 0,
        bathrooms: 2,
        kitchen: 1,
        livingRoom: 1
      },
      images: [
        "1747982631050-3.jpg",
        "1747982631053-4.jpg",
        "1747984013207-bc.jpg"
      ],
      approved: true
    }
  ];


  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/properties");
        const residential = response.data.filter((property) => 
          property.propertyType === "Residential" && property.approved
        );
        const commercial = response.data.filter((property) => 
          property.propertyType === "Commercial" && property.approved
        );

        setResidentialProperties(residential);
        setCommercialProperties(commercial);
        
        const indices = {};
        response.data.forEach(property => {
          indices[property._id] = 0;
        });
        setCurrentImageIndices(indices);
      } catch (err) {
        console.error("Error fetching properties", err);
      }
    };

    fetchProperties();

    // setResidentialProperties(staticResidentialProperties);
    // setCommercialProperties(staticCommercialProperties);
    
    // const indices = {};
    // [...staticResidentialProperties, ...staticCommercialProperties].forEach(property => {
    //   indices[property._id] = 0;
    // });
    // setCurrentImageIndices(indices);
    
  }, []);

  const handleNextImage = (propertyId, e) => {
    e.stopPropagation();
    setCurrentImageIndices(prev => {
      const property = [...residentialProperties, ...commercialProperties].find(p => p._id === propertyId);
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
      const property = [...residentialProperties, ...commercialProperties].find(p => p._id === propertyId);
      const maxIndex = property.images.length - 1;
      return {
        ...prev,
        [propertyId]: prev[propertyId] > 0 ? prev[propertyId] - 1 : maxIndex
      };
    });
  };

  return (
    <Layout>
      <div className="pl-listing-container">
        <div className="pl-listing-header">
          <h1>Property Listings</h1>
          <div className="pl-tab-container">
            <button
              className={`pl-tab-btn ${activeTab === "residential" ? "pl-active" : ""}`}
              onClick={() => setActiveTab("residential")}
            >
              Residential
            </button>
            <button
              className={`pl-tab-btn ${activeTab === "commercial" ? "pl-active" : ""}`}
              onClick={() => setActiveTab("commercial")}
            >
              Commercial
            </button>
          </div>
        </div>

        <div className="pl-property-grid">
          {activeTab === "residential" && residentialProperties.length === 0 ? (
            <div className="pl-no-properties">
              <h3>No Residential Properties Available</h3>
              <p>There are currently no residential properties listed. Please check back later.</p>
            </div>
          ) : activeTab === "residential" && residentialProperties.map((property) => (
            <PropertyCard 
              key={property._id}
              property={property}
              currentIndex={currentImageIndices[property._id] || 0}
              onNext={handleNextImage}
              onPrev={handlePrevImage}
            />
          ))}
          
          {activeTab === "commercial" && commercialProperties.length === 0 ? (
            <div className="pl-no-properties">
              <h3>No Commercial Properties Available</h3>
              <p>There are currently no commercial properties listed. Please check back later.</p>
            </div>
          ) : activeTab === "commercial" && commercialProperties.map((property) => (
            <PropertyCard 
              key={property._id}
              property={property}
              currentIndex={currentImageIndices[property._id] || 0}
              onNext={handleNextImage}
              onPrev={handlePrevImage}
            />
          ))}
        </div>
      </div>
    </Layout>
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
     <div className="pl-property-card">
      <div className="pl-image-gallery">
        <div className={`pl-status-badge ${property.bookingStatus === 'booked' ? 'booked' : 'available'}`}>
          {property.bookingStatus === 'booked' ? 'Booked' : 'Available'}
        </div>
        {property.images.length > 0 ? (
          <>
            <Link to={`/property-details/${property._id}`} className="pl-image-link">
              <img
                src={`http://localhost:5000/uploads/${property.images[currentIndex]}`}
                alt={property.title}
                className="pl-property-image"
              />
            </Link>
            <div className="pl-gallery-controls">
              <button 
                className="pl-nav-btn pl-prev" 
                onClick={(e) => onPrev(property._id, e)}
              >
                &lt;
              </button>
              <div className="pl-image-counter">
                {currentIndex + 1}/{property.images.length}
              </div>
              <button 
                className="pl-nav-btn pl-next" 
                onClick={(e) => onNext(property._id, e)}
              >
                &gt;
              </button>
            </div>
          </>
        ) : (
          <Link to={`/property-details/${property._id}`} className="pl-no-image">
            No Image Available
          </Link>
        )}
        <button 
          className={`pl-favorite-btn ${isFavorite ? "active" : ""}`}
          onClick={toggleFavorite}
        >
          <FontAwesomeIcon icon={faHeart} />
        </button>
      </div>
      
      <Link to={`/property-details/${property._id}`} className="pl-property-info">
        <h3>{property.title}</h3>
        <div className="pl-price">Rs {property.price.toLocaleString()}</div>
        <div className="pl-location">
          <span className="pl-city">{property.location.city}</span>, {property.location.address}
        </div>
        {property.propertyType === "Residential" && (
          <div className="pl-details">
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

export default PropertyListing;
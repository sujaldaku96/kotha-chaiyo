import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import PropertyMap from "../components/PropertyMap";
import "../styles/PropertyDetails.css";
import Layout from "../components/layout.js";
import KhaltiPayment from "../components/KhaltiPayment";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHeart, faArrowLeft } from "@fortawesome/free-solid-svg-icons";

const PropertyDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [property, setProperty] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [user, setUser] = useState(null);
  const [isBooking, setIsBooking] = useState(false);
  const [bookingError, setBookingError] = useState("");
  const [bookingSuccess, setBookingSuccess] = useState("");
  const [isFavorite, setIsFavorite] = useState(false);
  const [paymentError, setPaymentError] = useState('');

  const [showPaymentModal, setShowPaymentModal] = useState(false);

  useEffect(() => {
    const fetchPropertyDetails = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/properties/${id}`);
        setProperty(response.data);
      } catch (err) {
        setError("Error fetching property details.");
      }
    };

    const fetchUserData = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const res = await axios.get('http://localhost:5000/api/profile', {
            headers: { 
              'x-auth-token': token,
              'Content-Type': 'application/json'
            }
          });
          setUser(res.data);
        } catch (err) {
          console.error("Error fetching user data:", err);
        }
      }
    };

    fetchPropertyDetails();
    fetchUserData();
  }, [id]);

  useEffect(() => {
  const checkFavoriteStatus = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
      const response = await axios.get(`http://localhost:5000/api/favorites/check/${id}`, {
        headers: {
          'x-auth-token': token
        }
      });
      setIsFavorite(response.data.isFavorite);
    } catch (err) {
      console.error("Error checking favorite status:", err);
    }
  };

  checkFavoriteStatus();
}, [id]);

const toggleFavorite = async () => {
  const token = localStorage.getItem('token');
  if (!token) {
    navigate('/login');
    return;
  }

  try {
    if (isFavorite) {
      await axios.delete(`http://localhost:5000/api/favorites/${id}`, {
        headers: {
          'x-auth-token': token
        }
      });
    } else {
      await axios.post(`http://localhost:5000/api/favorites`, 
        { propertyId: id },
        {
          headers: {
            'x-auth-token': token
          }
        }
      );
    }
    setIsFavorite(!isFavorite);
  } catch (err) {
    console.error("Error toggling favorite:", err);
  }
};

const handleBookNow = () => {
  const token = localStorage.getItem('token');
  const userEmail = localStorage.getItem('userEmail');
  
  if (!token || !userEmail) {
    navigate('/login');
    return;
  }
  
  // Prevent owners from booking their own properties
  if (userEmail === property.contactInfo.ownerEmail) {
    setBookingError("You cannot book your own property");
    return;
  }
  
  // Check if property is available
  if (property.bookingStatus !== 'available') {
    setBookingError("This property is already booked");
    return;
  }
  
  setShowPaymentModal(true);
};

{showPaymentModal && (
  <KhaltiPayment 
    property={property}
    user={user}
    onClose={() => {
      setShowPaymentModal(false);
      setPaymentError('');
    }}
    onError={(message) => setPaymentError(message)}
  />
)}

{paymentError && <div className="error-message">{paymentError}</div>}

  const handleContactFormChange = (e) => {
    const { name, value } = e.target;
    setContactForm((prevForm) => ({
      ...prevForm,
      [name]: value,
    }));
  };

  const handleContactFormSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
  
      await axios.post(
        `http://localhost:5000/api/properties/${id}/contact`,
        {
          ...contactForm,
          propertyTitle: property.title
        },
        {
          headers: {
            'x-auth-token': token,
            'Content-Type': 'application/json'
          }
        }
      );
  
      setSuccess("Message sent successfully!");
      setError("");
      setContactForm({
        name: "",
        email: "",
        phone: "",
        message: "",
      });
    } catch (err) {
      console.error("Contact form error:", {
        status: err.response?.status,
        data: err.response?.data,
        config: err.config
      });
      
      let userMessage = "Failed to send message";
      if (err.response?.status === 404) {
        userMessage = err.response.data.message || userMessage;
      } else if (err.response?.status === 400) {
        userMessage = "Invalid request data";
      }
  
      setError(userMessage);
      setSuccess("");
    }
  };

  const handleNextImage = () => {
    setCurrentImageIndex(prev => 
      prev === property.images.length - 1 ? 0 : prev + 1
    );
  };

  const handlePrevImage = () => {
    setCurrentImageIndex(prev => 
      prev === 0 ? property.images.length - 1 : prev - 1
    );
  };

  if (!property) {
    return <Layout><div className="loading">Loading property details...</div></Layout>;
  }

  return (
    <Layout>
      <div className="property-details-container">
        <div className="property-header-top">
          <button className="back-button" onClick={() => navigate(-1)}>
            <FontAwesomeIcon icon={faArrowLeft} />
          </button>
          <button 
            className={`favorite-btn ${isFavorite ? "active" : ""}`}
            onClick={toggleFavorite}>
            <FontAwesomeIcon icon={faHeart} />
          </button>
        </div>
        
        <div className="property-header">
          <h1>{property.title}</h1>
          <div className="price-location">
            <span className="price">Rs {property.price.toLocaleString()}</span>
            <span className="location">
              {property.location.address}, {property.location.city}
            </span>
          </div>
        </div>

        <div className="image-gallery-container">
          {property.images.length > 0 ? (
            <div className="main-image-container">
              <img
                src={`http://localhost:5000/uploads/${property.images[currentImageIndex]}`}
                alt={`Property ${currentImageIndex + 1}`}
                className="main-image"
              />
              <div className="gallery-controls">
                <button className="nav-btn prev" onClick={handlePrevImage}>
                  &lt;
                </button>
                <div className="image-counter">
                  {currentImageIndex + 1}/{property.images.length}
                </div>
                <button className="nav-btn next" onClick={handleNextImage}>
                  &gt;
                </button>
              </div>
            </div>
          ) : (
            <div className="no-image">No Images Available</div>
          )}
        </div>

        <div className="property-content">
          <div className="details-section">
            <h2>Property Details</h2>
            <div className="details-grid">
              <div className="detail-item">
                <span className="detail-label">Type:</span>
                <span className="detail-value">{property.propertyType}</span>
              </div>
              {property.propertyType === "Residential" && (
                <>
                  <div className="detail-item">
                    <span className="detail-label">Furnishing:</span>
                    <span className="detail-value">{property.furnishingStatus}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Bedrooms:</span>
                    <span className="detail-value">{property.rooms.bedrooms}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Bathrooms:</span>
                    <span className="detail-value">{property.rooms.bathrooms}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Kitchen:</span>
                    <span className="detail-value">{property.rooms.kitchen}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Living Room:</span>
                    <span className="detail-value">{property.rooms.livingRoom}</span>
                  </div>
                </>
              )}
              <div className="detail-item full-width">
                <span className="detail-label">Description:</span>
                <p className="detail-value">{property.description}</p>
              </div>
            </div>

            <div className="amenities-section">
              <h3>Amenities</h3>
              <div className="amenities-grid">
                {property.amenities.map((amenity, index) => (
                  <div key={index} className="amenity-item">
                    {amenity}
                  </div>
                ))}
              </div>
            </div>

            <div className="location-section">
              <h3>Location Details</h3>
              <div className="location-info">
                <div className="info-item">
                  <span className="info-label">Address:</span>
                  <span className="info-value">{property.location.address}</span>
                </div>
                {property.location.exactLocation && (
                  <div className="info-item">
                    <span className="info-label">Exact Location:</span>
                    <span className="info-value">{property.location.exactLocation}</span>
                  </div>
                )}
                <div className="info-item">
                  <span className="info-label">City:</span>
                  <span className="info-value">{property.location.city}</span>
                </div>
              </div>
              
              <div className="property-map-container">
                <PropertyMap
                  latitude={property.location.latitude}
                  longitude={property.location.longitude}
                  city={property.location.city}
                  exactLocation={property.location.exactLocation}
                />
              </div>
            </div>
          </div>

          <div className="contact-section">
            <div className="owner-info">
              <h3>Owner Information</h3>
              <div className="info-item">
                <span className="info-label">Name:</span>
                <span className="info-value">{property.contactInfo.ownerName}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Phone:</span>
                <span className="info-value">{property.contactInfo.ownerPhone}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Email:</span>
                <span className="info-value">{property.contactInfo.ownerEmail}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Location:</span>
                <span className="info-value">{property.contactInfo.ownerLocation}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Ward No:</span>
                <span className="info-value">{property.contactInfo.wardNo}</span>
              </div>
            </div>

            <div className="contact-form-container">
        <h3>Contact Owner</h3>
        <form onSubmit={handleContactFormSubmit} className="contact-form">
          <div className="form-group">
            <input
              type="text"
              name="name"
              placeholder="Your Name"
              value={contactForm.name}
              onChange={handleContactFormChange}
              required
            />
          </div>
          <div className="form-group">
            <input
              type="email"
              name="email"
              placeholder="Your Email"
              value={contactForm.email}
              onChange={handleContactFormChange}
              required
            />
          </div>
          <div className="form-group">
            <input
              type="tel"
              name="phone"
              placeholder="Your Phone"
              value={contactForm.phone}
              onChange={handleContactFormChange}
              required
            />
          </div>
          <div className="form-group">
            <textarea
              name="message"
              placeholder="Your Message"
              value={contactForm.message}
              onChange={handleContactFormChange}
              required
            />
          </div>
          <button type="submit" className="submit-btn">Send Message</button>
        </form>
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}
      </div>

      <div className="booking-section">
          {property && property.bookingStatus === 'available' ? (
            <button 
              onClick={handleBookNow}
              disabled={isBooking || (user && user.email === property.contactInfo.ownerEmail)}
              className="book-now-btn"
            >
              {isBooking ? 'Processing...' : 'Book Now'}
            </button>
          ) : (
            <div className="booked-badge">Currently Booked</div>
          )}
          {user && user.email === property.contactInfo.ownerEmail && (
            <p className="owner-notice">You cannot book your own property</p>
          )}
          {bookingError && <div className="error-message">{bookingError}</div>}
          {bookingSuccess && <div className="success-message">{bookingSuccess}</div>}
        </div>

        {showPaymentModal && (
  <KhaltiPayment 
    property={property}
    user={user}
    onClose={() => {
      setShowPaymentModal(false);
      setPaymentError('');
    }}
    onError={(message) => setPaymentError(message)}
  />
)}

{paymentError && <div className="error-message">{paymentError}</div>}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PropertyDetails;
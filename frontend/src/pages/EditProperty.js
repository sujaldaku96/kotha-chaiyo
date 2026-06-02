import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import PropertyMap from "../components/PropertyMap";
import "../styles/EditProperty.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import Layout from "../components/layout.js";

const residentialAmenities = [
  "Parking",
  "Wifi",
  "Water Supply",
  "Balcony",
  "Solar Water",
  "Water Tank",
];

const commercialAmenities = ["Street Front Visibility", "Parking"];

const EditProperty = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(`http://localhost:5000/api/properties/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setProperty(response.data);
        setLoading(false);
      } catch (err) {
        if (err.response?.status === 401) {
          localStorage.removeItem("token");
          navigate("/login");
        } else {
          setError("Failed to fetch property details");
        }
        setLoading(false);
      }
    };

    fetchProperty();
  }, [id, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProperty(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleNestedChange = (parent, e) => {
    const { name, value } = e.target;
    setProperty(prev => {
      if (parent === 'location') {
        return {
          ...prev,
          location: {
            ...prev.location,
            [name]: value,
            latitude: prev.location.latitude,
            longitude: prev.location.longitude
          }
        };
      }
      return {
        ...prev,
        [parent]: {
          ...prev[parent],
          [name]: value
        }
      };
    });
  };

  const handleCheckboxChange = (e) => {
    const { value, checked } = e.target;
    setProperty(prev => ({
      ...prev,
      amenities: checked
        ? [...prev.amenities, value]
        : prev.amenities.filter(amenity => amenity !== value),
    }));
  };

  const handleLocationChange = (newPosition) => {
    setProperty(prev => ({
      ...prev,
      location: {
        ...prev.location,
        latitude: newPosition.lat,
        longitude: newPosition.lng,
        address: prev.location.address,
        city: prev.location.city,
        exactLocation: prev.location.exactLocation
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");
    
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `http://localhost:5000/api/properties/${id}`,
        property,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      setSuccess("Property updated successfully!");
      setTimeout(() => navigate("/my-listings"), 2000);
    } catch (err) {
      console.error("Update error:", err.response);
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        navigate("/login");
      } else {
        setError(err.response?.data?.message || "Failed to update property");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (!property) return <div className="error-message">Property not found</div>;

  return (
    <Layout>
    <div className="edit-property-container">
      <button onClick={() => navigate(-1)} className="back-button">
        <FontAwesomeIcon icon={faArrowLeft} />
      </button>
      
      <div className="edit-header">
        <h2>Edit Property</h2>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="form-section">
          <h3>Basic Information</h3>
          <div className="form-group">
            <label>Title:</label>
            <input
              type="text"
              name="title"
              value={property.title}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label>Description:</label>
            <textarea
              name="description"
              value={property.description}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label>Price (Rs):</label>
            <input
              type="number"
              name="price"
              value={property.price}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label>Property Type:</label>
            <select
              name="propertyType"
              value={property.propertyType}
              onChange={handleChange}
              required
            >
              <option value="Residential">Residential</option>
              <option value="Commercial">Commercial</option>
            </select>
          </div>
        </div>

        {property.propertyType === "Residential" && (
          <div className="form-section">
            <h3>Residential Details</h3>
            <div className="form-group">
              <label>Furnishing Status:</label>
              <select
                name="furnishingStatus"
                value={property.furnishingStatus}
                onChange={handleChange}
                required
              >
                <option value="Unfurnished">Unfurnished</option>
                <option value="Semi-Furnished">Semi-Furnished</option>
                <option value="Furnished">Furnished</option>
              </select>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Bedrooms:</label>
                <input
                  type="number"
                  name="bedrooms"
                  value={property.rooms.bedrooms}
                  onChange={(e) => handleNestedChange('rooms', e)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Bathrooms:</label>
                <input
                  type="number"
                  name="bathrooms"
                  value={property.rooms.bathrooms}
                  onChange={(e) => handleNestedChange('rooms', e)}
                  required
                />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Kitchen:</label>
                <input
                  type="number"
                  name="kitchen"
                  value={property.rooms.kitchen}
                  onChange={(e) => handleNestedChange('rooms', e)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Living Room:</label>
                <input
                  type="number"
                  name="livingRoom"
                  value={property.rooms.livingRoom}
                  onChange={(e) => handleNestedChange('rooms', e)}
                  required
                />
              </div>
            </div>
          </div>
        )}

        <div className="form-section">
          <h3>Location Information</h3>
          <div className="form-group">
            <label>Address:</label>
            <input
              type="text"
              name="address"
              value={property.location.address}
              onChange={(e) => handleNestedChange('location', e)}
              required
            />
          </div>
          
          <div className="form-group">
            <label>City:</label>
            <input
              type="text"
              name="city"
              value={property.location.city}
              onChange={(e) => handleNestedChange('location', e)}
              required
            />
          </div>
          
          <div className="form-group">
            <label>Exact Location:</label>
            <input
              type="text"
              name="exactLocation"
              value={property.location.exactLocation}
              onChange={(e) => handleNestedChange('location', e)}
            />
          </div>
          
          <div className="map-preview">
  <h4>Location Map</h4>
  <p>Click on the map to update the location</p>
  <div className="map-container" style={{ height: '400px' }}>
    <PropertyMap
      latitude={property.location.latitude}
      longitude={property.location.longitude}
      city={property.location.city}
      exactLocation={property.location.exactLocation}
      onPositionChange={(pos) => {
        handleLocationChange(pos);
      }}
    />
  </div>
</div>
        </div>

        <div className="form-section">
          <h3>Amenities</h3>
          <div className="amenities-grid">
            {(property.propertyType === "Residential" ? residentialAmenities : commercialAmenities).map((amenity) => (
              <div key={amenity} className="amenity-item">
                <input
                  type="checkbox"
                  id={amenity}
                  value={amenity}
                  checked={property.amenities.includes(amenity)}
                  onChange={handleCheckboxChange}
                />
                <label htmlFor={amenity}>{amenity}</label>
              </div>
            ))}
          </div>
        </div>

        <div className="form-section">
          <h3>Contact Information</h3>
          <div className="form-group">
            <label>Owner Name:</label>
            <input
              type="text"
              name="ownerName"
              value={property.contactInfo.ownerName}
              onChange={(e) => handleNestedChange('contactInfo', e)}
              required
            />
          </div>
          
          <div className="form-group">
            <label>Owner Phone:</label>
            <input
              type="tel"
              name="ownerPhone"
              value={property.contactInfo.ownerPhone}
              onChange={(e) => handleNestedChange('contactInfo', e)}
              required
            />
          </div>
          
          <div className="form-group">
            <label>Owner Email:</label>
            <input
              type="email"
              name="ownerEmail"
              value={property.contactInfo.ownerEmail}
              onChange={(e) => handleNestedChange('contactInfo', e)}
              required
            />
          </div>
          
          <div className="form-group">
            <label>Owner Location:</label>
            <input
              type="text"
              name="ownerLocation"
              value={property.contactInfo.ownerLocation}
              onChange={(e) => handleNestedChange('contactInfo', e)}
              required
            />
          </div>
          
          <div className="form-group">
            <label>Ward No:</label>
            <input
              type="number"
              name="wardNo"
              value={property.contactInfo.wardNo}
              onChange={(e) => handleNestedChange('contactInfo', e)}
              required
            />
          </div>
        </div>

        <div className="form-actions">
          <button 
            type="submit" 
            className="save-btn"
            disabled={submitting}
          >
            {submitting ? "Saving..." : "Save Changes"}
          </button>
          <button 
            type="button" 
            className="cancel-btn" 
            onClick={() => navigate(-1)}
            disabled={submitting}
          >
            Cancel
          </button>
        </div>
      </form>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}
    </div>
    </Layout>
  );
};

export default EditProperty;
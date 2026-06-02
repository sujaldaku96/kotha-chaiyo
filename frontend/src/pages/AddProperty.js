import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import PropertyMap from "../components/PropertyMap";
import "../styles/AddProperty.css";
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

const AddProperty = () => {
  const navigate = useNavigate();
  const [propertyDetails, setPropertyDetails] = useState({
    propertyType: "",
    price: "",
    location: {
      address: "",
      city: "",
      latitude: 27.7172, 
      longitude: 85.3240,
      exactLocation: ""
    },
    furnishingStatus: "",
    title: "",
    description: "",
    amenities: [],
    images: [],
    rooms: {
      bedrooms: "",
      bathrooms: "",
      kitchen: "",
      livingRoom: "",
    },
    contactInfo: {
      ownerName: "",
      ownerPhone: "",
      ownerEmail: "",
      ownerLocation: "",
      wardNo: "",
    },
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [previewImages, setPreviewImages] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const cityCoordinates = {
      'Kathmandu': [27.7172, 85.3240],
      'Pokhara': [28.2096, 83.9856],
      'Chitwan': [27.5175, 84.3547],
      'Bhaktapur': [27.6710, 85.4298],
      'Lalitpur': [27.6667, 85.3167],
      'Biratnagar': [26.4525, 87.2718],
      'Birgunj': [27.0128, 84.8735],
      'Dharan': [26.8065, 87.2846],
      'Nepalgunj': [28.0500, 81.6167],
      'Butwal': [27.7006, 83.4487],
      'Dhangadhi': [28.7041, 80.5951],
      'Janakpur': [26.7271, 85.9407],
      'Hetauda': [27.4287, 85.0322],
      'Itahari': [26.6631, 87.2773],
      'Kirtipur': [27.6792, 85.2775]
    };

    if (propertyDetails.location.city && cityCoordinates[propertyDetails.location.city]) {
      const [lat, lng] = cityCoordinates[propertyDetails.location.city];
      setPropertyDetails(prev => ({
        ...prev,
        location: {
          ...prev.location,
          latitude: lat,
          longitude: lng
        }
      }));
    }
  }, [propertyDetails.location.city]);

  const handleChange = (e) => {
    const { name, value } = e.target;
  
    setPropertyDetails((prevDetails) => {
      const numericFields = ["bedrooms", "bathrooms", "kitchen", "livingRoom", "wardNo", "price"];
      let updatedValue = numericFields.includes(name) ? (value ? Math.max(0, Number(value)) : "") : value;

      if (name === "address" || name === "city" || name === "exactLocation") {
        return {
          ...prevDetails,
          location: {
            ...prevDetails.location,
            [name]: value,
            latitude: prevDetails.location.latitude,
            longitude: prevDetails.location.longitude
          }
        };
      }

      if (["bedrooms", "bathrooms", "kitchen", "livingRoom"].includes(name)) {
        return {
          ...prevDetails,
          rooms: {
            ...prevDetails.rooms,
            [name]: updatedValue,
          },
        };
      }
  
      if (["ownerName", "ownerPhone", "ownerEmail", "ownerLocation", "wardNo"].includes(name)) {
        return {
          ...prevDetails,
          contactInfo: {
            ...prevDetails.contactInfo,
            [name]: updatedValue,
          },
        };
      }
  
      return {
        ...prevDetails,
        [name]: updatedValue,
      };
    });
  };

  const handleCheckboxChange = (e) => {
    const { value, checked } = e.target;
    setPropertyDetails((prevDetails) => ({
      ...prevDetails,
      amenities: checked
        ? [...prevDetails.amenities, value]
        : prevDetails.amenities.filter((amenity) => amenity !== value),
    }));
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    
    // Limit to 3 images
    if (files.length > 3) {
      setError("You can upload a maximum of 3 images");
      return;
    }
    
    setError("");
    
    // Create preview URLs
    const previewUrls = files.map(file => URL.createObjectURL(file));
    setPreviewImages(previewUrls);
    
    setPropertyDetails((prevDetails) => ({
      ...prevDetails,
      images: files.slice(0, 3), 
    }));
  };

  const handleNextImage = () => {
    setCurrentImageIndex(prev => 
      prev === previewImages.length - 1 ? 0 : prev + 1
    );
  };

  const handlePrevImage = () => {
    setCurrentImageIndex(prev => 
      prev === 0 ? previewImages.length - 1 : prev - 1
    );
  };

  const handleMapClick = (e) => {
    const { lat, lng } = e.latlng;
    setPropertyDetails(prev => ({
      ...prev,
      location: {
        ...prev.location,
        latitude: lat,
        longitude: lng,
        address: prev.location.address,
        city: prev.location.city,
        exactLocation: prev.location.exactLocation
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (propertyDetails.images.length !== 3) {
      setError("Please upload exactly 3 images");
      return;
    }
    
    try {
      const formData = new FormData();
      const userEmail = localStorage.getItem("userEmail");
      
      if (!userEmail) {
        setError("User information not found. Please login again.");
        return;
      }

      const contactInfo = {
        ...propertyDetails.contactInfo,
        ownerEmail: userEmail 
      };

      formData.append("propertyType", propertyDetails.propertyType);
      formData.append("price", propertyDetails.price);
      formData.append("location", JSON.stringify(propertyDetails.location));
      formData.append("furnishingStatus", propertyDetails.furnishingStatus);
      formData.append("title", propertyDetails.title);
      formData.append("description", propertyDetails.description);
      formData.append("amenities", JSON.stringify(propertyDetails.amenities));
      formData.append("rooms", JSON.stringify(propertyDetails.rooms));
      formData.append("contactInfo", JSON.stringify(contactInfo));
      
      propertyDetails.images.forEach((image) => {
        formData.append("images", image);
      });

      await axios.post("http://localhost:5000/api/properties/add", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setSuccess("Property added successfully! It will be listed after admin approval.");
      setError("");

      setPropertyDetails({
        propertyType: "",
        price: "",
        location: {
          address: "",
          city: "",
          latitude: 27.7172,
          longitude: 85.3240,
          exactLocation: ""
        },
        furnishingStatus: "",
        title: "",
        description: "",
        amenities: [],
        images: [],
        rooms: {
          bedrooms: "",
          bathrooms: "",
          kitchen: "",
          livingRoom: "",
        },
        contactInfo: {
          ownerName: "",
          ownerPhone: "",
          ownerEmail: "",
          ownerLocation: "",
          wardNo: "",
        },
      });
      setPreviewImages([]);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add property.");
      setSuccess("");
    }
  };

  return (
    <Layout>
      <div className="add-property-container">
        <h2>Add Property</h2>
        <form onSubmit={handleSubmit}>
          <select 
            name="propertyType" 
            value={propertyDetails.propertyType} 
            onChange={handleChange} 
            required
          >
            <option value="">Select Property Type</option>
            <option value="Residential">Residential</option>
            <option value="Commercial">Commercial</option>
          </select>

          <input 
            type="number" 
            name="price" 
            placeholder="Price (Rs)" 
            value={propertyDetails.price} 
            onChange={handleChange} 
            required 
          />

          {propertyDetails.propertyType === "Residential" && (
            <select 
              name="furnishingStatus" 
              value={propertyDetails.furnishingStatus} 
              onChange={handleChange} 
              required
            >
              <option value="">Select Furnishing Status</option>
              <option value="Unfurnished">Unfurnished</option>
              <option value="Semi-Furnished">Semi-Furnished</option>
              <option value="Furnished">Furnished</option>
            </select>
          )}

          <input 
            type="text" 
            name="title" 
            placeholder="Property Title" 
            value={propertyDetails.title} 
            onChange={handleChange} 
            required 
          />
          <textarea 
            name="description" 
            placeholder="Property Description" 
            value={propertyDetails.description} 
            onChange={handleChange} 
            required 
          />

          {propertyDetails.propertyType === "Residential" && (
            <div className="rooms">
              <input 
                type="number" 
                name="bedrooms" 
                placeholder="Bedrooms" 
                value={propertyDetails.rooms.bedrooms} 
                onChange={handleChange} 
                required 
              />
              <input 
                type="number" 
                name="bathrooms" 
                placeholder="Bathrooms" 
                value={propertyDetails.rooms.bathrooms} 
                onChange={handleChange} 
                required 
              />
              <input 
                type="number" 
                name="kitchen" 
                placeholder="Kitchen" 
                value={propertyDetails.rooms.kitchen} 
                onChange={handleChange} 
                required 
              />
              <input 
                type="number" 
                name="livingRoom" 
                placeholder="Living Room" 
                value={propertyDetails.rooms.livingRoom} 
                onChange={handleChange} 
                required 
              />
            </div>
          )}

          <div className="amenities-section">
            <p>Select Amenities:</p>
            <div className="amenities-list">
              {(propertyDetails.propertyType === "Residential" ? residentialAmenities : commercialAmenities).map((amenity) => (
                <div key={amenity} className="amenity-row">
                  <label className="amenity-label">{amenity}</label>
                  <input
                    type="checkbox"
                    className="amenity-checkbox"
                    value={amenity}
                    onChange={handleCheckboxChange}
                    checked={propertyDetails.amenities.includes(amenity)}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="image-upload-section">
            <label>
              Upload exactly 3 photos (max):
              <input 
                type="file" 
                name="images" 
                accept="image/*" 
                multiple 
                onChange={handleImageChange} 
                required 
              />
            </label>

            {previewImages.length > 0 && (
              <div className="image-gallery">
                <div className="gallery-container">
                  <button 
                    type="button" 
                    className="nav-button prev" 
                    onClick={handlePrevImage}
                  >
                    &lt;
                  </button>
                  
                  <div className="image-container">
                    <img 
                      src={previewImages[currentImageIndex]} 
                      alt={`Preview ${currentImageIndex + 1}`} 
                    />
                    <div className="image-counter">
                      {currentImageIndex + 1} / {previewImages.length}
                    </div>
                  </div>
                  
                  <button 
                    type="button" 
                    className="nav-button next" 
                    onClick={handleNextImage}
                  >
                    &gt;
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="contact-info">
            <input 
              type="text" 
              name="ownerName" 
              placeholder="Owner's Name" 
              value={propertyDetails.contactInfo.ownerName} 
              onChange={handleChange} 
              required 
            />
            <input 
              type="tel" 
              name="ownerPhone" 
              placeholder="Owner's Phone" 
              value={propertyDetails.contactInfo.ownerPhone} 
              onChange={handleChange} 
              required 
            />
            <input 
              type="email" 
              name="ownerEmail" 
              placeholder="Owner's Email" 
              value={propertyDetails.contactInfo.ownerEmail} 
              onChange={handleChange} 
              required 
            />
            <input 
              type="text" 
              name="ownerLocation" 
              placeholder="Owner's Location" 
              value={propertyDetails.contactInfo.ownerLocation} 
              onChange={handleChange} 
              required 
            />
            <input 
              type="number" 
              name="wardNo" 
              placeholder="Ward No" 
              value={propertyDetails.contactInfo.wardNo} 
              onChange={handleChange} 
              required 
            />
          </div>

          <div className="form-group">
            <label>City</label>
            <select
              name="city"
              value={propertyDetails.location.city}
              onChange={(e) => handleChange({
                target: { name: "city", value: e.target.value }
              })}
              required
            >
              <option value="">Select City</option>
              <option value="Kathmandu">Kathmandu</option>
              <option value="Pokhara">Pokhara</option>
              <option value="Chitwan">Chitwan</option>
              <option value="Bhaktapur">Bhaktapur</option>
              <option value="Lalitpur">Lalitpur</option>
              <option value="Biratnagar">Biratnagar</option>
              <option value="Birgunj">Birgunj</option>
              <option value="Dharan">Dharan</option>
              <option value="Nepalgunj">Nepalgunj</option>
              <option value="Butwal">Butwal</option>
              <option value="Dhangadhi">Dhangadhi</option>
              <option value="Janakpur">Janakpur</option>
              <option value="Hetauda">Hetauda</option>
              <option value="Itahari">Itahari</option>
              <option value="Kirtipur">Kirtipur</option>
            </select>
          </div>

          <input 
            type="text" 
            name="address" 
            placeholder="Street Address" 
            value={propertyDetails.location.address} 
            onChange={(e) => handleChange({
              target: { name: "address", value: e.target.value }
            })}
            required 
          />

          <input 
            type="text" 
            name="exactLocation" 
            placeholder="Exact Location (e.g., Near Central Park)" 
            value={propertyDetails.location.exactLocation} 
            onChange={(e) => handleChange({
              target: { name: "exactLocation", value: e.target.value }
            })}
          />

          <div className="map-section">
            <h4>Pin Exact Location</h4>
            <p>Click on the map to mark the property location</p>
            <div style={{ height: '300px', margin: '1rem 0' }}>
              <PropertyMap
                latitude={propertyDetails.location.latitude}
                longitude={propertyDetails.location.longitude}
                city={propertyDetails.location.city}
                exactLocation={propertyDetails.location.exactLocation}
                interactive={true}
                onMapClick={handleMapClick}
              />
            </div>
          </div>

          <button type="submit">Add Property</button>
        </form>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}
      </div>
    </Layout>
  );
};

export default AddProperty;
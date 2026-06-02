import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import PropertyMap from "../components/PropertyMap";
import "../styles/AdminDashboard.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash, faEye, faSpinner, faTimesCircle, faFileInvoiceDollar, faArrowLeft, faMoneyBillWave } from "@fortawesome/free-solid-svg-icons";
import AdminPayments from "../components/AdminPayments";
import AdminRefunds from "../components/AdminRefunds";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

const AdminDashboard = () => {
  const [pendingProperties, setPendingProperties] = useState([]);
  const [allProperties, setAllProperties] = useState([]);
  const [loadingProperties, setLoadingProperties] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [currentImageIndices, setCurrentImageIndices] = useState({});
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [activeSection, setActiveSection] = useState("approvals");
  const [users, setUsers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [error, setError] = useState(null);
  const [usersLoaded, setUsersLoaded] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          navigate('/login');
          return;
        }

        setLoadingProperties(true);
        const [pendingResponse, allResponse] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/properties/pending`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get(`${API_BASE_URL}/api/properties/all`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);
        
        setPendingProperties(pendingResponse.data);
        setAllProperties(allResponse.data);
        
        const indices = {};
        [...pendingResponse.data, ...allResponse.data].forEach(property => {
          indices[property._id] = 0;
        });
        setCurrentImageIndices(indices);
        
        if (!usersLoaded) {
          fetchUsers();
        }
      } catch (err) {
        console.error("Error fetching initial data", err);
        setError(err.response?.data?.message || err.message || "Failed to load data");
        if (err.response?.status === 401) {
          localStorage.removeItem("token");
          navigate('/login');
        }
      } finally {
        setLoadingProperties(false);
      }
    };

    fetchInitialData();
  }, [navigate, usersLoaded]);

  useEffect(() => {
    if (activeSection === 'payments') {
      fetchPayments();
    }
  }, [activeSection]);

  const fetchUsers = useCallback(async () => {
    try {
      setLoadingUsers(true);
      const token = localStorage.getItem("token");
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await axios.get(`${API_BASE_URL}/api/auth/users`, {
        headers: { 
          'x-auth-token': token,
          'Content-Type': 'application/json'
        }
      });
      
      setUsers(response.data);
      setUsersLoaded(true);
    } catch (err) {
      console.error("Error fetching users", err);
      setError(err.response?.data?.message || err.message || "Failed to load users");
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        navigate('/login');
      }
    } finally {
      setLoadingUsers(false);
    }
  }, [navigate]);

  const fetchPayments = async () => {
    try {
      setLoadingPayments(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/api/bookings/payments`, {
        headers: { 
          'x-auth-token': token,
          'Content-Type': 'application/json'
        }
      });
    
      const validPayments = response.data.filter(payment => 
        payment?.paymentDetails && 
        payment?.property && 
        payment?.user &&
        payment.status === 'paid'
      );
      
      setPayments(validPayments);
    } catch (err) {
      console.error('Error fetching payments:', err);
      setError(err.response?.data?.message || 'Failed to fetch payments');
    } finally {
      setLoadingPayments(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      const confirmDelete = window.confirm("Are you sure you want to delete this user?");
      if (!confirmDelete) return;

      const token = localStorage.getItem("token");
      await axios.delete(`${API_BASE_URL}/api/auth/users/${userId}`, {
        headers: { 
          'x-auth-token': token,
          'Content-Type': 'application/json'
        }
      });

      setUsers(prev => prev.filter(user => user._id !== userId));
    } catch (err) {
      console.error("Error deleting user", err);
      setError(err.response?.data?.message || err.message || "Failed to delete user");
    }
  };

  const handleApprove = async (propertyId) => {
    try {
      await axios.patch(`${API_BASE_URL}/api/properties/${propertyId}/approve`);
      setPendingProperties(prev => prev.filter(p => p._id !== propertyId));
      setAllProperties(prev => prev.filter(p => p._id !== propertyId));
      setSelectedProperty(null);
    } catch (err) {
      console.error("Error approving property", err);
    }
  };

  const handleReject = async (propertyId) => {
    try {
      await axios.delete(`${API_BASE_URL}/api/properties/${propertyId}/reject`);
      setPendingProperties(prev => prev.filter(p => p._id !== propertyId));
      setAllProperties(prev => prev.filter(p => p._id !== propertyId));
      setSelectedProperty(null);
    } catch (err) {
      console.error("Error rejecting property", err);
    }
  };

  const handleDeleteProperty = async (propertyId) => {
    try {
      const confirmDelete = window.confirm("Are you sure you want to delete this property? This action cannot be undone.");
      if (!confirmDelete) return;

      await axios.delete(`${API_BASE_URL}/api/properties/${propertyId}/admin`);
      setPendingProperties(prev => prev.filter(p => p._id !== propertyId));
      setAllProperties(prev => prev.filter(p => p._id !== propertyId));
      
      if (selectedProperty?._id === propertyId) {
        setSelectedProperty(null);
      }
    } catch (err) {
      console.error("Error deleting property", err);
      alert("Failed to delete property. Please try again.");
    }
  };

  const handleNextImage = (propertyId, e) => {
    e?.stopPropagation();
    setCurrentImageIndices(prev => {
      const property = selectedProperty || 
                      (activeSection === "approvals" 
                        ? pendingProperties.find(p => p._id === propertyId)
                        : allProperties.find(p => p._id === propertyId));
      const maxIndex = property.images.length - 1;
      const newIndex = (prev[propertyId] || 0) < maxIndex ? (prev[propertyId] || 0) + 1 : 0;
      return {
        ...prev,
        [propertyId]: newIndex
      };
    });
  };

  const handlePrevImage = (propertyId, e) => {
    e?.stopPropagation();
    setCurrentImageIndices(prev => {
      const property = selectedProperty || 
                      (activeSection === "approvals" 
                        ? pendingProperties.find(p => p._id === propertyId)
                        : allProperties.find(p => p._id === propertyId));
      const maxIndex = property.images.length - 1;
      const newIndex = (prev[propertyId] || 0) > 0 ? (prev[propertyId] || 0) - 1 : maxIndex;
      return {
        ...prev,
        [propertyId]: newIndex
      };
    });
  };

  const handleViewDetails = (property) => {
    setSelectedProperty(property);
  };

  const handleBackToList = () => {
    setSelectedProperty(null);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const renderPropertyDetailView = useCallback(() => (
    <div className="property-detail-view">
      <button className="back-button" onClick={handleBackToList}>
        <FontAwesomeIcon icon={faArrowLeft} />
      </button>
      
      <div className="property-header">
        <h2>{selectedProperty.title}</h2>
        <div className="price-location">
          <span className="price">Rs {selectedProperty.price.toLocaleString()}</span>
          <span className="location">
            {selectedProperty.location.address}, {selectedProperty.location.city}
          </span>
        </div>
      </div>

      <div className="image-gallery-container">
        {selectedProperty.images.length > 0 ? (
          <div className="main-image-container">
            <img
              src={`${API_BASE_URL}/uploads/${selectedProperty.images[currentImageIndices[selectedProperty._id] || 0]}`}
              alt={`Property ${(currentImageIndices[selectedProperty._id] || 0) + 1}`}
              className="main-image"
            />
            <div className="gallery-controls">
              <button className="nav-btn prev" onClick={() => handlePrevImage(selectedProperty._id)}>
                &lt;
              </button>
              <div className="image-counter">
                {(currentImageIndices[selectedProperty._id] || 0) + 1}/{selectedProperty.images.length}
              </div>
              <button className="nav-btn next" onClick={() => handleNextImage(selectedProperty._id)}>
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
              <span className="detail-value">{selectedProperty.propertyType}</span>
            </div>
            {selectedProperty.propertyType === "Residential" && (
              <>
                <div className="detail-item">
                  <span className="detail-label">Furnishing:</span>
                  <span className="detail-value">{selectedProperty.furnishingStatus}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Bedrooms:</span>
                  <span className="detail-value">{selectedProperty.rooms.bedrooms}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Bathrooms:</span>
                  <span className="detail-value">{selectedProperty.rooms.bathrooms}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Kitchen:</span>
                  <span className="detail-value">{selectedProperty.rooms.kitchen}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Living Room:</span>
                  <span className="detail-value">{selectedProperty.rooms.livingRoom}</span>
                </div>
              </>
            )}
            <div className="detail-item full-width">
              <span className="detail-label">Description:</span>
              <p className="detail-value">{selectedProperty.description}</p>
            </div>
          </div>

          <div className="amenities-section">
            <h3>Amenities</h3>
            <div className="amenities-grid">
              {selectedProperty.amenities.map((amenity, index) => (
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
                <span className="info-value">{selectedProperty.location.address}</span>
              </div>
              {selectedProperty.location.exactLocation && (
                <div className="info-item">
                  <span className="info-label">Exact Location:</span>
                  <span className="info-value">{selectedProperty.location.exactLocation}</span>
                </div>
              )}
              <div className="info-item">
                <span className="info-label">City:</span>
                <span className="info-value">{selectedProperty.location.city}</span>
              </div>
            </div>
            
            <div className="property-map-container">
              <PropertyMap
                latitude={selectedProperty.location.latitude}
                longitude={selectedProperty.location.longitude}
                city={selectedProperty.location.city}
                exactLocation={selectedProperty.location.exactLocation}
              />
            </div>
          </div>
        </div>

        <div className="owner-section">
          <div className="owner-info">
            <h3>Owner Information</h3>
            <div className="info-item">
              <span className="info-label">Name:</span>
              <span className="info-value">{selectedProperty.contactInfo.ownerName}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Phone:</span>
              <span className="info-value">{selectedProperty.contactInfo.ownerPhone}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Email:</span>
              <span className="info-value">{selectedProperty.contactInfo.ownerEmail}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Location:</span>
              <span className="info-value">{selectedProperty.contactInfo.ownerLocation}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Ward No:</span>
              <span className="info-value">{selectedProperty.contactInfo.wardNo}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="approval-buttons">
        {activeSection === "approvals" ? (
          <>
            <button 
              className="approve-btn"
              onClick={() => handleApprove(selectedProperty._id)}
            >
              Approve
            </button>
            <button 
              className="reject-btn"
              onClick={() => handleReject(selectedProperty._id)}
            >
              Reject
            </button>
          </>
        ) : (
          <button 
            className="delete-btn"
            onClick={() => handleDeleteProperty(selectedProperty._id)}
          >
            <FontAwesomeIcon icon={faTrash} /> Delete Property
          </button>
        )}
      </div>
    </div>
  ), [selectedProperty, currentImageIndices, activeSection]);

  const renderPropertiesGrid = useCallback((properties) => (
    <div className="properties-grid">
      {properties.map((property) => (
        <div 
          key={property._id} 
          className="property-card"
          onClick={() => handleViewDetails(property)}
        >
          <div className="image-gallery">
            {property.images.length > 0 ? (
              <>
                <img
                  src={`${API_BASE_URL}/uploads/${property.images[currentImageIndices[property._id] || 0]}`}
                  alt={property.title}
                  className="property-image"
                />
                <div className="gallery-controls">
                  <button 
                    className="nav-btn" 
                    onClick={(e) => handlePrevImage(property._id, e)}
                  >
                    &lt;
                  </button>
                  <span className="image-counter">
                    {(currentImageIndices[property._id] || 0) + 1}/{property.images.length}
                  </span>
                  <button 
                    className="nav-btn" 
                    onClick={(e) => handleNextImage(property._id, e)}
                  >
                    &gt;
                  </button>
                </div>
                <div className={`status-badge ${property.bookingStatus === 'booked' ? 'booked' : 'available'}`}>
                  {property.bookingStatus === 'booked' ? "Booked" : "Available"}
                </div>
              </>
            ) : (
              <div className="no-image">No Image</div>
            )}
          </div>
          
          <div className="property-info">
            <h3>{property.title}</h3>
            <div className="price">Rs {property.price.toLocaleString()}</div>
            <div className="location">
              {property.location.city}
            </div>
            {activeSection === "listings" && (
              <div className="property-actions">
                <button 
                  className="action-btn view"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleViewDetails(property);
                  }}
                >
                  <FontAwesomeIcon icon={faEye} /> View
                </button>
                <button 
                  className="action-btn delete"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteProperty(property._id);
                  }}
                >
                  <FontAwesomeIcon icon={faTrash} /> Delete
                </button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  ), [currentImageIndices, activeSection]);

  const renderUsersList = useCallback(() => (
    <div className="users-list">
      <h2>User Management</h2>
      {loadingUsers ? (
        <div className="loading-container">
          <FontAwesomeIcon icon={faSpinner} spin size="2x" />
          <p>Loading users...</p>
        </div>
      ) : users.length === 0 ? (
        <div className="no-users">No users found</div>
      ) : (
        <table className="users-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user._id}>
                <td>{user.firstName} {user.lastName}</td>
                <td>{user.email}</td>
                <td>{user.role}</td>
                <td>
                  <button 
                    className="action-btn delete"
                    onClick={() => handleDeleteUser(user._id)}
                    disabled={user.role === 'admin'}
                  >
                    <FontAwesomeIcon icon={faTrash} /> Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  ), [users, loadingUsers]);

  if (loadingProperties && (activeSection === "approvals" || activeSection === "listings")) {
    return (
      <div className="loading-container">
        <FontAwesomeIcon icon={faSpinner} spin size="2x" />
        <p>Loading properties...</p>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <div className="sidebar">
        <h2 className="sidebar-title">Admin Dashboard</h2>
        
        <div className="sidebar-section">
          <button 
            className={activeSection === 'approvals' ? 'active' : ''}
            onClick={() => setActiveSection('approvals')}
          >
            Pending Approvals
            {pendingProperties.length > 0 && (
              <span className="badge">{pendingProperties.length}</span>
            )}
          </button>
          
          <button 
            className={activeSection === 'listings' ? 'active' : ''}
            onClick={() => setActiveSection('listings')}
          >
            All Listings
            {allProperties.length > 0 && (
              <span className="badge">{allProperties.length}</span>
            )}
          </button>
          
          <button 
            className={activeSection === 'users' ? 'active' : ''}
            onClick={() => setActiveSection('users')}
          >
            Users
            {users.length > 0 && (
              <span className="badge">{users.length}</span>
            )}
          </button>
          
          <button 
            className={activeSection === 'payments' ? 'active' : ''}
            onClick={() => setActiveSection('payments')}
          >
            Payment Transactions
            {payments.length > 0 && (
              <span className="badge">{payments.length}</span>
            )}
          </button>
          
          <button 
            className={activeSection === 'refunds' ? 'active' : ''}
            onClick={() => setActiveSection('refunds')}
          >
            Refunds
          </button>
        </div>

        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>
      
      <div className="main-content-wrapper">
        {error && (
          <div className="error-message">
            <FontAwesomeIcon icon={faTimesCircle} color="red" />
            <span>{error}</span>
            <button onClick={() => setError(null)}>×</button>
          </div>
        )}
        
        <div className="main-content">
          {selectedProperty ? (
            renderPropertyDetailView()
          ) : activeSection === "approvals" ? (
            <>
              <h2>Pending Approvals</h2>
              {pendingProperties.length === 0 ? (
                <div className="no-properties">No properties pending approval</div>
              ) : (
                renderPropertiesGrid(pendingProperties)
              )}
            </>
          ) : activeSection === "listings" ? (
            <>
              <h2>All Property Listings</h2>
              {allProperties.length === 0 ? (
                <div className="no-properties">No properties found</div>
              ) : (
                renderPropertiesGrid(allProperties)
              )}
            </>
          ) : activeSection === "users" ? (
            renderUsersList()
          ) : activeSection === "payments" ? (
            loadingPayments ? (
              <div className="loading-container">
                <FontAwesomeIcon icon={faSpinner} spin size="2x" />
                <p>Loading payments...</p>
              </div>
            ) : (
              <AdminPayments 
                payments={payments}
                onViewPaymentDetails={setSelectedPayment}
                selectedPayment={selectedPayment}
              />
            )
          ) : activeSection === "refunds" ? (
            <AdminRefunds />
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
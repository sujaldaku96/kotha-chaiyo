import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import "../styles/MyListings.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faEdit, 
  faTrash, 
  faEye, 
  faTimes, 
  faPlus, 
  faSearch, 
  faHotel, 
  faReceipt,
  faFileInvoiceDollar,
  faBookmark,
  faMoneyBillWave,
  faInfoCircle
} from "@fortawesome/free-solid-svg-icons";
import Layout from "../components/layout.js";
import PaymentDetails from "../components/PaymentDetails";

const MyListings = () => {
  const [myProperties, setMyProperties] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  const [receivedBookings, setReceivedBookings] = useState([]);
  const [canceledBookings, setCanceledBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("listings");
  const [authError, setAuthError] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [selectedRefund, setSelectedRefund] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
    }
  }, [location.state]);

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("token");
      const userEmail = localStorage.getItem("userEmail");
      
      if (!token || !userEmail) {
        setAuthError(true);
        setLoading(false);
        return;
      }

      try {
        const [propertiesResponse, bookingsResponse, receivedBookingsResponse, canceledBookingsResponse] = await Promise.all([
          axios.get(`http://localhost:5000/api/properties/owner/${userEmail}`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get(`http://localhost:5000/api/bookings/user/${userEmail}`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get(`http://localhost:5000/api/bookings/owner/${userEmail}`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get(`http://localhost:5000/api/bookings/canceled/${userEmail}`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        setMyProperties(propertiesResponse.data);
        
        // Filter out cancelled bookings and bookings with deleted properties
        const validBookings = bookingsResponse.data.filter(booking => 
          booking.status !== 'cancelled' && booking.property
        );
        setMyBookings(validBookings);
        
        // Filter out cancelled received bookings and bookings with deleted properties
        const validReceivedBookings = receivedBookingsResponse.data.filter(booking => 
          booking.status !== 'cancelled' && booking.property
        );
        setReceivedBookings(validReceivedBookings);
        setCanceledBookings(canceledBookingsResponse.data);
        
        setLoading(false);
      } catch (err) {
        console.error("Error fetching data:", err);
        if (err.response?.status === 401) {
          setAuthError(true);
        }
        setLoading(false);
      }
    };
    
    fetchData();
  }, [navigate]);

  const handleDeleteProperty = async (id) => {
    try {
      const confirmDelete = window.confirm("Are you sure you want to delete this property?");
      if (!confirmDelete) return;

      await axios.delete(`http://localhost:5000/api/properties/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });

      setMyProperties(myProperties.filter(property => property._id !== id));
    } catch (err) {
      console.error("Error deleting property:", err);
      alert("Failed to delete property. Please try again.");
    }
  };

  const handleCancelBooking = async (bookingId, isOwner = false) => {
    try {
      const confirmCancel = window.confirm(
        isOwner 
          ? "Are you sure you want to cancel this booking? This will notify the tenant."
          : "Are you sure you want to cancel this booking?"
      );
      if (!confirmCancel) return;

      const token = localStorage.getItem("token");
      if (!token) {
        alert("Please log in to cancel bookings");
        return;
      }

      console.log('Attempting to cancel booking:', {
        bookingId,
        isOwner,
        userEmail: localStorage.getItem("userEmail")
      });

      const response = await axios.delete(
        `http://localhost:5000/api/bookings/${bookingId}`, 
        {
          headers: { 
            Authorization: `Bearer ${token}` 
          }
        }
      );

      console.log('Cancel booking response:', response.data);

      if (response.data.success) {
        if (isOwner) {
          setReceivedBookings(prevBookings => 
            prevBookings.filter(booking => booking._id !== bookingId)
          );
        } else {
          setMyBookings(prevBookings => 
            prevBookings.filter(booking => booking._id !== bookingId)
          );
        }
        alert("Booking cancelled successfully");
      } else {
        alert(response.data.message || "Failed to cancel booking");
      }
    } catch (err) {
      console.error("Error cancelling booking:", {
        error: err.message,
        response: err.response?.data,
        status: err.response?.status,
        bookingId,
        isOwner
      });
      
      const errorMessage = err.response?.data?.message || 
                          "Failed to cancel booking. Please try again.";
      alert(errorMessage);
    }
  };

  const handleViewPaymentDetails = (booking) => {
    setSelectedBooking(booking);
  };

  const handleRefund = async (bookingId) => {
    try {
      const confirmRefund = window.confirm(
        "Are you sure you want to process the refund for this booking?"
      );
      if (!confirmRefund) return;

      const token = localStorage.getItem("token");
      if (!token) {
        alert("Please log in to process refunds");
        return;
      }

      const response = await axios.post(
        `http://localhost:5000/api/bookings/refund/${bookingId}`,
        {},
        {
          headers: { 
            Authorization: `Bearer ${token}` 
          }
        }
      );

      if (response.data.success && response.data.refund_url) {
        window.location.href = response.data.refund_url;
      } else {
        alert(response.data.message || "Failed to initiate refund");
      }
    } catch (err) {
      console.error("Error processing refund:", err);
      alert(err.response?.data?.message || "Failed to process refund. Please try again.");
    }
  };

  const handleRequestRefund = async (booking) => {
    try {
      const confirmRequest = window.confirm(
        "Are you sure you want to request a refund for this booking?"
      );
      if (!confirmRequest) return;

      const token = localStorage.getItem("token");
      if (!token) {
        alert("Please log in to request refunds");
        return;
      }

      const response = await axios.post(
        `http://localhost:5000/api/bookings/request-refund/${booking._id}`,
        {},
        {
          headers: { 
            Authorization: `Bearer ${token}` 
          }
        }
      );

      if (response.data.success) {
        alert("Refund request sent successfully to the property owner");
      } else {
        alert(response.data.message || "Failed to send refund request");
      }
    } catch (err) {
      console.error("Error requesting refund:", err);
      alert(err.response?.data?.message || "Failed to send refund request. Please try again.");
    }
  };

  const handleViewRefundDetails = (booking) => {
    setSelectedRefund(booking);
  };

  const handleCloseRefundDetails = () => {
    setSelectedRefund(null);
  };

  if (loading) {
    return (
      <div className="my-listings-container">
        <div className="loading-spinner"></div>
        <p>Loading your listings and bookings...</p>
      </div>
    );
  }

  if (authError) {
    return (
      <div className="my-listings-container">
        <div className="auth-error">
          <h2>Authentication Required</h2>
          <p>Please log in to view your listings and bookings.</p>
          <button 
            className="primary-btn"
            onClick={() => {
              localStorage.removeItem("token");
              localStorage.removeItem("user");
              localStorage.removeItem("role");
              localStorage.removeItem("userEmail");
              navigate("/login");
            }}
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <Layout>
      <div className="my-listings-container">
        <div className="tabs">
          <button 
            className={`tab-button ${activeTab === 'listings' ? 'active' : ''}`}
            onClick={() => setActiveTab('listings')}
          >
            <FontAwesomeIcon icon={faHotel} /> My Listings
            {myProperties.length > 0 && (
              <span className="count-badge">{myProperties.length}</span>
            )}
          </button>
          <button 
            className={`tab-button ${activeTab === 'bookings' ? 'active' : ''}`}
            onClick={() => setActiveTab('bookings')}
          >
            <FontAwesomeIcon icon={faReceipt} /> My Bookings
            {myBookings.length > 0 && (
              <span className="count-badge">{myBookings.length}</span>
            )}
          </button>
          <button 
            className={`tab-button ${activeTab === 'received' ? 'active' : ''}`}
            onClick={() => setActiveTab('received')}
          >
            <FontAwesomeIcon icon={faBookmark} /> Received Bookings
            {receivedBookings.length > 0 && (
              <span className="count-badge">{receivedBookings.length}</span>
            )}
          </button>
          <button 
            className={`tab-button ${activeTab === 'canceled' ? 'active' : ''}`}
            onClick={() => setActiveTab('canceled')}
          >
            <FontAwesomeIcon icon={faTimes} /> Canceled Bookings
            {canceledBookings.length > 0 && (
              <span className="count-badge">{canceledBookings.length}</span>
            )}
          </button>
        </div>

        {activeTab === 'listings' ? (
          <div className="listings-section">
            <div className="section-header">
              <h2>My Property Listings</h2>
              <button 
                className="primary-btn"
                onClick={() => navigate("/add-property")}
              >
                <FontAwesomeIcon icon={faPlus} /> Add New Property
              </button>
            </div>

            {myProperties.length === 0 ? (
              <div className="empty-state">
                <FontAwesomeIcon icon={faHotel} size="3x" />
                <h3>No Properties Listed</h3>
                <p>You haven't listed any properties yet. Start earning by adding your first property!</p>
                <button 
                  className="primary-btn"
                  onClick={() => navigate("/add-property")}
                >
                  <FontAwesomeIcon icon={faPlus} /> List a Property
                </button>
              </div>
            ) : (
              <div className="properties-grid">
                {myProperties.map((property) => (
                  <div key={property._id} className="myl-property-card">
                    <div 
                      className="myl-property-image"
                      onClick={() => navigate(`/property-details/${property._id}`)}
                    >
                      <div className="property-image">
                        {property.images?.[0] ? (
                          <img
                            src={`http://localhost:5000/uploads/${property.images[0]}`}
                            alt={property.title}
                          />
                        ) : (
                          <div className="no-image">No Image Available</div>
                        )}
                        <div className="myl-status-badges">
                          {property.approved ? (
                            <div className="status-badge approved">Approved</div>
                          ) : (
                            <div className="status-badge pending">Pending</div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="property-info">
                      <h3 onClick={() => navigate(`/property-details/${property._id}`)}>
                        {property.title}
                      </h3>
                      <div className="price">Rs {property.price?.toLocaleString()}</div>
                      <div className="location">
                        {property.location?.city}, {property.location?.address}
                      </div>
                      <div className="property-meta">
                        <span>{property.rooms?.bedrooms || 0} Beds</span>
                        <span>{property.rooms?.bathrooms || 0} Baths</span>
                      </div>
                      <div className="property-booking-status-text" style={{marginTop: '0.5rem', color: '#888', fontSize: '0.95rem'}}>
                        Status: {property.bookingStatus === 'booked' ? 'Booked' : 'Available'}
                      </div>
                    </div>

                    <div className="property-actions">
                      <button 
                        className="action-btn edit"
                        onClick={() => navigate(`/edit-property/${property._id}`)}
                      >
                        <FontAwesomeIcon icon={faEdit} /> Edit
                      </button>
                      <button 
                        className="action-btn delete"
                        onClick={() => handleDeleteProperty(property._id)}
                      >
                        <FontAwesomeIcon icon={faTrash} /> Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : activeTab === 'bookings' ? (
          <div className="bookings-section">
            <h2>My Bookings</h2>

            {myBookings.length === 0 ? (
              <div className="empty-state">
                <FontAwesomeIcon icon={faReceipt} size="3x" />
                <h3>No Bookings Found</h3>
                <p>You haven't booked any properties yet. Explore our listings to find your perfect stay!</p>
                <button 
                  className="primary-btn"
                  onClick={() => navigate("/property-listing")}
                >
                  <FontAwesomeIcon icon={faSearch} /> Browse Properties
                </button>
              </div>
            ) : (
              <div className="bookings-grid">
                {myBookings.map((booking) => (
                  <div key={booking._id} className="myl-booking-card">
                    <div 
                      className="myl-booking-image"
                      onClick={() => navigate(`/property-details/${booking.property?._id}`)}
                    >
                      {booking.property?.images?.[0] ? (
                        <img
                          src={`http://localhost:5000/uploads/${booking.property.images[0]}`}
                          alt={booking.property.title || "Property"}
                        />
                      ) : (
                        <div className="no-image">No Image Available</div>
                      )}
                      <div className={`status-badge ${booking.status?.toLowerCase() || 'pending'}`}>
                        {booking.status || 'Pending'}
                      </div>
                    </div>

                    <div className="booking-info">
                      <h3 onClick={() => navigate(`/property-details/${booking.property?._id}`)}>
                        {booking.property?.title || "Unknown Property"}
                      </h3>
                      <div className="price">
                        Rs {booking.amount?.toLocaleString() || booking.property?.price?.toLocaleString() || "0"}
                      </div>
                      <div className="dates">
                        {new Date(booking.check_in).toLocaleDateString()} - {new Date(booking.check_out).toLocaleDateString()}
                      </div>
                      <div className="payment-method">
                        {booking.paymentDetails?.method ? `Paid via: ${booking.paymentDetails.method}` : 'Payment pending'}
                      </div>
                    </div>

                    <div className="booking-actions">
                      <button
                        className="action-btn view"
                        onClick={() => navigate(`/property-details/${booking.property?._id}`)}
                      >
                        <FontAwesomeIcon icon={faEye} /> View
                      </button>
                      {booking.status === "paid" && (
                        <>
                          <button
                            className="action-btn payment"
                            onClick={() => handleViewPaymentDetails(booking)}
                          >
                            <FontAwesomeIcon icon={faFileInvoiceDollar} /> Payment Details
                          </button>
                          <button
                            className="action-btn cancel"
                            onClick={() => handleCancelBooking(booking._id)}
                          >
                            <FontAwesomeIcon icon={faTimes} /> Cancel
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : activeTab === 'received' ? (
          <div className="bookings-section">
            <h2>Received Bookings</h2>

            {receivedBookings.length === 0 ? (
              <div className="empty-state">
                <FontAwesomeIcon icon={faBookmark} size="3x" />
                <h3>No Bookings Received</h3>
                <p>You haven't received any bookings for your properties yet.</p>
              </div>
            ) : (
              <div className="bookings-grid">
                {receivedBookings.map((booking) => {
                  const isOwner = booking.property?.contactInfo?.ownerEmail === localStorage.getItem("userEmail");
                  return (
                    <div key={booking._id} className="myl-booking-card">
                      <div 
                        className="myl-booking-image"
                        onClick={() => navigate(`/property-details/${booking.property?._id}`)}
                      >
                        {booking.property?.images?.[0] ? (
                          <img
                            src={`http://localhost:5000/uploads/${booking.property.images[0]}`}
                            alt={booking.property.title || "Property"}
                          />
                        ) : (
                          <div className="no-image">No Image Available</div>
                        )}
                        <div className={`status-badge ${booking.status?.toLowerCase() || 'pending'}`}>
                          {booking.status || 'Pending'}
                        </div>
                      </div>

                      <div className="booking-info">
                        <h3 onClick={() => navigate(`/property-details/${booking.property?._id}`)}>
                          {booking.property?.title || "Unknown Property"}
                        </h3>
                        <div className="price">
                          Rs {booking.amount?.toLocaleString() || booking.property?.price?.toLocaleString() || "0"}
                        </div>
                        <div className="dates">
                          {new Date(booking.check_in).toLocaleDateString()} - {new Date(booking.check_out).toLocaleDateString()}
                        </div>
                        <div className="tenant-info">
                          <strong>Booked by:</strong> {booking.user?.firstName} {booking.user?.lastName}
                        </div>
                        <div className="payment-method">
                          {booking.paymentDetails?.method ? `Paid via: ${booking.paymentDetails.method}` : 'Payment pending'}
                        </div>
                      </div>

                      <div className="booking-actions">
                        <button
                          className="action-btn view"
                          onClick={() => navigate(`/property-details/${booking.property?._id}`)}
                        >
                          <FontAwesomeIcon icon={faEye} /> View Property
                        </button>
                        {booking.status === "paid" && (
                          <>
                            <button
                              className="action-btn payment"
                              onClick={() => handleViewPaymentDetails(booking)}
                            >
                              <FontAwesomeIcon icon={faFileInvoiceDollar} /> Payment Details
                            </button>
                            <button
                              className="action-btn cancel"
                              onClick={() => handleCancelBooking(booking._id, true)}
                            >
                              <FontAwesomeIcon icon={faTimes} /> Cancel Booking
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="bookings-section">
            <h2>Canceled Bookings</h2>

            {canceledBookings.length === 0 ? (
              <div className="empty-state">
                <FontAwesomeIcon icon={faTimes} size="3x" />
                <h3>No Canceled Bookings</h3>
                <p>You don't have any canceled bookings.</p>
              </div>
            ) : (
              <div className="bookings-grid">
                {canceledBookings.map((booking) => {
                  const isOwner = booking.property?.contactInfo?.ownerEmail === localStorage.getItem("userEmail");
                  return (
                    <div key={booking._id} className="myl-booking-card">
                      <div 
                        className="myl-booking-image"
                        onClick={() => navigate(`/property-details/${booking.property?._id}`)}
                      >
                        {booking.property?.images?.[0] ? (
                          <img
                            src={`http://localhost:5000/uploads/${booking.property.images[0]}`}
                            alt={booking.property.title || "Property"}
                          />
                        ) : (
                          <div className="no-image">No Image Available</div>
                        )}
                        <div className={`status-badge ${booking.paymentDetails?.paymentStatus || 'pending'}`}>
                          {booking.paymentDetails?.paymentStatus === 'refunded' ? 'Refunded' : 'Pending Refund'}
                        </div>
                      </div>

                      <div className="booking-info">
                        <h3 onClick={() => navigate(`/property-details/${booking.property?._id}`)}>
                          {booking.property?.title || "Unknown Property"}
                        </h3>
                        <div className="price">
                          Rs {booking.amount?.toLocaleString() || "0"}
                        </div>
                        <div className="dates">
                          {new Date(booking.check_in).toLocaleDateString()} - {new Date(booking.check_out).toLocaleDateString()}
                        </div>
                        {isOwner ? (
                          <div className="tenant-info">
                            <strong>Booked by:</strong> {booking.user?.firstName} {booking.user?.lastName}
                            <br />
                            <strong>Email:</strong> {booking.user?.email}
                          </div>
                        ) : (
                          <div className="owner-info">
                            <strong>Property Owner:</strong> {booking.property?.contactInfo?.ownerName}
                            <br />
                            <strong>Email:</strong> {booking.property?.contactInfo?.ownerEmail}
                          </div>
                        )}
                        <div className="payment-method">
                          {booking.paymentDetails?.method ? `Paid via: ${booking.paymentDetails.method}` : 'Payment pending'}
                        </div>
                        {booking.paymentDetails?.paymentStatus === 'refunded' && (
                          <div className="refund-details">
                            <div className="refund-date">
                              Refunded on: {booking.paymentDetails?.refundedAt ? new Date(booking.paymentDetails.refundedAt).toLocaleString() : 'N/A'}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="booking-actions">
                        <button
                          className="action-btn view"
                          onClick={() => navigate(`/property-details/${booking.property?._id}`)}
                        >
                          <FontAwesomeIcon icon={faEye} /> View Property
                        </button>
                        {booking.paymentDetails?.paymentStatus === 'refunded' && (
                          <button
                            className="action-btn details"
                            onClick={() => handleViewRefundDetails(booking)}
                          >
                            <FontAwesomeIcon icon={faInfoCircle} /> Details
                          </button>
                        )}
                        {isOwner && booking.paymentDetails?.paymentStatus !== 'refunded' && (
                          <button
                            className="action-btn refund"
                            onClick={() => handleRefund(booking._id)}
                          >
                            <FontAwesomeIcon icon={faMoneyBillWave} /> Process Refund
                          </button>
                        )}
                        {!isOwner && booking.paymentDetails?.paymentStatus !== 'refunded' && (
                          <button
                            className="action-btn request-refund"
                            onClick={() => handleRequestRefund(booking)}
                          >
                            <FontAwesomeIcon icon={faMoneyBillWave} /> Request Refund
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {selectedBooking && (
        <PaymentDetails 
          booking={selectedBooking} 
          onClose={() => setSelectedBooking(null)} 
        />
      )}

      {selectedRefund && (
        <div className="refund-details-modal">
          <div className="modal-content">
            <button className="close-modal" onClick={handleCloseRefundDetails}>×</button>
            <h3>Refund Details</h3>
            <div className="details-grid">
              <div className="detail-item">
                <label>Property:</label>
                <span>{selectedRefund.property?.title}</span>
              </div>
              <div className="detail-item">
                <label>Location:</label>
                <span>{selectedRefund.property?.location?.city}</span>
              </div>
              <div className="detail-item">
                <label>Renter:</label>
                <span>{`${selectedRefund.user?.firstName} ${selectedRefund.user?.lastName}`}</span>
              </div>
              <div className="detail-item">
                <label>Renter Email:</label>
                <span>{selectedRefund.userEmail || selectedRefund.user?.email}</span>
              </div>
              <div className="detail-item">
                <label>Property Owner:</label>
                <span>{selectedRefund.paymentDetails?.receiverDetails?.name || selectedRefund.property?.contactInfo?.ownerName || 'N/A'}</span>
              </div>
              <div className="detail-item">
                <label>Owner Email:</label>
                <span>{selectedRefund.paymentDetails?.receiverDetails?.email || selectedRefund.property?.contactInfo?.ownerEmail || 'N/A'}</span>
              </div>
              <div className="detail-item">
                <label>Amount:</label>
                <span>Rs {selectedRefund.amount?.toLocaleString()}</span>
              </div>
              <div className="detail-item">
                <label>Payment Method:</label>
                <span>{selectedRefund.paymentDetails?.method?.toUpperCase()}</span>
              </div>
              <div className="detail-item">
                <label>Transaction ID:</label>
                <span>{selectedRefund.paymentDetails?.transactionId || selectedRefund.paymentDetails?.khaltiData?.transaction_id || 'N/A'}</span>
              </div>
              <div className="detail-item">
                <label>Refund Date:</label>
                <span>{selectedRefund.paymentDetails?.refundedAt ? new Date(selectedRefund.paymentDetails.refundedAt).toLocaleString() : 'N/A'}</span>
              </div>
              <div className="detail-item">
                <label>Refund Status:</label>
                <span>{selectedRefund.paymentDetails?.paymentStatus === 'refunded' ? 'Refunded' : 'Pending'}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default MyListings;
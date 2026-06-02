import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import '../styles/AdminRefunds.css';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

const AdminRefunds = () => {
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRefund, setSelectedRefund] = useState(null);

  useEffect(() => {
    fetchRefunds();
  }, []);

  const fetchRefunds = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/api/bookings/admin/canceled-refunds`, {
        headers: { 
          'x-auth-token': token,
          'Content-Type': 'application/json'
        }
      });

      console.log('Refunds data:', response.data.bookings);
      
      setRefunds(response.data.bookings);
    } catch (err) {
      console.error('Error fetching refunds:', err);
      setError(err.response?.data?.message || 'Failed to fetch refunds');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/A';
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (err) {
      console.error('Error formatting date:', err);
      return 'N/A';
    }
  };

  const handleViewDetails = (refund) => {
    console.log('Selected refund details:', refund);
    setSelectedRefund(refund);
  };

  const handleCloseDetails = () => {
    setSelectedRefund(null);
  };

  if (loading) {
    return (
      <div className="admin-refunds-loading">
        <FontAwesomeIcon icon={faSpinner} spin size="2x" />
        <p>Loading refund information...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-refunds-error">
        <p>{error}</p>
      </div>
    );
  }

  const refundedCount = refunds.filter(r => r.paymentDetails?.paymentStatus === 'refunded').length;
  const pendingCount = refunds.filter(r => r.paymentDetails?.paymentStatus !== 'refunded').length;

  return (
    <div className="admin-refunds-container">
      <h2>Refunds & Cancellations</h2>
      {refunds.length === 0 ? (
        <div className="no-refunds">
          <p>No refunds or cancellations found</p>
        </div>
      ) : (
        <>
          <div className="refunds-summary">
            <div className="summary-card">
              <h3>Total Cancellations</h3>
              <p>{refunds.length}</p>
            </div>
            <div className="summary-card">
              <h3>Refunded</h3>
              <p>{refundedCount}</p>
            </div>
            <div className="summary-card">
              <h3>Pending Refunds</h3>
              <p>{pendingCount}</p>
            </div>
          </div>

          <div className="refunds-table-container">
            <table className="refunds-table">
              <thead>
                <tr>
                  <th>Property</th>
                  <th>User</th>
                  <th>Amount</th>
                  <th>Refunded On</th>
                  <th>Refund Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {refunds.map((refund) => (
                  <tr key={refund._id}>
                    <td>{refund.property?.title || 'N/A'}</td>
                    <td>{refund.user ? `${refund.user.firstName || ''} ${refund.user.lastName || ''}` : 'N/A'}</td>
                    <td>Rs {refund.amount?.toLocaleString() || '0'}</td>
                    <td>{formatDate(refund.paymentDetails?.refundedAt)}</td>
                    <td>{refund.paymentDetails?.paymentStatus === 'refunded' ? 'Refunded' : 'Pending'}</td>
                    <td>
                      <button 
                        className="view-details-btn"
                        onClick={() => handleViewDetails(refund)}
                      >
                        <FontAwesomeIcon icon={faInfoCircle} /> Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {selectedRefund && (
        <div className="refund-details-modal">
          <div className="modal-content">
            <button className="close-modal" onClick={handleCloseDetails}>×</button>
            <h3>Refund Details</h3>
            <div className="details-grid">
              <div className="detail-item">
                <label>Property:</label>
                <span>{selectedRefund.property?.title || 'N/A'}</span>
              </div>
              <div className="detail-item">
                <label>Location:</label>
                <span>{selectedRefund.property?.location?.city || 'N/A'}</span>
              </div>
              <div className="detail-item">
                <label>Renter:</label>
                <span>{selectedRefund.user ? `${selectedRefund.user.firstName || ''} ${selectedRefund.user.lastName || ''}` : 'N/A'}</span>
              </div>
              <div className="detail-item">
                <label>Renter Email:</label>
                <span>{selectedRefund.userEmail || selectedRefund.user?.email || 'N/A'}</span>
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
                <span>Rs {selectedRefund.amount?.toLocaleString() || '0'}</span>
              </div>
              <div className="detail-item">
                <label>Payment Method:</label>
                <span>{selectedRefund.paymentDetails?.method || 'Khalti'}</span>
              </div>
              <div className="detail-item">
                <label>Transaction ID:</label>
                <span>{selectedRefund.paymentDetails?.transactionId || selectedRefund.paymentDetails?.khaltiData?.transaction_id || 'N/A'}</span>
              </div>
              <div className="detail-item">
                <label>Refund Date:</label>
                <span>{formatDate(selectedRefund.paymentDetails?.refundedAt)}</span>
              </div>
              <div className="detail-item">
                <label>Refund Status:</label>
                <span>{selectedRefund.paymentDetails?.paymentStatus === 'refunded' ? 'Refunded' : 'Pending'}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminRefunds; 
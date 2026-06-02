import React from 'react';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes, faReceipt, faUser, faEnvelope, faClock, faCheckCircle } from "@fortawesome/free-solid-svg-icons";
import '../styles/PaymentDetails.css';

const PaymentDetails = ({ booking, onClose }) => {
  if (!booking || !booking.paymentDetails) {
    return null;
  }

  const {
    amount,
    paymentDetails,
    check_in,
    check_out,
    property,
    user
  } = booking;

  return (
    <div className="payment-details-overlay">
      <div className="payment-details-modal">
        <button className="close-btn" onClick={onClose}>
          <FontAwesomeIcon icon={faTimes} />
        </button>

        <div className="payment-details-header">
          <FontAwesomeIcon icon={faReceipt} className="receipt-icon" />
          <h2>Payment Details</h2>
        </div>

        <div className="payment-section">
          <h3>Property Information</h3>
          <p className="property-title">{property?.title}</p>
          <div className="date-range">
            <p>Check-in: {new Date(check_in).toLocaleDateString()}</p>
            <p>Check-out: {new Date(check_out).toLocaleDateString()}</p>
          </div>
        </div>

        <div className="payment-section">
          <h3>Transaction Details</h3>
          <div className="transaction-info">
            <p><strong>Amount Paid:</strong> Rs {amount?.toLocaleString()}</p>
            <p><strong>Payment Method:</strong> {paymentDetails.method?.toUpperCase()}</p>
            <p><strong>Transaction ID:</strong> {paymentDetails.transactionId}</p>
            <p>
              <strong>Status:</strong> 
              <span className={`status ${paymentDetails.paymentStatus}`}>
                <FontAwesomeIcon icon={faCheckCircle} /> {paymentDetails.paymentStatus}
              </span>
            </p>
            <p><strong>Payment Date:</strong> {new Date(paymentDetails.paymentTimestamp).toLocaleString()}</p>
          </div>
        </div>

        <div className="payment-section">
          <h3>Payment Parties</h3>
          <div className="parties-info">
            <div className="user-details">
              <h4>Paid By</h4>
              <p>
                <FontAwesomeIcon icon={faUser} />
                {paymentDetails.payerDetails?.name}
              </p>
              <p>
                <FontAwesomeIcon icon={faEnvelope} />
                {paymentDetails.payerDetails?.email}
              </p>
            </div>
            
            <div className="user-details">
              <h4>Paid To</h4>
              <p>
                <FontAwesomeIcon icon={faUser} />
                {paymentDetails.receiverDetails?.name}
              </p>
              <p>
                <FontAwesomeIcon icon={faEnvelope} />
                {paymentDetails.receiverDetails?.email}
              </p>
            </div>
          </div>
        </div>

        <div className="payment-section">
          <h3>Additional Information</h3>
          <div className="additional-info">
            <p>
              <FontAwesomeIcon icon={faClock} />
              Payment processed on {new Date(paymentDetails.paymentTimestamp).toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentDetails; 
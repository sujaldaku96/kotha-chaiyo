import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import '../styles/PaymentFailed.css';

const PaymentFailed = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const reason = searchParams.get('reason');
  const navigate = useNavigate();
  
  const errorMessages = {
    'payment_not_completed': 'The payment was not completed successfully.',
    'booking_not_found': 'We couldn\'t find your booking record.',
    'verification_failed': 'Payment verification failed.',
    'server_error': 'A server error occurred during payment processing.',
    'default': 'The payment process failed. Please try again.'
  };

  return (
    <div className="payment-failed-container">
      <div className="payment-failed-box">
        <div className="error-icon">
          <FontAwesomeIcon icon={faTimes} />
        </div>
        <h2>Payment Failed</h2>
        <p className="error-message">{errorMessages[reason] || errorMessages['default']}</p>
        <div className="troubleshooting-tips">
          <h3>What can you do?</h3>
          <ul className="tips-list">
            <li>Check your internet connection and try again</li>
            <li>Verify your payment details are correct</li>
            <li>Contact support if the problem persists</li>
          </ul>
        </div>
        <div className="action-buttons">
          <button 
            className="primary-button"
            onClick={() => navigate('/my-listings?tab=bookings')}
          >
            Back to My Bookings
          </button>
          <button 
            className="secondary-button"
            onClick={() => navigate('/')}
          >
            Return to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentFailed;
import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheckCircle } from "@fortawesome/free-solid-svg-icons";
import axios from 'axios';
import '../styles/PaymentSuccess.css';

const PaymentSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const pidx = searchParams.get('pidx');
  const bookingId = searchParams.get('bookingId');

  useEffect(() => {
    const verifyPayment = async (attempt = 1) => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        console.log(`Verifying payment (attempt ${attempt}) with:`, { pidx, bookingId });
        
        const response = await axios.get(
          `${process.env.REACT_APP_BACKEND_URL}/api/bookings/verify-payment/${pidx}`,
          { 
            params: { bookingId },
            headers: {
              'x-auth-token': token,
              'Content-Type': 'application/json'
            },
            timeout: 10000
          }
        );
        
        console.log('Verification response:', response.data);

        if (response.data.success) {
          navigate('/my-listings', {
            state: { 
              paymentSuccess: true,
              activeTab: 'bookings'
            }
          });
          return;
        }

        if (attempt < 3) {
          setTimeout(() => verifyPayment(attempt + 1), 2000);
        } else {
          navigate(`/payment-failed?reason=${response.data.message || 'verification_failed'}`);
        }
      } catch (error) {
        console.error('Payment verification error:', error);

        if (error.response?.status === 404) {
          try {
            const bookingResponse = await axios.get(
              `${process.env.REACT_APP_BACKEND_URL}/api/bookings/verify/${bookingId}`,
              {
                headers: {
                  'x-auth-token': localStorage.getItem('token'),
                  'Content-Type': 'application/json'
                }
              }
            );
            
            if (bookingResponse.data.verified) {
              navigate('/my-listings', {
                state: { 
                  paymentSuccess: true,
                  activeTab: 'bookings'
                }
              });
              return;
            }
          } catch (err) {
            console.error('Booking verification error:', err);
          }
        }

        if (attempt < 3) {
          setTimeout(() => verifyPayment(attempt + 1), 2000);
        } else {
          navigate(`/payment-failed?reason=${error.response?.data?.message || 'server_error'}`);
        }
      }
    };

    if (pidx && bookingId) {
      setTimeout(() => verifyPayment(), 2000);
    } else {
      navigate('/payment-failed?reason=missing_parameters');
    }
  }, [pidx, bookingId, navigate]);

  return (
    <div className="payment-success-container">
      <div className="payment-success-box">
        <div className="success-icon">
          <FontAwesomeIcon icon={faCheckCircle} />
        </div>
        <h2>Payment Successful!</h2>
        <p>Your booking is being confirmed...</p>
        <p>Please wait while we process your payment.</p>
        <div className="action-buttons">
          <button 
            className="primary-button"
            disabled
          >
            Processing...
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
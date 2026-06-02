import React, { useState } from 'react';
import axios from 'axios';

const KhaltiPayment = ({ property, user, onClose, onError }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [rentalPeriod, setRentalPeriod] = useState({
    startDate: '',
    endDate: '',
  });
  const [calculatedAmount, setCalculatedAmount] = useState(0);

  const calculateMonths = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Calculate months difference
    const months = (end.getFullYear() - start.getFullYear()) * 12 + 
                  (end.getMonth() - start.getMonth());
    
    // Only count full months
    return Math.max(1, months);
  };

  const handleDateChange = (e) => {
    const { name, value } = e.target;
    setRentalPeriod(prev => {
      const newDates = { ...prev, [name]: value };
      
      if (newDates.startDate && newDates.endDate) {
        const months = calculateMonths(newDates.startDate, newDates.endDate);
        setCalculatedAmount(property.price * months);
      }
      
      return newDates;
    });
  };

  const initiateKhaltiPayment = async () => {
    setLoading(true);
    setError('');
    
    try {
      if (!rentalPeriod.startDate || !rentalPeriod.endDate) {
        throw new Error('Please select rental period dates');
      }

      if (calculatedAmount <= 0) {
        throw new Error('Invalid rental period');
      }

      const response = await axios.post(
      `${process.env.REACT_APP_BACKEND_URL}/api/bookings/khalti/initiate`,
      {
        property: { _id: property._id },
        check_in: rentalPeriod.startDate,
        check_out: rentalPeriod.endDate,
        amount: calculatedAmount
      },
      {
        headers: {
          'x-auth-token': localStorage.getItem('token'),
          'Content-Type': 'application/json'
        }
      }
    );

      // Redirect to Khalti payment page
      window.location.href = response.data.payment_url;

    } catch (err) {
      console.error('Payment error:', err);
      setError(err.response?.data?.message || err.message || 'Payment initiation failed');
      setLoading(false);
    }
  };

  return (
    <div className="payment-modal">
      <div className="payment-content">
        <button className="close-btn" onClick={onClose}>&times;</button>
        <h3>Complete Rental Payment via Khalti</h3>
        
        <div className="rental-details">
          <div className="form-group">
            <label>Rental Start Date</label>
            <input
              type="date"
              name="startDate"
              value={rentalPeriod.startDate}
              onChange={handleDateChange}
              min={new Date().toISOString().split('T')[0]}
              required
            />
          </div>
          
          <div className="form-group">
            <label>Rental End Date</label>
            <input
              type="date"
              name="endDate"
              value={rentalPeriod.endDate}
              onChange={handleDateChange}
              min={rentalPeriod.startDate || new Date().toISOString().split('T')[0]}
              required
            />
          </div>

          {calculatedAmount > 0 && (
            <div className="price-summary">
              <p>Total for {calculateMonths(rentalPeriod.startDate, rentalPeriod.endDate)} months:</p>
              <h4>Rs. {calculatedAmount.toLocaleString()}</h4>
              <p className="note">(Monthly rent: Rs. {property.price.toLocaleString()})</p>
            </div>
          )}
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        <button 
          onClick={initiateKhaltiPayment} 
          className="pay-now-btn"
          disabled={loading || !rentalPeriod.startDate || !rentalPeriod.endDate}
        >
          {loading ? 'Processing...' : 'Proceed to Khalti'}
        </button>
      </div>
    </div>
  );
};

export default KhaltiPayment;
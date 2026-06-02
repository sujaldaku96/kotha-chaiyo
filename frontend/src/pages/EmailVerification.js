import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import '../styles/EmailVerification.css';

const EmailVerification = () => {
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;

  const handleVerification = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post('http://localhost:5000/api/auth/verify-email', {
        email,
        verificationCode
      });

      if (response.data.success) {
        localStorage.setItem('user', JSON.stringify(response.data.user));
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('role', response.data.user.role);
        localStorage.setItem('userEmail', response.data.user.email);

        navigate('/home');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setError('');
    setLoading(true);

    try {
      await axios.post('http://localhost:5000/api/auth/resend-verification', { email });
      alert('A new verification code has been sent to your email');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend verification code');
    } finally {
      setLoading(false);
    }
  };

  if (!email) {
    return <div>Invalid access. Please sign up first.</div>;
  }

  return (
    <div className="verification-container">
      <div className="verification-box">
        <h2>Email Verification</h2>
        <p className="verification-info">
          We've sent a verification code to <strong>{email}</strong>
        </p>
        
        <form onSubmit={handleVerification}>
          <input
            type="text"
            placeholder="Enter verification code"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value.toUpperCase())}
            maxLength={6}
            required
          />
          
          <button 
            type="submit" 
            className="verify-button"
            disabled={loading}
          >
            {loading ? 'Verifying...' : 'Verify Email'}
          </button>
        </form>

        {error && <div className="error-message">{error}</div>}

        <p className="resend-text">
          Didn't receive the code?{' '}
          <span onClick={handleResendCode} className="resend-link">
            Resend Code
          </span>
        </p>
      </div>
    </div>
  );
};

export default EmailVerification; 
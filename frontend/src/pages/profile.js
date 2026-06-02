import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faCheckCircle, faTimesCircle } from '@fortawesome/free-solid-svg-icons';
import "../styles/profile.css";
import Layout from "../components/layout.js";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

function Profile() {
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: ''
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccessMessage(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const res = await axios.get(`${API_BASE_URL}/api/profile`, {
        headers: { 
          'x-auth-token': token,
          'Content-Type': 'application/json'
        }
      });
      
      setUser(res.data);
      setFormData({
        firstName: res.data.firstName,
        lastName: res.data.lastName,
        email: res.data.email
      });
      
      localStorage.setItem('user', JSON.stringify({
        id: res.data._id,
        role: res.data.role,
        email: res.data.email,
        firstName: res.data.firstName,
        lastName: res.data.lastName
      }));
    } catch (err) {
      console.error('Profile fetch error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load profile');
      
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
    setError(null);
    setSuccessMessage(null);
  };

  const handleChange = e => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handlePasswordChange = e => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      setError(null);
      const token = localStorage.getItem('token');
      
      const response = await axios.put(
        `${API_BASE_URL}/api/profile`, 
        formData, 
        {
          headers: { 
            'x-auth-token': token,
            'Content-Type': 'application/json'
          }
        }
      );
      
      setIsEditing(false);
      setSuccessMessage('Profile updated successfully!');
      setUser(response.data.user);

      localStorage.setItem('user', JSON.stringify({
        id: response.data.user._id,
        role: response.data.user.role,
        email: response.data.user.email,
        firstName: response.data.user.firstName,
        lastName: response.data.user.lastName
      }));
    } catch (err) {
      console.error('Update error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to update profile');
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  };

  const handlePasswordSubmit = async e => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      setError(null);
      setSuccessMessage(null);
      
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        setError("New passwords don't match!");
        return;
      }
  
      if (passwordData.newPassword.length < 6) {
        setError("Password must be at least 6 characters");
        return;
      }
  
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `${API_BASE_URL}/api/profile/password`, 
        {
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        }, 
        {
          headers: { 
            'x-auth-token': token,
            'Content-Type': 'application/json'
          }
        }
      );

      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      setSuccessMessage('Password updated successfully!');
      setUser(response.data.user);

      localStorage.setItem('user', JSON.stringify({
        id: response.data.user._id,
        role: response.data.user.role,
        email: response.data.user.email,
        firstName: response.data.user.firstName,
        lastName: response.data.user.lastName
      }));
    } catch (err) {
      console.error('Password update error:', err);

      if (err.response?.data?.field === 'currentPassword') {
        setError('Current password is incorrect');
      } else if (err.response?.data?.field === 'newPassword') {
        setError('New password must be at least 6 characters');
      } else {
        setError(err.response?.data?.message || err.message || 'Failed to update password');
      }
    } finally {
      setIsSubmitting(false);
      setTimeout(() => {
        setSuccessMessage(null);
        setError(null);
      }, 3000);
    }
  };

  if (loading) return (
    <div className="loading-container">
      <FontAwesomeIcon icon={faSpinner} spin size="2x" />
      <p>Loading your profile...</p>
    </div>
  );

  return (
    <Layout>
    <div className="profile-container">
      {successMessage && (
        <div className="success-message">
          <FontAwesomeIcon icon={faCheckCircle} color="green" />
          <span>{successMessage}</span>
        </div>
      )}

      <div className="profile-header">
        <h1>Profile</h1>
        {activeTab === 'profile' && (
          <button 
            onClick={handleEditToggle} 
            className="edit-btn"
            disabled={isSubmitting}
          >
            {isEditing ? 'Cancel' : 'Edit Profile'}
          </button>
        )}
      </div>

      <div className="tabs">
        <button 
          className={activeTab === 'profile' ? 'active' : ''}
          onClick={() => setActiveTab('profile')}
          disabled={isSubmitting}
        >
          Profile Info
        </button>
        <button 
          className={activeTab === 'password' ? 'active' : ''}
          onClick={() => setActiveTab('password')}
          disabled={isSubmitting}
        >
          Change Password
        </button>
      </div>

      {activeTab === 'profile' ? (
        <div className="profile-info">
          {isEditing ? (
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>First Name</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  disabled={isSubmitting}
                />
              </div>
              <div className="form-group">
                <label>Last Name</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  disabled={isSubmitting}
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  disabled={isSubmitting}
                />
              </div>
              <button 
                type="submit" 
                className="save-btn"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <FontAwesomeIcon icon={faSpinner} spin />
                ) : (
                  'Save Changes'
                )}
              </button>
            </form>
          ) : (
            <div className="profile-details">
              <p><strong>Name:</strong> {user.firstName} {user.lastName}</p>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Role:</strong> {user.role}</p>
            </div>
          )}
        </div>
      ) : (
        <div className="password-change">
        {/* {successMessage && activeTab === 'password' && (
          <div className="success-message">
            <FontAwesomeIcon icon={faCheckCircle} color="green" />
            <span>{successMessage}</span>
          </div>
        )}
        {error && activeTab === 'password' && (
          <div className="error-message">
            <FontAwesomeIcon icon={faTimesCircle} color="red" />
            <span>{error}</span>
          </div>
        )} */}
        <form onSubmit={handlePasswordSubmit}>
          <div className="form-group">
            <label>Current Password</label>
            <input
              type="password"
              name="currentPassword"
              value={passwordData.currentPassword}
              onChange={handlePasswordChange}
              required
              minLength="6"
              disabled={isSubmitting}
            />
          </div>
          <div className="form-group">
            <label>New Password</label>
            <input
              type="password"
              name="newPassword"
              value={passwordData.newPassword}
              onChange={handlePasswordChange}
              required
              minLength="6"
              disabled={isSubmitting}
            />
          </div>
          <div className="form-group">
            <label>Confirm New Password</label>
            <input
              type="password"
              name="confirmPassword"
              value={passwordData.confirmPassword}
              onChange={handlePasswordChange}
              required
              minLength="6"
              disabled={isSubmitting}
            />
          </div>
          <button 
            type="submit" 
            className="save-btn"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <FontAwesomeIcon icon={faSpinner} spin />
            ) : (
              'Change Password'
            )}
          </button>
        </form>
      </div>
      )}
    </div>
    </Layout>
  );
}

export default Profile;
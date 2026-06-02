import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBell } from '@fortawesome/free-solid-svg-icons';
import '../styles/NotificationBell.css';

const NotificationBell = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Not authenticated');
        return;
      }

      setLoading(true);
      const res = await axios.get('http://localhost:5000/api/notifications', {
        headers: { 
          'x-auth-token': token,
          'Content-Type': 'application/json'
        }
      });
      
      const sortedNotifications = res.data.notifications
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);
      
      setNotifications(sortedNotifications);
      setUnreadCount(res.data.unreadCount);
      setError(null);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      await axios.patch(
        'http://localhost:5000/api/notifications/mark-read', 
        {},
        {
          headers: { 
            'x-auth-token': token,
            'Content-Type': 'application/json'
          }
        }
      );
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking notifications as read:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleBellClick = () => {
    setIsOpen(!isOpen);
    if (unreadCount > 0) markAsRead();
  };

  const handleNotificationClick = (notification) => {
    setIsOpen(false);

    if (notification.message.includes('New Booking for')) {
      navigate('/my-listings', { state: { activeTab: 'received' } });
    }

    else if (notification.message.includes('Your booking for') && notification.message.includes('is confirmed')) {
      navigate('/my-listings', { state: { activeTab: 'bookings' } });
    }
   
    else if (notification.message.includes('Booking Cancellation') || 
             notification.message.includes('Your booking has been cancelled') ||
             notification.message.includes('Refund Request for') ||
             notification.message.includes('You have received a refund') ||
             notification.message.includes('You have successfully refunded')) {
      navigate('/my-listings', { state: { activeTab: 'canceled' } });
    }

    else if (notification.message.includes('New Contact Request for')) {
      if (notification.propertyId) {
        navigate(`/property-details/${notification.propertyId}`);
      }
    }

    else if (notification.message.includes('View Property:')) {
      const propertyIdMatch = notification.message.match(/\/property-details\/([a-f0-9]+)/);
      if (propertyIdMatch && propertyIdMatch[1]) {
        navigate(`/property-details/${propertyIdMatch[1]}`);
      }
    }
  };

  const renderNotificationContent = (notification) => {
    return (
      <div 
        className="nc-notif-content"
        onClick={() => handleNotificationClick(notification)}
      >
        <p className="nc-notif-text">{notification.message}</p>
        {notification.details && (
          <div className="nc-notif-details">
            {notification.details.split('\n').map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>
        )}
        <p className="nc-notif-time">
          {new Date(notification.createdAt).toLocaleString()}
        </p>
      </div>
    );
  };

  return (
    <div className="nc-notif-bell" title="Notifications" >
      <div 
        className="nc-notif-icon" 
        onClick={handleBellClick}
        aria-label="Notifications"
      >
        <FontAwesomeIcon icon={faBell} />
        {unreadCount > 0 && <span className="nc-notif-badge">{unreadCount}</span>}
      </div>
      
      {isOpen && (
        <div className="nc-notif-dropdown">
          <div className="nc-notif-header">
            <h4>Notifications</h4>
          </div>
          
          {loading ? (
            <div className="nc-notif-loading">Loading notifications...</div>
          ) : error ? (
            <div className="nc-notif-error">
              <p>{error}</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="nc-notif-empty">No new notifications</div>
          ) : (
            <div className="nc-notif-list">
              {notifications.map((notification, index) => (
                <div 
                  key={index} 
                  className={`nc-notif-item ${notification.isRead ? '' : 'nc-notif-unread'}`}
                >
                  {renderNotificationContent(notification)}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
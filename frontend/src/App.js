import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './styles/variables.css';
import LandingPage from './pages/LandingPage';
import HomePage from './pages/HomePage';
import Login from './pages/Login';
import Signup from './pages/Signup';
import EmailVerification from './pages/EmailVerification';
import PropertyDetails from './pages/PropertyDetails';
import AddProperty from './pages/AddProperty';
import PropertyListing from './pages/PropertyListing';
import AboutPage from "./pages/AboutPage";
import ContactPage from "./pages/ContactPage";
import AdminDashboard from "./pages/AdminDashboard";
import PrivateRoute from "./components/PrivateRoute";
import Profile from './pages/profile';
import MyListings from './pages/MyListings';
import EditProperty from './pages/EditProperty';
import PaymentSuccess from './pages/PaymentSuccess';
import PaymentFailed from './pages/PaymentFailed';
import Favorites from './pages/Favorites';
import HelpPage from './pages/HelpPage';
import PrivacyPolicy from './pages/PrivacyPolicy';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/verify-email" element={<EmailVerification />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/help" element={<HelpPage />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        
        <Route path="/home" element={
          <PrivateRoute allowedRoles={["user", "admin"]}>
            <HomePage />
          </PrivateRoute>
        } />
        
        <Route path="/property-details/:id" element={
          <PrivateRoute allowedRoles={["user", "admin"]}>
            <PropertyDetails />
          </PrivateRoute>
        } />
        
        <Route path="/add-property" element={
          <PrivateRoute allowedRoles={["user", "admin"]}>
            <AddProperty />
          </PrivateRoute>
        } />
        
        <Route path="/property-listing" element={
          <PrivateRoute allowedRoles={["user", "admin"]}>
            <PropertyListing />
          </PrivateRoute>
        } />
        
        <Route path="/my-listings" element={
          <PrivateRoute allowedRoles={["user", "admin"]}>
            <MyListings />
          </PrivateRoute>
        } />
        
        <Route path="/edit-property/:id" element={
          <PrivateRoute allowedRoles={["user", "admin"]}>
            <EditProperty />
          </PrivateRoute>
        } />
        
        <Route path="/payment-success" element={
          <PrivateRoute allowedRoles={["user", "admin"]}>
            <PaymentSuccess />
          </PrivateRoute>
        } />
        
        <Route path="/payment-failed" element={
          <PrivateRoute allowedRoles={["user", "admin"]}>
            <PaymentFailed />
          </PrivateRoute>
        } />
        
        <Route path="/favorites" element={
          <PrivateRoute allowedRoles={["user", "admin"]}>
            <Favorites />
          </PrivateRoute>
        } />

        <Route path="/profile" element={
          <PrivateRoute allowedRoles={["user"]}>
            <Profile />
          </PrivateRoute>
        } />

        <Route path="/admin-dashboard" element={
          <PrivateRoute allowedRoles={["admin"]}>
            <AdminDashboard />
          </PrivateRoute>
        } />
      </Routes>
    </Router>
  );
}

export default App;

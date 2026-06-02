import React from 'react';
import { Container, Typography, Box, Paper } from '@mui/material';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const PrivacyPolicy = () => {
  return (
    <>
      <Navbar />
      <Container maxWidth="md" sx={{ my: 8 }}>
        <Typography variant="h3" component="h1" gutterBottom align="center" sx={{ mb: 6 }}>
          Privacy Policy
        </Typography>

        <Paper elevation={0} sx={{ p: 4 }}>
          <Box sx={{ mb: 4 }}>
            <Typography variant="h5" gutterBottom>
              1. Information We Collect
            </Typography>
            <Typography paragraph>
              We collect information that you provide directly to us, including:
            </Typography>
            <Typography component="ul" sx={{ pl: 2 }}>
              <li>Name, email address, phone number, and other contact details</li>
              <li>Account credentials and profile information</li>
              <li>Property listing information and photos</li>
              <li>Payment and transaction information</li>
            </Typography>
          </Box>

          <Box sx={{ mb: 4 }}>
            <Typography variant="h5" gutterBottom>
              2. How We Use Your Information
            </Typography>
            <Typography paragraph>
              We use the collected information for:
            </Typography>
            <Typography component="ul" sx={{ pl: 2 }}>
              <li>Providing and improving our services</li>
              <li>Processing your transactions</li>
              <li>Communicating with you about our services</li>
              <li>Ensuring platform security and preventing fraud</li>
              <li>Complying with legal obligations</li>
            </Typography>
          </Box>

          <Box sx={{ mb: 4 }}>
            <Typography variant="h5" gutterBottom>
              3. Information Sharing
            </Typography>
            <Typography paragraph>
              We may share your information with:
            </Typography>
            <Typography component="ul" sx={{ pl: 2 }}>
              <li>Other users as necessary for bookings and communications</li>
              <li>Service providers and business partners</li>
              <li>Law enforcement when required by law</li>
            </Typography>
          </Box>

          <Box sx={{ mb: 4 }}>
            <Typography variant="h5" gutterBottom>
              4. Data Security
            </Typography>
            <Typography paragraph>
              We implement appropriate technical and organizational measures to protect your personal information. However, no method of transmission over the Internet is 100% secure, and we cannot guarantee absolute security.
            </Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary">
              Last updated: {new Date().toLocaleDateString()}
            </Typography>
          </Box>
        </Paper>
      </Container>
      <Footer />
    </>
  );
};

export default PrivacyPolicy; 
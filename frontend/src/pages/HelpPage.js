import React from 'react';
import { Container, Typography, Accordion, AccordionSummary, AccordionDetails, Box } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const HelpPage = () => {
  const faqs = [
    {
      question: "How do I search for properties?",
      answer: "You can search for properties using the search bar on the homepage. You can search by location , city or property type."
    },
    {
      question: "How do I book a property?",
      answer: "Once you find a property you like, click on it to view details. If you're interested, you can contact the property owner through the contact form or book directly if instant booking is available."
    },
    {
      question: "What payment methods are accepted?",
      answer: "We accept payment from digital wallet that is Khalti. All payments are processed securely through our payment gateway."
    },
    {
      question: "How can I list my property?",
      answer: "To list your property, first create an account and verify your email. Then click on 'Post a room' in your dashboard and fill out the required information including photos, description, and pricing."
    },
    {
      question: "What if I need to cancel my booking?",
      answer: "Cancellation policies vary by property. Please check the specific cancellation policy on the property listing before booking. You can find your bookings in your account dashboard."
    }
  ];

  return (
    <>
      <Navbar />
      <Container maxWidth="md" sx={{ my: 8 }}>
        <Typography variant="h3" component="h1" gutterBottom align="center" sx={{ mb: 6 }}>
          Help Center
        </Typography>

        <Box sx={{ mb: 6 }}>
          <Typography variant="h5" gutterBottom>
            Frequently Asked Questions
          </Typography>
          {faqs.map((faq, index) => (
            <Accordion key={index}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle1">{faq.question}</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography>{faq.answer}</Typography>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>

        <Box sx={{ mb: 6 }}>
          <Typography variant="h5" gutterBottom>
            Need More Help?
          </Typography>
          <Typography paragraph>
            If you couldn't find the answer you're looking for, you can:
          </Typography>
          <Typography component="ul" sx={{ pl: 2 }}>
            <li>Email us at support@kothachaiyo.com</li>
            <li>Call our support team at +977-9818681200</li>
          </Typography>
        </Box>
      </Container>
      <Footer />
    </>
  );
};

export default HelpPage; 
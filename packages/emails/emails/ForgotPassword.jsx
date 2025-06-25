import React from 'react';
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from '@react-email/components';

const main = {
  backgroundColor: '#ffffff',
  fontFamily: 'HelveticaNeue,Helvetica,Arial,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  border: '1px solid #eee',
  borderRadius: '5px',
  boxShadow: '0 5px 10px rgba(20,50,70,.2)',
  marginTop: '20px',
  maxWidth: '360px',
  margin: '0 auto',
  padding: '20px 0 48px',
};

const heading = {
  color: '#003049', // prussian-blue
  fontSize: '24px',
  fontWeight: 'bold',
  textAlign: 'center',
  marginBottom: '30px',
};

const text = {
  color: '#003049',
  fontSize: '14px',
  lineHeight: '24px',
};

const btn = {
  backgroundColor: '#f77f00', // orange-wheel
  borderRadius: '5px',
  color: '#fff',
  fontSize: '12px',
  fontWeight: 500,
  lineHeight: '50px',
  textDecoration: 'none',
  textAlign: 'center',
  display: 'block',
  width: '200px',
  margin: '0 auto',
};

export const ForgotPassword = ({
  firstName = 'User',
  resetLink = `${process.env.WEB_URL}/reset-password-token?token=test-token`,
}) => (
  <Html>
    <Head />
    <Preview>Reset your Campground password</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={heading}>Reset Your Password</Heading>
        <Text style={{ ...text, textAlign: 'center' }}>
          Hi {firstName},
        </Text>
        <Text
          style={{
            ...text,
            padding: '0 20px',
            textAlign: 'center',
          }}
        >
          Someone recently requested a password change for your Campground account. If this was you, you can set a new password here:
        </Text>
        <Button style={btn} href={resetLink}>
          Reset Password
        </Button>
        <Text
          style={{
            ...text,
            padding: '0 20px',
            textAlign: 'center',
            marginTop: '20px',
          }}
        >
          If you don't want to change your password or didn't request this, just ignore and delete this message.
        </Text>
      </Container>
    </Body>
  </Html>
);

export default ForgotPassword; 
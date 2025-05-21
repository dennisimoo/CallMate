import React from 'react';
import { motion } from 'framer-motion';

const TermsOfService = ({ darkMode }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        backgroundColor: darkMode ? '#222' : '#fff',
        color: darkMode ? '#fff' : '#333',
        padding: '20px',
        borderRadius: '10px',
        maxHeight: '300px',
        overflowY: 'auto',
        marginBottom: '20px',
        border: darkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
        fontSize: '14px',
        lineHeight: '1.5',
      }}
    >
      <h3 style={{ marginTop: '0', fontSize: '16px' }}>Terms of Service</h3>

      <p>By using Plektu, you agree to the following terms:</p>

      <h4 style={{ fontSize: '15px', marginBottom: '5px' }}>1. User Responsibility</h4>
      <p>
        You acknowledge and agree that you are fully responsible for all calls made through
        the Plektu platform and bear full responsibility for the content and consequences of those calls.
      </p>

      <h4 style={{ fontSize: '15px', marginBottom: '5px' }}>2. Limitation of Liability</h4>
      <p>
        Plektu cannot be held responsible for any damages, disputes, or legal issues arising from
        the use of our service. You agree that Plektu, its owners, employees, and affiliates
        cannot be blamed for any consequences resulting from your use of this platform.
      </p>

      <h4 style={{ fontSize: '15px', marginBottom: '5px' }}>3. Content Guidelines</h4>
      <p>
        You agree not to use Plektu for any illegal, harmful, fraudulent, or offensive purposes.
        Plektu reserves the right to terminate your access if you violate these guidelines.
      </p>

      <h4 style={{ fontSize: '15px', marginBottom: '5px' }}>4. Data Usage</h4>
      <p>
        By providing your name and using our service, you consent to our collection and
        processing of this information in accordance with our Privacy Policy.
      </p>

      <h4 style={{ fontSize: '15px', marginBottom: '5px' }}>5. Modifications to Terms</h4>
      <p>
        Plektu reserves the right to modify these terms at any time. Continued use of
        the service after changes constitutes acceptance of the new terms.
      </p>
    </motion.div>
  );
};

export default TermsOfService;

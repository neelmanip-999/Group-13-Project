import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import OTPForm from '../components/OTPForm';

export default function OTPVerificationPage() {
  return <OTPForm />;
}

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore';
import AuthForm from '../components/AuthForm';

const SuperAdminLoginPage = () => {
    const navigate = useNavigate();
    const { login } = useAuthStore();
    
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        setLoading(true);
        setError(null);
        try {
            // We can add a check here later to ensure the user is a super admin on the client side
            await login(email, password);
            navigate('/'); // Navigate to the admin dashboard root
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthForm
            formType='login'
            title='Super Admin Sign In'
            buttonText="Login"
            onSubmit={handleLogin}
            error={error}
            loading={loading}
            email={email}
            setEmail={setEmail}
            password={password}
            setPassword={setPassword}
        />
    );
};

export default SuperAdminLoginPage;

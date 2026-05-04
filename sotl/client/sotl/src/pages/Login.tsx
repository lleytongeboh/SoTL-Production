import React, { useState, useEffect } from 'react';
import { Button, TextField, Typography, Box } from '@mui/material';
import { Link, useNavigate } from "react-router-dom";
import { LoginRequest } from '../models/index';
import { useAuth } from '../features/auth/context';
import { useAuthServices } from '../features/auth/services';
import { useFeedbackDialog } from '../context/FeedbackDialog';
import { validateEmail } from '../utils/validator';

const Login = () => {
  const { authenticate } = useAuthServices();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { role, isAuthenticated } = useAuth();
  const { setLoadingPane, error, setError } = useFeedbackDialog();
  const navigate = useNavigate(); // (kept in case you still need it elsewhere)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const loginData: LoginRequest = { email, password };

    try {
      const response = await authenticate(loginData);
      console.log(response);
      if (response) {
        setLoadingPane({ status: true, message: 'Login Success, loading...' });
        // ⭐ DO NOT reload here; wait for isAuthenticated to flip in the effect below.
      }
    } catch (err: any) {
      setError({ status: true, message: err.message });
    }
  };

  // ⭐ After auth context flips to true, do a FULL refresh to the correct route
  useEffect(() => {
    if (!isAuthenticated) return;
    if (role === 'student') {
      window.location.href = '/student';   // full reload
    } else if (role === 'lecturer') {
      window.location.href = '/lecturer';  // full reload
    } else {
      window.location.href = '/';          // full reload (fallback)
    }
  }, [isAuthenticated, role]);

  return (
    <form onSubmit={handleSubmit}>
      <img src="/images/logo.jpg" alt="Logo" style={{ width:'400px', height: '400px' }} />

      <TextField
        label="Email"
        variant="outlined"
        fullWidth
        margin="normal"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={error.status}
        helperText={error.status ? "Invalid Email/Password" : ""}
        FormHelperTextProps={{ style: { color: 'red' } }}
      />

      <TextField
        label="Password"
        type="password"
        variant="outlined"
        fullWidth
        margin="normal"
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={error.status}
        helperText={error.status ? "Invalid Email/Password" : ""}
      />

      <Box sx={{ textAlign: 'right', marginTop: "8px" }}>
        <Typography variant="caption">
          <Link to="change-password">Forget Password?</Link>
        </Typography>
      </Box>

      <Button
        type="submit"                 // ⭐ was "button" + onClick; submit triggers handleSubmit
        variant="contained"
        color="primary"
        fullWidth
        sx={{ marginTop: "1rem", borderRadius: 28 }}
        disabled={!(validateEmail(email) && password.length > 0)}
      >
        Login
      </Button>
    </form>
  );
};

export default Login;

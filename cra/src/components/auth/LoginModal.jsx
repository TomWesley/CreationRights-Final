import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui/card';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { useAppContext } from '../../contexts/AppContext';
import LoginForm from './LoginForm';

const LoginModal = () => {
  const { setShowLoginModal } = useAppContext();
  
  return (
    <div className="modal-overlay">
      <Card className="login-modal">
        <CardHeader>
          <CardTitle className="login-title">Sign In</CardTitle>
          <CardDescription>
            Sign in to your Creation Rights account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
        <CardFooter className="login-footer">
          <Button variant="ghost" onClick={() => setShowLoginModal(false)}>
            Cancel
          </Button>
          <Button variant="link">Forgot password?</Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default LoginModal;
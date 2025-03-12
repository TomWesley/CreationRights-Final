// src/components/auth/LoginForm.jsx

import React from 'react';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { useAppContext } from '../../contexts/AppContext';

const LoginForm = () => {
  const { 
    loginCredentials, 
    handleLoginInput, 
    handleLogin,
    isLoading
  } = useAppContext();
  
  return (
    <form onSubmit={handleLogin} className="login-form">
      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          value={loginCredentials.email}
          onChange={handleLoginInput}
          placeholder="your@email.com"
          required
        />
        <p className="text-xs text-gray-500 mt-1">
          Enter your email to log in or create a new account
        </p>
      </div>
      
      <div>
        <Label htmlFor="accountType">Account Type</Label>
        <select
          id="accountType"
          name="accountType"
          value={loginCredentials.accountType}
          onChange={handleLoginInput}
          className="account-type-select"
        >
          <option value="creator">Creator</option>
          <option value="agency">Agency</option>
        </select>
      </div>
      
      <Button type="submit" className="login-button" disabled={isLoading}>
        {isLoading ? 'Signing in...' : 'Sign In'}
      </Button>
      
      <p className="text-center text-sm text-gray-500 mt-4">
        For demonstration purposes, only email is required.
        <br/>Your creations will be associated with your email address.
      </p>
    </form>
  );
};

export default LoginForm;
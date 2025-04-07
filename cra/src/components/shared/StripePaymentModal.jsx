// src/components/shared/StripePaymentModal.jsx

import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { CardElement, Elements, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from '../ui/button';
import { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription } from '../ui/card';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

// Initialize Stripe with your publishable key
// In production, you would use process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);
const API_URL = (process.env.REACT_APP_API_URL || 'http://localhost:3001').replace(/\/+$/, '');
// The form component that collects payment details
const PaymentForm = ({ creation, onSuccess, onCancel }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [succeeded, setSucceeded] = useState(false);
  const [error, setError] = useState(null);
  const [clientSecret, setClientSecret] = useState('');
  const [paymentIntent, setPaymentIntent] = useState(null);

  // Create a payment intent when the component mounts
  useEffect(() => {
    const createPaymentIntent = async () => {
      try {
        const response = await fetch(`${API_URL}/api/create-payment-intent`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: creation.licensingCost * 100, // Convert to cents for Stripe
            currency: 'usd',
            description: `License for ${creation.title}`,
            creationId: creation.id,
            creationRightsId: creation.metadata?.creationRightsId || creation.id,
            creatorEmail: creation.createdBy
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to create payment intent');
        }

        const data = await response.json();
        setClientSecret(data.clientSecret);
        setPaymentIntent(data.paymentIntent);
      } catch (err) {
        console.error('Error creating payment intent:', err);
        setError('Failed to initialize payment. Please try again later.');
      }
    };

    if (creation && creation.licensingCost) {
      createPaymentIntent();
    }
  }, [creation]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js hasn't loaded yet
      return;
    }

    setProcessing(true);

    // Confirm the card payment
    const result = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: elements.getElement(CardElement),
        billing_details: {
          name: 'Customer Name', // Ideally, get this from a form field
        },
      }
    });

    if (result.error) {
      setError(`Payment failed: ${result.error.message}`);
      setProcessing(false);
    } else {
      if (result.paymentIntent.status === 'succeeded') {
        // Call your backend to record the successful license purchase
        try {
          await recordLicensePurchase(creation, result.paymentIntent);
          setSucceeded(true);
          setError(null);
          onSuccess(result.paymentIntent);
        } catch (err) {
          setError('Payment successful, but failed to record license. Please contact support.');
        }
      }
      setProcessing(false);
    }
  };

  const recordLicensePurchase = async (creation, paymentIntent) => {
    try {
      const response = await fetch(`${API_URL}/api/record-license-purchase`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          creationId: creation.id,
          creationRightsId: creation.metadata?.creationRightsId || creation.id,
          paymentIntentId: paymentIntent.id,
          amount: paymentIntent.amount / 100, // Convert back from cents
          currency: paymentIntent.currency,
          creatorEmail: creation.createdBy,
          purchaserEmail: 'current-user@example.com', // Replace with actual user email
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to record license purchase');
      }

      return await response.json();
    } catch (err) {
      console.error('Error recording license purchase:', err);
      throw err;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="payment-form">
      {!succeeded ? (
        <>
          <div className="mb-4">
            <label htmlFor="card-element" className="block text-sm font-medium text-gray-700 mb-2">
              Credit or Debit Card
            </label>
            <div className="p-3 border rounded-md">
              <CardElement
                id="card-element"
                options={{
                  style: {
                    base: {
                      fontSize: '16px',
                      color: '#424770',
                      '::placeholder': {
                        color: '#aab7c4',
                      },
                    },
                    invalid: {
                      color: '#9e2146',
                    },
                  },
                }}
              />
            </div>
            {error && (
              <div className="mt-2 text-red-600 text-sm flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {error}
              </div>
            )}
          </div>

          <div className="flex justify-between mt-6">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onCancel}
              disabled={processing}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={processing || !stripe}
              className={processing ? "opacity-75" : ""}
            >
              {processing ? "Processing..." : `Pay $${creation.licensingCost}`}
            </Button>
          </div>
        </>
      ) : (
        <div className="text-center py-4">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-green-700 mb-2">Payment Successful!</h3>
          <p className="text-gray-600 mb-4">
            Thank you for your purchase. You now have a license for "{creation.title}".
          </p>
          <Button onClick={onCancel}>Close</Button>
        </div>
      )}
    </form>
  );
};

// Main modal component
const StripePaymentModal = ({ isOpen, onClose, creation }) => {
  if (!isOpen) return null;

  const handleSuccess = (paymentIntent) => {
    // You might want to wait a bit before closing so user can see success message
    setTimeout(() => {
      onClose(true, paymentIntent);
    }, 3000);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md bg-white">
        <CardHeader>
          <CardTitle>License Purchase</CardTitle>
          <CardDescription>
            You are licensing "{creation.title}" for ${creation.licensingCost}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Elements stripe={stripePromise}>
            <PaymentForm 
              creation={creation} 
              onSuccess={handleSuccess} 
              onCancel={() => onClose(false)} 
            />
          </Elements>
        </CardContent>
        
        <CardFooter className="text-xs text-gray-500 border-t pt-4">
          Your payment is securely processed by Stripe. We do not store your card details.
        </CardFooter>
      </Card>
    </div>
  );
};

export default StripePaymentModal;
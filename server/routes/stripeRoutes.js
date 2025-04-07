// server/routes/stripeRoutes.js

const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { Storage } = require('@google-cloud/storage');

// Initialize Google Cloud Storage
const storage = new Storage({
  keyFilename: process.env.GCS_KEY_FILE
});
const BUCKET_NAME = process.env.GCS_BUCKET_NAME || 'creation-rights-app';

// Helper function to sanitize email
const sanitizeEmail = (email) => {
  if (!email) return '';
  return email.toLowerCase().replace(/[^a-z0-9]/g, '_');
};

// Create a payment intent
router.post('/create-payment-intent', async (req, res) => {
  try {
    const { amount, currency, description, creationId, creationRightsId, creatorEmail } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid payment amount' });
    }

    // Create a PaymentIntent with the order amount and currency
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount), // Ensure it's a whole number (cents)
      currency: currency || 'usd',
      description,
      metadata: {
        creationId,
        creationRightsId,
        creatorEmail
      },
    });

    // Send the client secret to the client
    res.status(200).json({
      clientSecret: paymentIntent.client_secret,
      paymentIntent: {
        id: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: paymentIntent.status
      }
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ error: error.message });
  }
});

// Record a license purchase
router.post('/record-license-purchase', async (req, res) => {
  try {
    const {
      creationId,
      creationRightsId,
      paymentIntentId,
      amount,
      currency,
      creatorEmail,
      purchaserEmail,
      timestamp
    } = req.body;

    if (!creationId || !paymentIntentId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // 1. Verify the payment with Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ error: 'Payment has not succeeded' });
    }

    // 2. Record license in the creator's storage
    const sanitizedCreatorEmail = sanitizeEmail(creatorEmail);
    const bucket = storage.bucket(BUCKET_NAME);

    // Create a license record
    const licenseData = {
      id: `license_${Date.now()}`,
      creationId,
      creationRightsId,
      paymentIntentId,
      amount,
      currency,
      purchaserEmail,
      timestamp,
      status: 'active'
    };

    // Save to creator's licenses directory
    const creatorLicensePath = `users/${sanitizedCreatorEmail}/creations/licenses/${creationRightsId}/${paymentIntentId}.json`;
    
    // Create directory if needed
    try {
      await bucket.file(`users/${sanitizedCreatorEmail}/creations/licenses/.keep`).save('');
      await bucket.file(`users/${sanitizedCreatorEmail}/creations/licenses/${creationRightsId}/.keep`).save('');
    } catch (dirError) {
      console.error('Error creating license directory:', dirError);
      // Continue anyway, the file save might still work
    }

    // Save the license data
    await bucket.file(creatorLicensePath).save(JSON.stringify(licenseData), {
      contentType: 'application/json'
    });

    // 3. Also record the license in the purchaser's account
    if (purchaserEmail) {
      const sanitizedPurchaserEmail = sanitizeEmail(purchaserEmail);
      const purchaserLicensePath = `users/${sanitizedPurchaserEmail}/licenses/${paymentIntentId}.json`;
      
      try {
        // Create directory if needed
        await bucket.file(`users/${sanitizedPurchaserEmail}/licenses/.keep`).save('');
        
        // Save the license data
        await bucket.file(purchaserLicensePath).save(JSON.stringify(licenseData), {
          contentType: 'application/json'
        });
      } catch (purchaserError) {
        console.error('Error saving purchaser license record:', purchaserError);
        // Continue as this is not critical for the transaction
      }
    }

    // 4. Update the creation record to include this license
    try {
      const metadataPath = `users/${sanitizedCreatorEmail}/creations/metadata/all.json`;
      const [exists] = await bucket.file(metadataPath).exists();
      
      if (exists) {
        const [content] = await bucket.file(metadataPath).download();
        const creations = JSON.parse(content.toString());
        
        // Find and update the creation to track licenses
        const updatedCreations = creations.map(creation => {
          if (creation.id === creationId || 
             (creation.metadata && creation.metadata.creationRightsId === creationRightsId)) {
            // Initialize licenses array if it doesn't exist
            if (!creation.licenses) {
              creation.licenses = [];
            }
            
            // Add the new license
            creation.licenses.push({
              id: licenseData.id,
              paymentIntentId,
              purchaserEmail,
              amount,
              currency,
              timestamp,
              status: 'active'
            });
          }
          return creation;
        });
        
        // Save the updated creations metadata
        await bucket.file(metadataPath).save(JSON.stringify(updatedCreations), {
          contentType: 'application/json'
        });
      }
    } catch (metadataError) {
      console.error('Error updating creation metadata with license:', metadataError);
      // Continue as this is not critical for the transaction
    }

    res.status(200).json({
      success: true,
      license: licenseData
    });
  } catch (error) {
    console.error('Error recording license purchase:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get licenses for a creation
router.get('/creation/:creationId/licenses', async (req, res) => {
  try {
    const { creationId } = req.params;
    const { creatorEmail } = req.query;

    if (!creationId || !creatorEmail) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const sanitizedCreatorEmail = sanitizeEmail(creatorEmail);
    const bucket = storage.bucket(BUCKET_NAME);
    
    // First, try to get the creationRightsId from creation metadata
    let creationRightsId = creationId;
    try {
      const metadataPath = `users/${sanitizedCreatorEmail}/creations/metadata/all.json`;
      const [exists] = await bucket.file(metadataPath).exists();
      
      if (exists) {
        const [content] = await bucket.file(metadataPath).download();
        const creations = JSON.parse(content.toString());
        
        const creation = creations.find(c => c.id === creationId);
        if (creation && creation.metadata && creation.metadata.creationRightsId) {
          creationRightsId = creation.metadata.creationRightsId;
        }
      }
    } catch (metadataError) {
      console.error('Error retrieving creation metadata:', metadataError);
      // Continue with original creationId
    }
    
    // Get all license files for this creation
    const [files] = await bucket.getFiles({
      prefix: `users/${sanitizedCreatorEmail}/creations/licenses/${creationRightsId}/`
    });
    
    const licenses = [];
    
    // Process each license file
    for (const file of files) {
      if (file.name.endsWith('.json')) {
        try {
          const [content] = await file.download();
          const license = JSON.parse(content.toString());
          licenses.push(license);
        } catch (err) {
          console.error(`Error processing license file ${file.name}:`, err);
        }
      }
    }
    
    res.status(200).json(licenses);
  } catch (error) {
    console.error('Error fetching creation licenses:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get licenses for a user (as a purchaser)
router.get('/user/:userId/licenses', async (req, res) => {
  try {
    const { userId } = req.params;
    const sanitizedUserId = sanitizeEmail(userId);
    
    const bucket = storage.bucket(BUCKET_NAME);
    
    // Get all license files for this user
    const [files] = await bucket.getFiles({
      prefix: `users/${sanitizedUserId}/licenses/`
    });
    
    const licenses = [];
    
    // Process each license file
    for (const file of files) {
      if (file.name.endsWith('.json')) {
        try {
          const [content] = await file.download();
          const license = JSON.parse(content.toString());
          licenses.push(license);
        } catch (err) {
          console.error(`Error processing license file ${file.name}:`, err);
        }
      }
    }
    
    res.status(200).json(licenses);
  } catch (error) {
    console.error('Error fetching user licenses:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
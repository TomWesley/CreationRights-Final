// Save this to server/scripts/fix-profiles.js

/**
 * This script verifies and fixes user profiles in the GCP bucket
 * Run with: node scripts/fix-profiles.js
 */

const { Storage } = require('@google-cloud/storage');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// Initialize Google Cloud Storage
const BUCKET_NAME = process.env.GCS_BUCKET_NAME || 'creation-rights-app';

async function main() {
  try {
    console.log('Initializing Google Cloud Storage...');
    const storage = new Storage({
      keyFilename: process.env.GCS_KEY_FILE || path.join(__dirname, '../key.json')
    });
    
    console.log(`Using bucket: ${BUCKET_NAME}`);
    const bucket = storage.bucket(BUCKET_NAME);
    
    // List all files in the users directory
    console.log('Listing all users...');
    const [files] = await bucket.getFiles({ prefix: 'users/' });
    
    // Get all user directories
    const userDirs = new Set();
    files.forEach(file => {
      const parts = file.name.split('/');
      if (parts.length >= 2) {
        userDirs.add(parts[1]);
      }
    });
    
    console.log(`Found ${userDirs.size} user directories`);
    
    // Process each user
    for (const userId of userDirs) {
      if (!userId) continue; // Skip empty entries
      
      console.log(`\nProcessing user: ${userId}`);
      
      // Check for profile info file
      const profilePath = `users/${userId}/profile/info.json`;
      const profileFile = bucket.file(profilePath);
      const [profileExists] = await profileFile.exists();
      
      if (profileExists) {
        console.log(`  Profile exists at ${profilePath}`);
        
        // Validate profile data
        try {
          const [content] = await profileFile.download();
          let profileData = JSON.parse(content.toString());
          
          // Check for required fields and fix if needed
          let needsUpdate = false;
          
          if (!profileData.email) {
            console.log('  Missing email field, adding...');
            profileData.email = userId;
            needsUpdate = true;
          }
          
          if (!profileData.name) {
            console.log('  Missing name field, adding default...');
            profileData.name = userId.split('@')[0];
            needsUpdate = true;
          }
          
          if (!profileData.specialties || !Array.isArray(profileData.specialties)) {
            console.log('  Missing specialties array, adding default...');
            profileData.specialties = ['Content Creator'];
            needsUpdate = true;
          }
          
          if (!profileData.contentTypes || !Array.isArray(profileData.contentTypes)) {
            console.log('  Missing contentTypes array, adding empty array...');
            profileData.contentTypes = [];
            needsUpdate = true;
          }
          
          if (!profileData.createdAt) {
            console.log('  Missing createdAt field, adding current time...');
            profileData.createdAt = new Date().toISOString();
            needsUpdate = true;
          }
          
          // Update the profile if needed
          if (needsUpdate) {
            console.log('  Updating profile with fixed data...');
            await profileFile.save(JSON.stringify(profileData, null, 2), {
              contentType: 'application/json'
            });
            console.log('  Profile updated successfully');
          } else {
            console.log('  Profile data looks good, no updates needed');
          }
        } catch (error) {
          console.error(`  Error processing profile for ${userId}:`, error);
        }
      } else {
        console.log(`  No profile found for ${userId}, creating default profile...`);
        
        // Create default profile
        const defaultProfile = {
          email: userId,
          name: userId.split('@')[0],
          bio: '',
          website: '',
          location: '',
          photoUrl: null,
          specialties: ['Content Creator'],
          contentTypes: [],
          status: 'active',
          socialLinks: {},
          education: [],
          exhibitions: [],
          awards: [],
          createdAt: new Date().toISOString()
        };
        
        // Save default profile
        try {
          await profileFile.save(JSON.stringify(defaultProfile, null, 2), {
            contentType: 'application/json'
          });
          console.log('  Default profile created successfully');
        } catch (error) {
          console.error(`  Error creating default profile for ${userId}:`, error);
        }
      }
    }
    
    console.log('\nProfile verification and fix completed');
  } catch (error) {
    console.error('Error in script execution:', error);
  }
}

main();
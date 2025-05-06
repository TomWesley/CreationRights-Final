# 🔐 Creation Rights

<div align="center">
  <img src="public/crlogo.svg" alt="Creation Rights Logo" width="300" />
  <br />
  <h3>Secure management and protection for your creative works</h3>

  ![License](https://img.shields.io/badge/license-MIT-blue)
  ![Version](https://img.shields.io/badge/version-1.0.0-green)
  ![React](https://img.shields.io/badge/React-17.0.2-61DAFB?logo=react)
  ![Firebase](https://img.shields.io/badge/Firebase-9.6.0-FFCA28?logo=firebase)
</div>

## 📋 Overview

Creation Rights is a comprehensive platform designed to help creators manage, protect, and monetize their creative works. Whether you're a photographer, musician, writer, or digital artist, Creation Rights provides the tools to safeguard your intellectual property and establish clear ownership rights.

## ✨ Features

- **📁 Creative Works Management**: Upload, organize, and track all your creative assets in one place
- **🏷️ Rights Documentation**: Add detailed metadata and rights information to your works
- **💰 Licensing Management**: Monetize your creations with built-in licensing tools
- **🔄 Social Media Integration**: Connect and analyze your social media performance
- **👥 Agency/Creator Relationship**: Specialized views for both creators and agencies
- **🖼️ Watermarking**: Automatic watermarking for image and video content
- **📱 Responsive Design**: Works seamlessly on desktop and mobile devices

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Firebase account (for authentication and storage)
- Google Cloud Storage account

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/creation-rights.git
   cd creation-rights
   ```

2. Install dependencies for the client:
   ```bash
   cd cra
   npm install
   ```

3. Install dependencies for the server:
   ```bash
   cd ../server
   npm install
   ```

4. Set up environment variables:
   Create `.env` files in both the client and server directories based on the provided examples:

   **Client `.env`:**
   ```
   REACT_APP_API_URL=http://localhost:3001
   REACT_APP_FIREBASE_API_KEY=your_firebase_api_key
   REACT_APP_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
   REACT_APP_FIREBASE_PROJECT_ID=your_firebase_project_id
   REACT_APP_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
   REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
   REACT_APP_FIREBASE_APP_ID=your_firebase_app_id
   REACT_APP_GCS_BUCKET_NAME=your_gcs_bucket_name
   REACT_APP_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
   ```

   **Server `.env`:**
   ```
   PORT=3001
   GCS_KEY_FILE=path/to/your/gcs/key.json
   GCS_BUCKET_NAME=your_gcs_bucket_name
   STRIPE_SECRET_KEY=your_stripe_secret_key
   APIFY_API_TOKEN=your_apify_api_token
   ```

5. Start the development servers:

   **Client:**
   ```bash
   cd cra
   npm start
   ```

   **Server:**
   ```bash
   cd server
   npm run dev
   ```

6. Open your browser and navigate to `http://localhost:3000`

## 🏗️ Architecture

### Frontend

The frontend is built with React and follows a modular component structure:

- **Components**: Reusable UI components organized by feature
- **Contexts**: State management using React Context API
- **Services**: API interaction and external service integration
- **Utils**: Helper functions and utilities

### Backend

The backend is built with Express.js and Google Cloud Storage:

- **Routes**: API endpoints for file uploads, metadata, and licensing
- **Services**: Business logic and external integrations
- **Authentication**: Firebase Authentication for user management

### Storage Architecture

Files are stored in Google Cloud Storage with the following structure:

```
users/
  userId/
    profile/
      info.json
    creations/
      metadata/
        all.json
      assets/
        creationId/
          file
          metadata.json
          thumbnail.jpg
    licenses/
      licenseId.json
```

## 🔒 Security

Creation Rights implements several layers of security:

- **Authentication**: Firebase Authentication for secure user management
- **Storage Security**: Google Cloud Storage rules to protect user assets
- **Content Protection**: Watermarking and proxy service for image/video content
- **CORS Configuration**: Properly configured CORS to prevent unauthorized access

## 🛠️ Technology Stack

- **Frontend**:
  - React
  - Tailwind CSS
  - React Router
  - Firebase Authentication
  - Stripe.js

- **Backend**:
  - Node.js
  - Express
  - Google Cloud Storage
  - Multer (file handling)
  - Stripe API

- **Integration**:
  - Social Media APIs
  - Stripe for payments
  - Apify for social media scraping

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Contact

For questions or support, please email support@creationrights.com or open an issue on GitHub.

---

<div align="center">
  <p>Built with ❤️ for creators</p>
  <p>© 2025 Creation Rights</p>
</div>

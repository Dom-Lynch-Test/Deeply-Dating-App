# Deeply Dating App

A quality-focused dating app built with React Native and Expo.

## Project Overview

Deeply is a dating app focused on meaningful connections and user experience. The app is integrated with Firebase for authentication and data management.

## Features

- User authentication (Email/Password and Google Sign-In)
- User profile creation and management
- Modern UI with a focus on user experience

## Tech Stack

- React Native
- Expo
- Firebase (Authentication, Firestore)
- TypeScript

## Getting Started

### Prerequisites

- Node.js
- npm or yarn
- Expo CLI

### Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Set up environment variables:
   - Copy the `.env.example` file to `.env`
   - Fill in your Firebase configuration values in the `.env` file
   ```
   cp .env.example .env
   ```
4. Start the development server:
   ```
   npx expo start
   ```

### Environment Variables

The app uses environment variables to securely store API keys and configuration. To set up:

1. Create a `.env` file in the root directory (or copy from `.env.example`)
2. Add the following variables:
   ```
   FIREBASE_API_KEY=your_api_key
   FIREBASE_AUTH_DOMAIN=your_auth_domain
   FIREBASE_PROJECT_ID=your_project_id
   FIREBASE_STORAGE_BUCKET=your_storage_bucket
   FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   FIREBASE_APP_ID=your_app_id
   FIREBASE_MEASUREMENT_ID=your_measurement_id
   ```
3. Never commit your `.env` file to version control

## Project Structure

- `/assets` - App assets (images, fonts)
- `/src` - Source code
  - `/components` - Reusable UI components
  - `/config` - Configuration files (Firebase)
  - `/context` - React Context providers
  - `/navigation` - Navigation configuration
  - `/screens` - App screens
  - `/services` - API and service functions

## Security Best Practices

- Never hardcode API keys or secrets in your source code
- Use environment variables for sensitive information
- Keep the `.env` file in `.gitignore` to prevent accidental commits
- Regularly rotate API keys and secrets

## Last Updated

March 21, 2025, 22:15 GMT+4

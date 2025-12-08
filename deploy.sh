#!/bin/bash

echo "Deploying Decentralized Storage Application"
echo "==========================================="

# Deploy Backend (Smart Contracts)
echo ""
echo "Step 1: Deploying Smart Contracts..."
cd backend
npm install
npm run compile
npm run deploy

# Build Frontend
echo ""
echo "Step 2: Building Frontend..."
cd ../frontend
npm install
npm run build

echo ""
echo "Deployment Complete!"
echo "- Backend: Smart contracts deployed"
echo "- Frontend: Built in frontend/dist/"
echo ""
echo "Next steps:"
echo "1. Deploy frontend/dist/ to your hosting service (Vercel, Netlify, etc.)"
echo "2. Update frontend environment variables with contract address"

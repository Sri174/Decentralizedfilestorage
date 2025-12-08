# Decentralized Storage - Frontend

React-based frontend for the decentralized storage application.

## Setup

```bash
npm install
```

## Environment Variables

Create a `.env` file in the frontend directory:

```env
VITE_WEB3_STORAGE_TOKEN=your_web3_storage_token
VITE_FILECOIN_RPC_URL=your_filecoin_rpc_url
```

## Development

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Deploy

### Vercel
```bash
npm install -g vercel
vercel
```

### Netlify
```bash
npm install -g netlify-cli
netlify deploy
```

### Manual
Upload the contents of the `dist` folder to any static hosting service.

## Features

- Upload files to IPFS/Filecoin
- Store file metadata on Ethereum blockchain
- Retrieve and download files
- Connect with MetaMask wallet

## Contract Integration

Make sure the backend contracts are deployed first. The contract ABI and address should be in `src/abis/FileRegistry.json`.

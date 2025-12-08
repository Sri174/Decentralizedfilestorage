// src/utils/ipfs.ts
import { create, IPFSHTTPClient } from 'ipfs-http-client';

// Retrieve Infura credentials from environment variables (currently unused for connection)
const INFURA_PROJECT_ID = import.meta.env.VITE_INFURA_PROJECT_ID;
const INFURA_PROJECT_SECRET = import.meta.env.VITE_INFURA_PROJECT_SECRET;

// Determine if Infura credentials are available (for configuration purposes only)
const hasInfuraCredentials = !!INFURA_PROJECT_ID && !!INFURA_PROJECT_SECRET;

// Buffer import might not be needed here if it's handled in vite.config.ts and main entry point,
// but keeping it here shouldn't hurt if it's already working.
// import { Buffer } from 'buffer'; 

let ipfs: IPFSHTTPClient;
let infuraGatewayUrl = '';

// Configure IPFS client to use Infura as the primary option
if (hasInfuraCredentials) {
  ipfs = create({
    url: `https://${INFURA_PROJECT_ID}.infura-ipfs.io:5001`,
    headers: {
      authorization: `Basic ${btoa(`${INFURA_PROJECT_ID}:${INFURA_PROJECT_SECRET}`)}`,
    },
  });
  console.log('🌐 Using Infura IPFS API.');
} else {
  // This should not happen now since we've set the credentials, but keeping as fallback
  console.error('❌ Infura credentials not found! Please check your .env file.');
  ipfs = create({
    url: 'https://ipfs.infura.io:5001', // Using a public endpoint as fallback
  });
  console.log('🌐 Using public IPFS API as fallback.');
}

// Construct Infura gateway URL only if credentials are available, for potential future use in links
if (hasInfuraCredentials) {
    infuraGatewayUrl = `https://${INFURA_PROJECT_ID}.ipfs.infura-ipfs.io/ipfs/`;
    console.log('🌐 Infura Gateway URL available for links.');
} else {
    console.log('🌐 No Infura credentials found, will not use Infura gateway.');
}

// Export a configuration object for your app
export const IPFS_CONFIG = {
  localApiUrl: hasInfuraCredentials ? `https://${INFURA_PROJECT_ID}.infura-ipfs.io:5001` : 'https://ipfs.infura.io:5001',
  gatewayUrl: hasInfuraCredentials ? `https://${INFURA_PROJECT_ID}.ipfs.infura-ipfs.io` : 'https://ipfs.io', // Public gateway
  publicKey: 'CAESICB8wdXPaT3yIGXXZCxn1+HKLkjkX5E8qj2Z3JwX6W1i',
  hasInfuraCredentials, // Keep the flag for app logic (e.g., which gateway link to show)
  infuraGatewayUrl, // Keep the URL for app logic (e.g., which gateway link to show)
};

// Function to check if a file exists on IPFS
export const checkIPFSFile = async (cid: string) => {
  try {
    console.log('🔍 Checking IPFS file status for CID:', cid);
    
    // Try to stat the file
    const stat = await ipfs.files.stat(`/ipfs/${cid}`);
    console.log('✅ File found on IPFS:', stat);
    
    return {
      exists: true,
      size: stat.size,
      type: stat.type,
      cumulativeSize: stat.cumulativeSize,
    };
  } catch (error) {
    console.warn('⚠️ Could not verify file on IPFS:', error);
    
    // Try alternative verification via gateway
    try {
      const response = await fetch(`https://ipfs.io/ipfs/${cid}?timeout=5s`);
      return {
        exists: response.ok,
        status: response.status,
        message: response.ok ? 'File accessible via gateway' : 'File not accessible',
      };
    } catch (gatewayError) {
      console.error('❌ Could not verify file via gateway:', gatewayError);
      return {
        exists: false,
        error: 'Could not verify file status',
      };
    }
  }
};

// Function to get Infura dashboard URL
export const getInfuraDashboardUrl = () => {
  return 'https://infura.io/dashboard';
};

// Function to construct Infura gateway URL for a specific CID
export const getInfuraGatewayUrl = (cid: string) => {
  if (hasInfuraCredentials && infuraGatewayUrl) {
    return `${infuraGatewayUrl}${cid}`;
  }
  return `https://ipfs.io/ipfs/${cid}`;
};

export default ipfs;

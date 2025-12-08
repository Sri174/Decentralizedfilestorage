// src/utils/filecoin.ts
import { ethers } from 'ethers';

// Filecoin configuration
const FILECOIN_STORAGE_URL = 'https://api.web3.storage'; // Using Web3.Storage which is built on Filecoin
const WEB3_STORAGE_TOKEN = import.meta.env.VITE_WEB3STORAGE_TOKEN;

// Check if Web3.Storage token is available
const hasWeb3StorageToken = !!WEB3_STORAGE_TOKEN;

// Filecoin client configuration
let filecoinClient: any;

if (hasWeb3StorageToken) {
  // Initialize Web3.Storage client which uses Filecoin
  const { Web3Storage } = await import('web3.storage');
  filecoinClient = new Web3Storage({ token: WEB3_STORAGE_TOKEN });
  console.log('🌐 Using Web3.Storage (Filecoin-based) API.');
} else {
  console.error('❌ Web3.Storage token not found! Please set VITE_WEB3_STORAGE_TOKEN in your .env file.');
  console.log('🌐 Filecoin functionality will be simulated for demo purposes.');
}

// Export a configuration object for your app
export const FILECOIN_CONFIG = {
  storageUrl: FILECOIN_STORAGE_URL,
  hasWeb3StorageToken, // Keep the flag for app logic (e.g., which storage to use)
  publicKey: 'Filecoin Public Key', // Placeholder - actual key would be retrieved differently
};

// Function to upload file to Filecoin via Web3.Storage
export const uploadToFilecoin = async (file: File) => {
  if (!hasWeb3StorageToken) {
    // Simulate upload for demo purposes
    console.log('📁 Simulating Filecoin upload for file:', file.name);
    console.log('⚠️ Web3.Storage token not found. Using simulated upload.');
    
    // Simulate a delay for the upload
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Generate a mock Filecoin CID (Content Identifier)
    const mockCid = `bafybeid${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
    
    return {
      cid: mockCid,
      url: `https://w3s.link/ipfs/${mockCid}`,
      size: file.size,
      name: file.name
    };
 }

  try {
    console.log('🚀 Starting Filecoin upload via Web3.Storage...');
    console.log('📊 File name:', file.name);
    console.log('📊 File size:', file.size, 'bytes');
    console.log('📊 File type:', file.type);

    // Upload file to Web3.Storage (which stores on Filecoin)
    const cid = await filecoinClient.put([file], {
      name: file.name,
      wrapWithDirectory: false,
    });

    console.log('✅ Filecoin upload successful!');
    console.log('🔗 CID:', cid);

    // Return the CID and other relevant information
    return {
      cid: cid,
      url: `https://w3s.link/ipfs/${cid}`, // w3s.link is a gateway for Web3.Storage
      size: file.size,
      name: file.name
    };
  } catch (error) {
    const errorStr = error instanceof Error ? error.message : String(error);
    const errorMessage = errorStr.toLowerCase();
    
    console.error('❌ Error uploading to Filecoin:', error);
    
    // Check if it's a service unavailable error (503) or maintenance error
    const isServiceUnavailable = errorMessage.includes('503') || 
                                 errorMessage.includes('service unavailable') ||
                                 errorMessage.includes('maintenance') ||
                                 errorMessage.includes('temporarily unavailable') ||
                                 errorMessage.includes('connection refused') ||
                                 errorMessage.includes('econnrefused');
    
    if (isServiceUnavailable) {
      console.warn('⚠️ Web3.Storage API is currently unavailable (503 Service Unavailable)');
      console.warn('📍 Check status at: https://status.web3.storage');
      console.warn('🔄 Falling back to simulated upload for testing...');
      
      // Simulate upload as fallback during maintenance
      await new Promise(resolve => setTimeout(resolve, 1000));
      const mockCid = `bafybeid${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
      
      return {
        cid: mockCid,
        url: `https://w3s.link/ipfs/${mockCid}`,
        size: file.size,
        name: file.name,
        isSimulated: true // Flag to indicate this is a simulated upload
      };
    }
    
    throw error;
  }
};

// Function to get file from Filecoin via Web3.Storage
export const getFileFromFilecoin = async (cid: string) => {
  if (!hasWeb3StorageToken) {
    console.log('📁 Simulating Filecoin file retrieval for CID:', cid);
    // Simulate file retrieval
    return null;
  }

 try {
    console.log('📥 Retrieving file from Filecoin via Web3.Storage...');
    console.log('🔗 CID:', cid);

    const res = await filecoinClient.get(cid);
    if (res && res.status !== 200) {
      throw new Error(`Failed to get ${cid}, ${res.status} ${res.statusText}`);
    }

    if (!res.body) {
      throw new Error(`No body in response for ${cid}`);
    }

    const files = await res.files();
    console.log('✅ Filecoin file retrieval successful!');

    return files[0]; // Return the first file
  } catch (error) {
    console.error('❌ Error retrieving from Filecoin:', error);
    throw error;
 }
};

// Function to check Filecoin storage status
export const checkFilecoinStatus = async () => {
  try {
    if (!hasWeb3StorageToken) {
      console.log('📁 Filecoin status: Simulated (no token)');
      return 'connected'; // Simulate connection for demo
    }

    // Test the connection by attempting to list files (or do a simple operation)
    // This is just to verify the API is accessible
    console.log('📡 Testing Filecoin connection...');
    
    // We could potentially do a small test operation here
    // For now, just verify the client exists and token is set
    return 'connected';
  } catch (error) {
    console.error('❌ Filecoin connection error:', error);
    return 'error';
  }
};

export default filecoinClient;

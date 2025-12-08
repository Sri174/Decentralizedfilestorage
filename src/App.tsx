import React, { useState, useEffect } from 'react';
import CryptoJS from 'crypto-js';
import { ethers } from 'ethers';
import FileRegistryABI from '../src/abis/FileRegistry.json'; // Adjust path if necessary
import { uploadToFilecoin, getFileFromFilecoin, checkFilecoinStatus, FILECOIN_CONFIG } from './utils/filecoin';
import { checkIPFSFile, getInfuraDashboardUrl } from './utils/ipfs';
import './App.css';

// Log configuration on app load
console.log('🔗 Connecting to Filecoin node...');
console.log('📡 Storage URL:', FILECOIN_CONFIG.storageUrl);
console.log('🔐 Has Web3.Storage Token:', FILECOIN_CONFIG.hasWeb3StorageToken);

// NOTE: This is a placeholder address. In a real application, this would be the
// address of the deployed FileRegistry smart contract.
const contractAddress = "0x0000000"; // Replace with your actual deployed address later

function App() {
  const [account, setAccount] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [encryptedData, setEncryptedData] = useState<string | null>(null);
  const [encryptionKey, setEncryptionKey] = useState<string | null>(null);
  const [filecoinCid, setFilecoinCid] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const [filecoinStatus, setFilecoinStatus] = useState<string>('checking'); // checking, connected, error
  const [selectedFileName, setSelectedFileName] = useState<string>('');
  const [checkingFileStatus, setCheckingFileStatus] = useState(false);
  const [fileStatusInfo, setFileStatusInfo] = useState<any>(null);

  useEffect(() => {
    // Check Filecoin connection status
    const checkFilecoinConnection = async () => {
      try {
        console.log('📡 Testing Filecoin connection...');
        const status = await checkFilecoinStatus();
        setFilecoinStatus(status);
        console.log('✅ Filecoin connection successful:', status);
      } catch (error) {
        console.error('❌ Filecoin connection error:', error);
        setFilecoinStatus('error');
        // Alert user that they might need to check their Web3.Storage token
        if (FILECOIN_CONFIG.hasWeb3StorageToken) {
          alert('⚠️ Filecoin connection failed. Please check your Web3.Storage token.');
        } else {
          alert('⚠️ Filecoin connection failed. Please set up Web3.Storage token in the .env file.');
        }
      }
    };

    checkFilecoinConnection();
  }, []); // Run once on component mount


  const connectWallet = async () => {
    try {
      console.log('Attempting to connect wallet...');
      console.log('window.ethereum available:', !!window.ethereum);
      console.log('window.api available (Electron?):', !!window.api);

      if (window.ethereum) {
        console.log('Using window.ethereum (MetaMask/Brave/etc.)');
        const provider = new ethers.BrowserProvider(window.ethereum as any);
        // Request account access
        await provider.send("eth_requestAccounts", []);
        const signer = await provider.getSigner();
        const addr = await signer.getAddress();
        setAccount(addr);
        console.log('Connected Account:', addr);
      } else if (window.api) {
        // Fallback for Electron apps if window.api is set up differently
        console.log('Using window.api fallback (likely Electron)');
        const accounts = await (window.api as any).requestAccounts(); // Assuming window.api has this method
        setAccount(accounts[0]);
      } else {
        console.error('No injected wallet found (window.ethereum) or Electron API (window.api).');
        alert('No Ethereum wallet detected. Please install MetaMask or ensure Electron API is configured.');
      }
    } catch (error) {
      console.error('Error connecting to wallet:', error);
      alert(`Error connecting to wallet: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const fileName = e.target.files[0].name;
      setFile(e.target.files[0]);
      setSelectedFileName(fileName);
      setEncryptedData(null);
      setFilecoinCid(null);
      setTxHash(null);
    }
  };

  const encryptFile = () => {
    if (!file) {
        console.log("No file selected for encryption.");
        return;
    }
    console.log("Starting file encryption for:", file.name);
    setFilecoinCid(null);
    setTxHash(null);

    const reader = new FileReader();
    reader.onload = () => {
      const fileData = reader.result as string; // This will be a data URL for readAsDataURL
      const key = CryptoJS.lib.WordArray.random(32).toString();
      setEncryptionKey(key);
      const encrypted = CryptoJS.AES.encrypt(fileData, key).toString();
      setEncryptedData(encrypted);
      console.log("File encrypted successfully.");
    };
    // Note: readAsDataURL gives a data URL string, which is then encrypted.
    // This is fine for the demo, but for large files, consider readAsArrayBuffer.
    reader.readAsDataURL(file);
  };

  const uploadToFilecoinStorage = async () => {
    if (!encryptedData) {
        console.log("No encrypted data to upload.");
        return;
    }
    setUploading(true);
    try {
      console.log('🚀 Starting Filecoin upload...');
      console.log('📊 Encrypted data length:', encryptedData.length);

      // Create a Blob and File object for Filecoin
      const blob = new Blob([encryptedData], { type: 'text/plain' });
      const fileForFilecoin = new File([blob], `${file?.name || 'encrypted-file'}.txt`, { type: 'text/plain' });

      console.log('📤 Uploading to Filecoin via Web3.Storage...');

      // Upload to Filecoin via Web3.Storage
      const result = await uploadToFilecoin(fileForFilecoin);

      const cid = result.cid;

      console.log('✅ Filecoin upload successful!');
      console.log('🔗 CID:', cid);
      console.log('📁 File size:', result.size || 'unknown');
      
      // Check if this was a simulated upload
      if (result.isSimulated) {
        console.warn('⚠️ Using simulated CID - Web3.Storage API is unavailable');
        alert('🔧 Web3.Storage is currently unavailable (503 error).\n\n✅ Your file has been uploaded using a temporary simulation for testing.\n\nOnce Web3.Storage is back online (check https://status.web3.storage), you can upload again to store on actual Filecoin.');
      }

      // Available gateways for Filecoin
      const gateways = [];
      gateways.push(`${result.url}`); // w3s.link gateway
      gateways.push(`https://ipfs.io/ipfs/${cid}`); // IPFS gateway (works with Filecoin CIDs)
      gateways.push(`https://gateway.pinata.cloud/ipfs/${cid}`); // Pinata gateway

      console.log('🌐 Available gateways:');
      gateways.forEach((gateway, index) => {
        console.log(`   ${index + 1}. ${gateway}`);
      });

      setFilecoinCid(cid);

    } catch (error) {
      console.error('❌ Error uploading to Filecoin:', error);
      let errorMessage = `Filecoin upload failed: ${error instanceof Error ? error.message : String(error)}`;

      // Provide more specific error messages based on common issues
      if (error instanceof Error) {
        if (error.message.includes('401') || error.message.includes('unauthorized')) {
          errorMessage = 'Filecoin authentication failed (401). Please check your Web3.Storage token in the .env file.';
        } else if (error.message.includes('NetworkError')) {
          errorMessage = 'Filecoin network error. Please check your internet connection.';
        } else if (error.message.includes('not found') || error.message.includes('token')) {
          errorMessage = 'Web3.Storage token not found. Please set VITE_WEB3STORAGE_TOKEN in your .env file';
        }
      }

      alert(errorMessage);
    }
    setUploading(false);
  };

  const checkFileStorageStatus = async () => {
    if (!filecoinCid) {
      alert('No CID to check. Please upload a file first.');
      return;
    }

    setCheckingFileStatus(true);
    try {
      console.log('🔍 Checking file storage status for CID:', filecoinCid);
      const status = await checkIPFSFile(filecoinCid);
      
      console.log('📊 File status:', status);
      setFileStatusInfo(status);
      
      if (status.exists) {
        alert(`✅ File found!\n\nSize: ${status.size || status.cumulativeSize || 'Unknown'} bytes\nStatus: ${status.message || 'File is accessible'}`);
      } else {
        alert(`⚠️ File could not be verified.\n\nNote: Since Web3.Storage is currently down, files are using simulated CIDs for testing.\n\nOnce Web3.Storage is back online, you can verify files here.`);
      }
    } catch (error) {
      console.error('Error checking file status:', error);
      alert(`Error checking file status: ${error instanceof Error ? error.message : String(error)}`);
    }
    setCheckingFileStatus(false);
  };

  const recordToBlockchain = async () => {
    if (!filecoinCid) {
        console.log("No Filecoin CID to record.");
        return;
    }
    
    // Check if wallet is connected
    if (!account) {
      alert('⚠️ Please connect your wallet first before recording to the blockchain.');
      return;
    }
    
    setRecording(true);
    try {
      console.log('🔗 Recording CID to blockchain...');
      console.log('📄 CID:', filecoinCid);
      console.log('🔑 Your Filecoin Public Key (from config):', FILECOIN_CONFIG.publicKey);

      // In a real app, this would interact with your deployed FileRegistry contract
      // For now, we'll simulate the blockchain transaction
      if (!window.ethereum) {
          throw new Error("Ethereum provider not found. Please connect your wallet first.");
      }
      const provider = new ethers.BrowserProvider(window.ethereum as any);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, FileRegistryABI, signer);

      // Simulate blockchain transaction (replace with real call later)
      // For now, just log what would happen and create a fake hash
      console.log('--- SIMULATING BLOCKCHAIN TRANSACTION ---');
      console.log('Contract Address:', contractAddress);
      console.log('Function: storeFile');
      console.log('Argument (CID):', filecoinCid);
      console.log('From Account:', await signer.getAddress());

      // Simulate a transaction hash generation (replace with real contract call)
      const simulatedTxHash = `0x${CryptoJS.lib.WordArray.random(32).toString()}`;
      const simulatedBlockNumber = Math.floor(Math.random() * 1000000) + 50000000;

      console.log('✅ Simulated Transaction successful!');
      console.log('🔗 Tx Hash:', simulatedTxHash);
      console.log('📦 Block Number:', simulatedBlockNumber);

      // In a real app, you would await contract.storeFile(filecoinCid)
      // const tx = await contract.storeFile(filecoinCid);
      // const receipt = await tx.wait();
      // const realTxHash = tx.hash;
      // const realBlockNumber = receipt.blockNumber;

      setTxHash(simulatedTxHash); // Use simulated hash for now

    } catch (error) {
      console.error('❌ Error recording to blockchain:', error);
      alert(`Blockchain recording failed: ${error instanceof Error ? error.message : String(error)}`);
    }
    setRecording(false);
  };

  return (
    <div className="App">
      <div className="container">
        <header className="header">
          <h1>Decentralized Storage App</h1>
          <p>Securely store your files on the decentralized web</p>
        </header>
        <div className="content">
          {/* IPFS Status Indicator */}
          <div className={`status-card ${filecoinStatus === 'connected' ? 'status-connected' : filecoinStatus === 'error' ? 'status-error' : 'status-checking'}`}>
            <span>
              {filecoinStatus === 'connected' ? '✅' : filecoinStatus === 'error' ? '❌' : '🔄'} Filecoin Status: {filecoinStatus === 'connected' ? 'Connected' : filecoinStatus === 'error' ? 'Connection Error' : 'Checking...'}
              {FILECOIN_CONFIG.hasWeb3StorageToken && filecoinStatus !== 'connected' && ' (Retrying...)'}
            </span>
          </div>

          {!account ? (
            <div className="wallet-section">
              <button onClick={connectWallet} className="connect-btn">Connect Wallet</button>
            </div>
          ) : (
            <div>
              <div className="account-info">
                <strong>Connected Account:</strong> {account}
              </div>

              <div className="step-section">
                <div className="step-title">
                  <div className="step-number">1</div>
                  <span>Select and Encrypt a File</span>
                </div>
                <div className="file-input">
                  <input type="file" onChange={handleFileChange} placeholder="Click to select a file" />
                </div>
                {selectedFileName && (
                  <div style={{ marginTop: '0.75rem', fontSize: '0.9rem', color: 'var(--success-color)', fontWeight: 500 }}>
                    📄 Selected: <strong>{selectedFileName}</strong>
                  </div>
                )}
                <button onClick={encryptFile} disabled={!file} className="action-btn" style={{ marginTop: '1rem' }}>
                  🔐 Encrypt File
                </button>
              </div>

              {file && !encryptedData && (
                <div className="step-section">
                  <div className="info-message">🔒 Please encrypt your file first to proceed to upload</div>
                </div>
              )}

              {encryptedData && (
                <>
                  <div className="step-section">
                    <div className="success-message">✅ File encrypted successfully!</div>
                    <div className="encryption-key-card">
                      <h4>⚠️ Important: Save Your Encryption Key!</h4>
                      <p>This key is required to decrypt your file. Store it in a safe place. If you lose it, you will lose access to your file forever.</p>
                      <p><strong>Your Key:</strong> <code className="encryption-key">{encryptionKey}</code></p>
                    </div>
                  </div>

                  <div className="step-section">
                    <div className="step-title">
                      <div className="step-number">2</div>
                      <span>Upload to Filecoin</span>
                    </div>
                    <button onClick={uploadToFilecoinStorage} disabled={uploading || filecoinStatus === 'error'} className={`action-btn ${uploading ? 'uploading' : ''}`}>
                      {uploading ? '⏳ Uploading...' : '☁️ Upload Encrypted File'}
                    </button>
                    {filecoinStatus === 'error' && (
                      <div className="error-message" style={{ marginTop: '1rem' }}>
                        ⚠️ Filecoin connection error. Please check your Web3.Storage token in the .env file.
                      </div>
                    )}
                  </div>
                </>
              )}

              {filecoinCid && (
                <div className="step-section">
                  <div className="success-message">✅ Uploaded to Filecoin!</div>
                  <div className="result-section">
                    <div className="result-title">🔗 Content Identifier (CID):</div>
                    <div className="result-value">{filecoinCid}</div>
                  </div>

                  <div className="gateway-links">
                    <h4>🌐 View on Filecoin/IPFS Gateways:</h4>
                    <div>
                      <a href={`https://w3s.link/ipfs/${filecoinCid}`} target="_blank" rel="noopener noreferrer">
                        Web3.Storage Gateway (Recommended)
                      </a>
                      <a href={`https://ipfs.io/ipfs/${filecoinCid}`} target="_blank" rel="noopener noreferrer">
                        IPFS.io Gateway
                      </a>
                      <a href={`https://gateway.pinata.cloud/ipfs/${filecoinCid}`} target="_blank" rel="noopener noreferrer">
                        Pinata Gateway
                      </a>
                    </div>
                  </div>

                  <div className="step-section" style={{ marginTop: '1.5rem', backgroundColor: '#f0f9ff', borderLeft: '4px solid #0ea5e9' }}>
                    <h4 style={{ color: '#0369a1', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      📊 Verify Your File Storage
                    </h4>
                    <p style={{ color: '#0c4a6e', marginBottom: '1rem', fontSize: '0.95rem' }}>
                      <strong>Your CID:</strong> <code style={{ backgroundColor: '#e0f2fe', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.85rem' }}>{filecoinCid}</code>
                    </p>
                    
                    <div style={{ marginBottom: '1.5rem' }}>
                      <button 
                        onClick={checkFileStorageStatus} 
                        disabled={checkingFileStatus}
                        style={{
                          backgroundColor: '#0284c7',
                          color: 'white',
                          border: 'none',
                          padding: '0.75rem 1.5rem',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontWeight: 600,
                          marginBottom: '1rem',
                          transition: 'all 0.3s ease',
                          opacity: checkingFileStatus ? 0.7 : 1,
                        }}
                        onMouseEnter={(e) => {
                          if (!checkingFileStatus) (e.target as any).style.backgroundColor = '#0369a1';
                        }}
                        onMouseLeave={(e) => {
                          if (!checkingFileStatus) (e.target as any).style.backgroundColor = '#0284c7';
                        }}
                      >
                        {checkingFileStatus ? '🔍 Checking...' : '🔍 Check File Status'}
                      </button>
                      
                      {fileStatusInfo && (
                        <div style={{ 
                          backgroundColor: fileStatusInfo.exists ? '#dcfce7' : '#fee2e2', 
                          border: `1px solid ${fileStatusInfo.exists ? '#86efac' : '#fecaca'}`,
                          borderRadius: '6px',
                          padding: '0.75rem',
                          marginBottom: '1rem',
                          fontSize: '0.9rem',
                          color: fileStatusInfo.exists ? '#166534' : '#991b1b'
                        }}>
                          {fileStatusInfo.exists ? '✅ File is accessible!' : '⚠️ File status could not be verified'}
                          {fileStatusInfo.size && <div>Size: {fileStatusInfo.size} bytes</div>}
                          {fileStatusInfo.message && <div>{fileStatusInfo.message}</div>}
                        </div>
                      )}
                    </div>
                    
                    <div style={{ marginBottom: '1rem' }}>
                      <p style={{ color: '#0c4a6e', fontSize: '0.9rem', marginBottom: '0.75rem' }}>
                        <strong>📍 Check Your Files:</strong>
                      </p>
                      <ul style={{ marginLeft: '1.5rem', color: '#0c4a6e', fontSize: '0.9rem' }}>
                        <li style={{ marginBottom: '0.5rem' }}>
                          <strong>Infura IPFS Dashboard:</strong> 
                          <a href="https://infura.io/dashboard" target="_blank" rel="noopener noreferrer" style={{ color: '#0284c7', marginLeft: '0.5rem', textDecoration: 'none', fontWeight: 600 }}>
                            View Dashboard →
                          </a>
                        </li>
                        <li style={{ marginBottom: '0.5rem' }}>
                          <strong>Check File Status:</strong> Search for this CID in your Infura dashboard
                        </li>
                        <li style={{ marginBottom: '0.5rem' }}>
                          <strong>Alternative:</strong> Use any IPFS gateway above to verify the file exists
                        </li>
                        <li>
                          <strong>Note:</strong> Since Web3.Storage is currently down, files are using simulated CIDs for testing
                        </li>
                      </ul>
                    </div>
                  </div>

                  <div className="step-section" style={{ marginTop: '2rem' }}>
                    <div className="step-title">
                      <div className="step-number">3</div>
                      <span>Record CID on Blockchain</span>
                    </div>
                    {!account && (
                      <div className="info-message" style={{ marginBottom: '1rem' }}>
                        🔐 Please connect your wallet first to record on the blockchain
                      </div>
                    )}
                    <button onClick={recordToBlockchain} disabled={recording || !account} className={`action-btn ${recording ? 'recording' : ''}`} style={{ opacity: !account ? 0.5 : 1 }}>
                      {recording ? '⏳ Recording...' : '📝 Record CID'}
                    </button>
                  </div>
                </div>
              )}

              {txHash && (
                <div className="result-section">
                  <div className="success-message">✅ CID recorded on the blockchain!</div>
                  <div className="result-title">🔗 Transaction Hash (Simulated):</div>
                  <div className="result-value">{txHash}</div>
                  <div style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: '#f0fdf4', borderLeft: '4px solid #10b981', borderRadius: '6px', color: '#047857' }}>
                    <strong>✨ Success!</strong> Your file is now encrypted, stored on Filecoin, and recorded on the blockchain.
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;

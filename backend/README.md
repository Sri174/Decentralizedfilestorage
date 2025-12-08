# Decentralized Storage - Backend

Smart contracts for the decentralized storage application built with Hardhat.

## Setup

```bash
npm install
```

## Compile Contracts

```bash
npm run compile
```

## Deploy Contracts

### Local Development (Hardhat Network)
```bash
# Start local node
npm run node

# In another terminal, deploy
npm run deploy
```

### Deploy to Testnet/Mainnet
Update `hardhat.config.ts` with network configuration and run:
```bash
npx hardhat run scripts/deploy.js --network <network-name>
```

## Test

```bash
npm test
```

## Contract

- **FileRegistry.sol**: Stores IPFS file CIDs mapped to user addresses

The deployed contract address and ABI will be automatically saved to `../frontend/src/abis/FileRegistry.json` for frontend integration.

# Contract Verification Information

## Contract Details
- **Contract Address**: `0x416C2576770d686CC165dfF1139b7ed2e7fA2E92`
- **Network**: Monad Testnet (Chain ID: 10143)
- **Contract Name**: `MouthGameNFT`
- **Compiler Version**: `^0.8.20`
- **Optimization**: Enabled (200 runs)
- **License**: MIT

## Manual Verification Steps

Since automated verification is currently failing due to TLS connectivity issues with the Monad explorer API, you'll need to verify manually:

### 1. Visit the Manual Verification Page
Go to: https://testnet.monadexplorer.com/verify-contract

OR visit your contract page first:
https://testnet.monadexplorer.com/address/0x416C2576770d686CC165dfF1139b7ed2e7fA2E92

### 2. Navigate to Contract Tab
- Click on the "Contract" tab
- Click "Verify and Publish"

### 3. Verification Settings
- **Compiler Type**: Solidity (Single file)
- **Compiler Version**: ^0.8.20 (or the exact version used)
- **Open Source License Type**: MIT
- **Optimization**: Yes (200 runs)

### 4. Contract Source Code
Use the flattened contract located at:
```
flattened/MouthGameNFT_flattened.sol
```

This file contains all dependencies flattened into a single file (~5,432 lines).

### 5. Constructor Arguments
This is an upgradeable proxy contract, so constructor arguments may not be needed. If required, check the deployment logs.

## Verification Files
- **Main Contract**: `src/MouthGameNFT.sol`
- **Flattened Contract**: `flattened/MouthGameNFT_flattened.sol` (ready for verification)

## Troubleshooting
If manual verification still fails:
1. Try waiting a few hours and retry - the API may be temporarily down
2. Check if there are alternative explorer endpoints for Monad
3. Contact Monad team for verification support
4. The contract is deployed and functional even without verification

## Alternative Verification Commands
You can also try these automated commands when the API is working:
```bash
make verify-monad-retry    # Retry with delays
make verify-monad-explorer # Original explorer method
make verify-monad-debug    # Test connectivity first
```
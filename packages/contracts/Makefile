# Load environment variables
include .env
export

# Default target
.PHONY: help
help:
	@echo "Available commands:"
	@echo "  make build              - Build the contracts"
	@echo "  make test               - Run tests"
	@echo "  make deploy-local       - Deploy to local network"
	@echo "  make deploy-monad       - Deploy to Monad testnet"
	@echo "  make deploy-sepolia     - Deploy to Sepolia testnet"
	@echo "  make upgrade-monad      - Upgrade contract on Monad testnet"
	@echo "  make update-uri-monad   - Update base URIs on Monad testnet"
	@echo "  make verify-monad       - Verify contract on Monad testnet (multiple methods)"
	@echo "  make verify-monad-explorer - Verify contract on Monad testnet (using explorer)"
	@echo "  make verify-monad-retry - Verify contract on Monad testnet (with retry)"
	@echo "  make verify-monad-manual - Show manual verification instructions"
	@echo "  make clean              - Clean build artifacts"

# Build contracts
.PHONY: build
build:
	forge build

# Run tests
.PHONY: test
test:
	forge test -vv

# Deploy to local network (anvil)
.PHONY: deploy-local
deploy-local:
	@echo "Starting local deployment..."
	@mkdir -p deployments
	NETWORK_NAME=localhost forge script script/DeployMouthGameNFT.s.sol:DeployMouthGameNFT \
		--rpc-url http://localhost:8545 \
		--private-key $(PRIVATE_KEY) \
		--broadcast \
		--verify \
		-vvvv
	@if [ -f "./deployments/latest.json" ]; then \
		PROXY_ADDR=$$(cat ./deployments/latest.json | jq -r '.proxy'); \
		echo "Updating .env with PROXY_ADDRESS=$$PROXY_ADDR"; \
		sed -i.bak 's/^PROXY_ADDRESS=.*/PROXY_ADDRESS='$$PROXY_ADDR'/' .env || echo "PROXY_ADDRESS=$$PROXY_ADDR" >> .env; \
	fi

# Deploy to Monad testnet
.PHONY: deploy-monad
deploy-monad:
	@echo "Deploying to Monad testnet..."
	@mkdir -p deployments
	NETWORK_NAME=monad-testnet forge script script/DeployMouthGameNFT.s.sol:DeployMouthGameNFT \
		--rpc-url $(MONAD_TESTNET_RPC) \
		--private-key $(PRIVATE_KEY) \
		--broadcast \
		-vvvv
	@if [ -f "./deployments/latest.json" ]; then \
		PROXY_ADDR=$$(cat ./deployments/latest.json | jq -r '.proxy'); \
		echo "Updating .env with PROXY_ADDRESS=$$PROXY_ADDR"; \
		sed -i.bak 's/^PROXY_ADDRESS=.*/PROXY_ADDRESS='$$PROXY_ADDR'/' .env || echo "PROXY_ADDRESS=$$PROXY_ADDR" >> .env; \
	fi

# Deploy to Sepolia testnet
.PHONY: deploy-sepolia
deploy-sepolia:
	@echo "Deploying to Sepolia testnet..."
	@mkdir -p deployments
	NETWORK_NAME=sepolia forge script script/DeployMouthGameNFT.s.sol:DeployMouthGameNFT \
		--rpc-url $(SEPOLIA_RPC) \
		--private-key $(PRIVATE_KEY) \
		--broadcast \
		--verify \
		--etherscan-api-key $(ETHERSCAN_API_KEY) \
		-vvvv
	@if [ -f "./deployments/latest.json" ]; then \
		PROXY_ADDR=$$(cat ./deployments/latest.json | jq -r '.proxy'); \
		echo "Updating .env with PROXY_ADDRESS=$$PROXY_ADDR"; \
		sed -i.bak 's/^PROXY_ADDRESS=.*/PROXY_ADDRESS='$$PROXY_ADDR'/' .env || echo "PROXY_ADDRESS=$$PROXY_ADDR" >> .env; \
	fi

# Upgrade contract on Monad testnet
.PHONY: upgrade-monad
upgrade-monad:
	@echo "Upgrading contract on Monad testnet..."
	@echo "Proxy address: $(PROXY_ADDRESS)"
	forge script script/UpgradeMouthGameNFT.s.sol:UpgradeMouthGameNFT \
		--rpc-url $(MONAD_TESTNET_RPC) \
		--private-key $(PRIVATE_KEY) \
		--broadcast \
		--verify \
		--verifier-url https://testnet.monadexplorer.com/api \
		--etherscan-api-key $(ETHERSCAN_API_KEY) \
		-vvvv

# Update base URIs on Monad testnet
.PHONY: update-uri-monad
update-uri-monad:
	@echo "Updating base URIs on Monad testnet..."
	@echo "Proxy address: $(PROXY_ADDRESS)"
	forge script script/UpdateBaseURI.s.sol:UpdateBaseURI \
		--rpc-url $(MONAD_TESTNET_RPC) \
		--private-key $(PRIVATE_KEY) \
		--broadcast \
		-vvvv

# Verify contract on Monad testnet (try multiple methods)
.PHONY: verify-monad
verify-monad:
	@echo "Verifying contract on Monad testnet..."
	@echo "Method 1: Attempting verification with custom verifier URL..."
	@forge verify-contract \
		--rpc-url $(MONAD_TESTNET_RPC) \
		--verifier-url https://testnet.monadexplorer.com/api \
		--etherscan-api-key $(ETHERSCAN_API_KEY) \
		$(PROXY_ADDRESS) \
		src/MouthGameNFT.sol:MouthGameNFT || \
	echo "Method 1 failed, trying Method 2..." && \
	forge verify-contract \
		--rpc-url $(MONAD_TESTNET_RPC) \
		--verifier blockscout \
		--verifier-url https://testnet.monadexplorer.com/api \
		$(PROXY_ADDRESS) \
		src/MouthGameNFT.sol:MouthGameNFT || \
	echo "Method 2 failed, contract verification may need to be done manually"

# Verify contract on Monad testnet using explorer (fallback)
.PHONY: verify-monad-explorer
verify-monad-explorer:
	@echo "Verifying contract on Monad testnet explorer..."
	forge verify-contract \
		--rpc-url $(MONAD_TESTNET_RPC) \
		--verifier-url https://testnet.monadexplorer.com/api \
		--etherscan-api-key $(ETHERSCAN_API_KEY) \
		$(PROXY_ADDRESS) \
		src/MouthGameNFT.sol:MouthGameNFT

# Verify contract on Monad testnet with retry (macOS compatible)
.PHONY: verify-monad-retry
verify-monad-retry:
	@echo "Verifying contract on Monad testnet with retry..."
	@for i in 1 2 3 4 5; do \
		echo "Attempt $$i of 5..."; \
		forge verify-contract \
			--rpc-url $(MONAD_TESTNET_RPC) \
			--verifier-url https://testnet.monadexplorer.com/api \
			--etherscan-api-key $(ETHERSCAN_API_KEY) \
			$(PROXY_ADDRESS) \
			src/MouthGameNFT.sol:MouthGameNFT && break || \
		(echo "Attempt $$i failed, waiting 15 seconds..." && sleep 15); \
	done

# Try verification with manual API call (debugging)
.PHONY: verify-monad-debug
verify-monad-debug:
	@echo "Testing Monad explorer API connectivity..."
	@echo "Checking if API endpoint is reachable..."
	@curl -s --connect-timeout 10 -w "HTTP Status: %{http_code}\nTime: %{time_total}s\n" https://testnet.monadexplorer.com/api || echo "Connection failed"
	@echo "Attempting verification..."
	forge verify-contract \
		--rpc-url $(MONAD_TESTNET_RPC) \
		--verifier-url https://testnet.monadexplorer.com/api \
		--etherscan-api-key $(ETHERSCAN_API_KEY) \
		$(PROXY_ADDRESS) \
		src/MouthGameNFT.sol:MouthGameNFT \
		--watch

# Show manual verification instructions
.PHONY: verify-monad-manual
verify-monad-manual:
	@echo "=== Manual Verification Instructions ==="
	@echo "Contract Address: $(PROXY_ADDRESS)"
	@echo "Network: Monad Testnet (Chain ID: 10143)"
	@echo "Contract Name: MouthGameNFT"
	@echo "Compiler Version: $$(grep 'pragma solidity' src/MouthGameNFT.sol | head -1 | sed 's/.*solidity //' | sed 's/;//' || echo '^0.8.20')"
	@echo ""
	@echo "1. Visit: https://testnet.monadexplorer.com/verify-contract"
	@echo "   OR visit your contract: https://testnet.monadexplorer.com/address/$(PROXY_ADDRESS)"
	@echo "2. Click on 'Contract' tab"
	@echo "3. Click 'Verify and Publish'"
	@echo "4. Select 'Solidity (Single file)' or 'Solidity (Standard JSON Input)'"
	@echo ""
	@echo "Contract Source Code Location:"
	@echo "  - Main Contract: src/MouthGameNFT.sol"
	@echo "  - Import paths may need to be flattened"
	@echo ""
	@echo "To flatten the contract for manual verification:"
	@echo "  forge flatten src/MouthGameNFT.sol > flattened/MouthGameNFT_flattened.sol"
	@echo ""
	@echo "Constructor Arguments (if needed):"
	@echo "  Check deployment logs or run: forge script script/GetConstructorArgs.s.sol"

# Flatten contract for manual verification
.PHONY: flatten
flatten:
	@echo "Flattening contract for manual verification..."
	@mkdir -p flattened
	@forge flatten src/MouthGameNFT.sol > flattened/MouthGameNFT_flattened.sol
	@echo "Flattened contract saved to: flattened/MouthGameNFT_flattened.sol"
	@echo "You can now copy this code for manual verification"

# Start local node
.PHONY: node
node:
	anvil --host 0.0.0.0 --port 8545

# Clean build artifacts
.PHONY: clean
clean:
	forge clean
	rm -rf deployments/*.json

# Install dependencies
.PHONY: install
install:
	forge install

# Update dependencies
.PHONY: update
update:
	forge update

# Generate ABI files for frontend
.PHONY: abi
abi:
	@echo "Generating ABI files..."
	@mkdir -p ../mouthGame/src/contracts/abi
	@cat out/MouthGameNFT.sol/MouthGameNFT.json | jq '.abi' > ../mouthGame/src/contracts/abi/MouthGameNFT.json
	@echo "ABI files generated in ../mouthGame/src/contracts/abi/"
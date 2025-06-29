// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../src/MouthGameNFT.sol";

/**
 * @title UpgradeMouthGameNFT
 * @dev Script to upgrade the MouthGameNFT contract
 */
contract UpgradeMouthGameNFT is Script {
    function run() external {
        // Get the upgrader's private key from environment
        uint256 upgraderPrivateKey = vm.envUint("PRIVATE_KEY");
        address upgrader = vm.addr(upgraderPrivateKey);
        
        // Get the proxy address from environment
        address proxyAddress = vm.envAddress("PROXY_ADDRESS");
        
        console.log("Upgrading contract with account:", upgrader);
        console.log("Proxy address:", proxyAddress);
        
        vm.startBroadcast(upgraderPrivateKey);
        
        // Deploy new implementation
        MouthGameNFT newImplementation = new MouthGameNFT();
        console.log("New implementation deployed at:", address(newImplementation));
        
        // Get the current implementation for comparison
        bytes32 implementationSlot = bytes32(uint256(keccak256("eip1967.proxy.implementation")) - 1);
        address currentImplementation = address(uint160(uint256(vm.load(proxyAddress, implementationSlot))));
        console.log("Current implementation:", currentImplementation);
        
        // Upgrade the proxy to point to the new implementation
        MouthGameNFT proxy = MouthGameNFT(proxyAddress);
        proxy.upgradeToAndCall(address(newImplementation), "");
        
        // Verify the upgrade
        address updatedImplementation = address(uint160(uint256(vm.load(proxyAddress, implementationSlot))));
        console.log("Updated implementation:", updatedImplementation);
        
        require(
            updatedImplementation == address(newImplementation),
            "Upgrade failed: implementation not updated"
        );
        
        // Verify the contract still works
        console.log("Contract name after upgrade:", proxy.name());
        console.log("Contract symbol after upgrade:", proxy.symbol());
        
        vm.stopBroadcast();
        
        // Save upgrade info
        string memory upgradeInfo = string(abi.encodePacked(
            "{\n",
            '  "previousImplementation": "', vm.toString(currentImplementation), '",\n',
            '  "newImplementation": "', vm.toString(address(newImplementation)), '",\n',
            '  "proxy": "', vm.toString(proxyAddress), '",\n',
            '  "upgrader": "', vm.toString(upgrader), '",\n',
            '  "timestamp": ', vm.toString(block.timestamp), ',\n',
            '  "network": "', vm.envString("NETWORK_NAME"), '"\n',
            "}"
        ));
        
        string memory filename = string(abi.encodePacked(
            "./deployments/upgrade_",
            vm.toString(block.timestamp),
            ".json"
        ));
        vm.writeFile(filename, upgradeInfo);
        console.log("Upgrade info saved to", filename);
    }
}
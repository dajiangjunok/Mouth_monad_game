// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../src/MouthGameNFT.sol";

/**
 * @title UpdateBaseURI
 * @dev Script to update the base URIs for existing deployed contract
 */
contract UpdateBaseURI is Script {
    // 新的URI地址
    string constant NEW_CLOSED_MOUTH_BASE_URI = "ipfs://bafkreie3swmwang3rgfy4smb2nd2x72ysxy7qrtz7nqfwq3kufvhmoexvi";
    string constant NEW_OPEN_MOUTH_BASE_URI = "ipfs://bafkreie7jifh5xxtgw37szbdtjdiucuwv6p62awth6y44u2ztkmrkoymui";
    
    function run() external {
        // Get the owner's private key from environment
        uint256 ownerPrivateKey = vm.envUint("PRIVATE_KEY");
        address owner = vm.addr(ownerPrivateKey);
        
        // Get the proxy address from environment
        address proxyAddress = vm.envAddress("PROXY_ADDRESS");
        
        console.log("Updating base URIs with account:", owner);
        console.log("Proxy address:", proxyAddress);
        
        vm.startBroadcast(ownerPrivateKey);
        
        // Get the proxy contract instance
        MouthGameNFT mouthGameNFT = MouthGameNFT(proxyAddress);
        
        // Update closed mouth base URI
        mouthGameNFT.updateBaseURI(MouthGameNFT.NFTType.CLOSED_MOUTH, NEW_CLOSED_MOUTH_BASE_URI);
        console.log("Updated closed mouth base URI to:", NEW_CLOSED_MOUTH_BASE_URI);
        
        // Update open mouth base URI
        mouthGameNFT.updateBaseURI(MouthGameNFT.NFTType.OPEN_MOUTH, NEW_OPEN_MOUTH_BASE_URI);
        console.log("Updated open mouth base URI to:", NEW_OPEN_MOUTH_BASE_URI);
        
        vm.stopBroadcast();
        
        console.log("Base URI update completed successfully!");
    }
}
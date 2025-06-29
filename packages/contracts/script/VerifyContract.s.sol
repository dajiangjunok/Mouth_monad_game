// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../src/MouthGameNFT.sol";

contract VerifyContract is Script {
    function run() external view {
        address proxyAddress = vm.envAddress("PROXY_ADDRESS");
        console.log("Testing proxy contract at:", proxyAddress);
        
        MouthGameNFT mouthGameNFT = MouthGameNFT(proxyAddress);
        
        try mouthGameNFT.name() returns (string memory name) {
            console.log("Contract name:", name);
        } catch {
            console.log("Failed to call name() function");
            return;
        }
        
        try mouthGameNFT.symbol() returns (string memory symbol) {
            console.log("Contract symbol:", symbol);
        } catch {
            console.log("Failed to call symbol() function");
        }
        
        try mouthGameNFT.GAME_ENTRY_FEE() returns (uint256 fee) {
            console.log("Game entry fee:", fee);
        } catch {
            console.log("Failed to call GAME_ENTRY_FEE() function");
        }
        
        // Test getPlayerStatus for deployer address
        address deployer = vm.addr(vm.envUint("PRIVATE_KEY"));
        if (deployer != address(0)) {
            console.log("Testing getPlayerStatus for deployer:", deployer);
            try mouthGameNFT.getPlayerStatus(deployer) returns (
                bool paid,
                uint256 highestScore,
                bool mintedClosed,
                bool mintedOpen,
                bool canMintClosed,
                bool canMintOpen
            ) {
                console.log("Paid:", paid);
                console.log("Highest score:", highestScore);
                console.log("Minted closed:", mintedClosed);
                console.log("Minted open:", mintedOpen);
                console.log("Can mint closed:", canMintClosed);
                console.log("Can mint open:", canMintOpen);
            } catch {
                console.log("Failed to call getPlayerStatus() function");
            }
        }
    }
}
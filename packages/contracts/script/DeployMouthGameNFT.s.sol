// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import "../src/MouthGameNFT.sol";

/**
 * @title DeployMouthGameNFT
 * @dev Script to deploy the upgradeable MouthGameNFT contract
 */
contract DeployMouthGameNFT is Script {
    // Default values for initialization
    string constant NFT_NAME = "Mouth Game Pony";
    string constant NFT_SYMBOL = "MGP";
    // JSON metadata文件的IPFS哈希 - 已上传到Pinata
    // 这些链接指向包含图片链接的JSON metadata文件
    string constant CLOSED_MOUTH_BASE_URI = "ipfs://bafkreie3swmwang3rgfy4smb2nd2x72ysxy7qrtz7nqfwq3kufvhmoexvi";
    string constant OPEN_MOUTH_BASE_URI = "ipfs://bafkreie7jifh5xxtgw37szbdtjdiucuwv6p62awth6y44u2ztkmrkoymui";
    
    function run() external {
        // Get the deployer's private key from environment
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("Deploying contracts with account:", deployer);
        console.log("Account balance:", deployer.balance);
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy the implementation contract
        MouthGameNFT implementation = new MouthGameNFT();
        console.log("Implementation deployed at:", address(implementation));
        
        // Prepare initialization data
        bytes memory initData = abi.encodeWithSelector(
            MouthGameNFT.initialize.selector,
            NFT_NAME,
            NFT_SYMBOL,
            CLOSED_MOUTH_BASE_URI,
            OPEN_MOUTH_BASE_URI
        );
        
        // Deploy the proxy contract
        ERC1967Proxy proxy = new ERC1967Proxy(
            address(implementation),
            initData
        );
        console.log("Proxy deployed at:", address(proxy));
        
        // Verify the deployment
        MouthGameNFT mouthGameNFT = MouthGameNFT(address(proxy));
        console.log("Contract name:", mouthGameNFT.name());
        console.log("Contract symbol:", mouthGameNFT.symbol());
        console.log("Game entry fee:", mouthGameNFT.GAME_ENTRY_FEE());
        console.log("Closed mouth threshold:", mouthGameNFT.CLOSED_MOUTH_THRESHOLD());
        console.log("Open mouth threshold:", mouthGameNFT.OPEN_MOUTH_THRESHOLD());
        
        vm.stopBroadcast();
        
        // Save deployment info
        string memory deploymentInfo = string(abi.encodePacked(
            "{\n",
            '  "implementation": "', vm.toString(address(implementation)), '",\n',
            '  "proxy": "', vm.toString(address(proxy)), '",\n',
            '  "deployer": "', vm.toString(deployer), '",\n',
            '  "name": "', NFT_NAME, '",\n',
            '  "symbol": "', NFT_SYMBOL, '",\n',
            '  "network": "', vm.envString("NETWORK_NAME"), '"\n',
            "}"
        ));
        
        vm.writeFile("./deployments/latest.json", deploymentInfo);
        console.log("Deployment info saved to ./deployments/latest.json");
    }
}
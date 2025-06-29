// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "forge-std/console.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import "../src/MouthGameNFT.sol";

contract MouthGameNFTTest is Test {
    MouthGameNFT public mouthGameNFT;
    address public owner;
    address public player1;
    address public player2;
    
    uint256 constant GAME_ENTRY_FEE = 0.01 ether;
    uint256 constant CLOSED_MOUTH_THRESHOLD = 50;
    uint256 constant OPEN_MOUTH_THRESHOLD = 160;
    
    string constant NFT_NAME = "Mouth Game Pony";
    string constant NFT_SYMBOL = "MGP";
    string constant CLOSED_MOUTH_BASE_URI = "ipfs://bafkreiczq2rplsgeoovb7pebyay4cexj2trqzk3vfu4mpsh47btptqoxfi";
    string constant OPEN_MOUTH_BASE_URI = "ipfs://bafkreifeurbvbmm7fd2rzckbgleaer7ylhst2c6mucbm62xcqlnnhk5zme";
    
    event GameEntryPaid(address indexed player, uint256 amount);
    event ScoreRecorded(address indexed player, uint256 score);
    event NFTMinted(address indexed player, uint256 tokenId, MouthGameNFT.NFTType nftType, uint256 score);
    
    function setUp() public {
        owner = address(this);
        player1 = makeAddr("player1");
        player2 = makeAddr("player2");
        
        // Give players some ETH
        vm.deal(player1, 1 ether);
        vm.deal(player2, 1 ether);
        
        // Deploy implementation
        MouthGameNFT implementation = new MouthGameNFT();
        
        // Prepare initialization data
        bytes memory initData = abi.encodeWithSelector(
            MouthGameNFT.initialize.selector,
            NFT_NAME,
            NFT_SYMBOL,
            CLOSED_MOUTH_BASE_URI,
            OPEN_MOUTH_BASE_URI
        );
        
        // Deploy proxy
        ERC1967Proxy proxy = new ERC1967Proxy(address(implementation), initData);
        mouthGameNFT = MouthGameNFT(address(proxy));
    }
    
    function testInitialization() public {
        assertEq(mouthGameNFT.name(), NFT_NAME);
        assertEq(mouthGameNFT.symbol(), NFT_SYMBOL);
        assertEq(mouthGameNFT.GAME_ENTRY_FEE(), GAME_ENTRY_FEE);
        assertEq(mouthGameNFT.CLOSED_MOUTH_THRESHOLD(), CLOSED_MOUTH_THRESHOLD);
        assertEq(mouthGameNFT.OPEN_MOUTH_THRESHOLD(), OPEN_MOUTH_THRESHOLD);
        assertEq(mouthGameNFT.owner(), owner);
    }
    
    function testPayToPlay() public {
        vm.expectEmit(true, false, false, true);
        emit GameEntryPaid(player1, GAME_ENTRY_FEE);
        
        vm.prank(player1);
        mouthGameNFT.payToPlay{value: GAME_ENTRY_FEE}();
        
        assertTrue(mouthGameNFT.hasPaidToPlay(player1));
    }
    
    function testPayToPlayFailsWithWrongAmount() public {
        vm.prank(player1);
        vm.expectRevert("MouthGameNFT: Incorrect payment amount");
        mouthGameNFT.payToPlay{value: 0.02 ether}();
    }
    
    function testPayToPlayFailsIfAlreadyPaid() public {
        vm.prank(player1);
        mouthGameNFT.payToPlay{value: GAME_ENTRY_FEE}();
        
        vm.prank(player1);
        vm.expectRevert("MouthGameNFT: Already paid to play");
        mouthGameNFT.payToPlay{value: GAME_ENTRY_FEE}();
    }
    
    function testRecordScore() public {
        // Player must pay first
        vm.prank(player1);
        mouthGameNFT.payToPlay{value: GAME_ENTRY_FEE}();
        
        vm.expectEmit(true, false, false, true);
        emit ScoreRecorded(player1, 180);
        
        mouthGameNFT.recordScoreForPlayer(player1, 180);
        assertEq(mouthGameNFT.playerHighestScores(player1), 180);
    }
    
    function testRecordScoreWorksWithoutPayment() public {
        // recordScoreForPlayer is only callable by owner (admin function)
        // recordScore (new player function) doesn't require payment
        vm.prank(player1);
        mouthGameNFT.recordScore(100); // Should work without payment
        assertEq(mouthGameNFT.playerHighestScores(player1), 100);
    }
    
    function testRecordScoreOnlyUpdatesIfHigher() public {
        vm.prank(player1);
        mouthGameNFT.payToPlay{value: GAME_ENTRY_FEE}();
        
        mouthGameNFT.recordScoreForPlayer(player1, 180);
        mouthGameNFT.recordScoreForPlayer(player1, 50); // Lower score
        
        assertEq(mouthGameNFT.playerHighestScores(player1), 180);
    }
    
    function testMintClosedMouthNFT() public {
        // Setup
        vm.prank(player1);
        mouthGameNFT.payToPlay{value: GAME_ENTRY_FEE}();
        mouthGameNFT.recordScoreForPlayer(player1, 180);
        
        vm.expectEmit(true, false, false, true);
        emit NFTMinted(player1, 1, MouthGameNFT.NFTType.CLOSED_MOUTH, 180);
        
        vm.prank(player1);
        mouthGameNFT.mintClosedMouthNFT();
        
        assertEq(mouthGameNFT.ownerOf(1), player1);
        assertTrue(mouthGameNFT.hasMintedNFT(player1, MouthGameNFT.NFTType.CLOSED_MOUTH));
        assertEq(uint(mouthGameNFT.tokenNFTType(1)), uint(MouthGameNFT.NFTType.CLOSED_MOUTH));
    }
    
    function testMintClosedMouthNFTFailsWithLowScore() public {
        vm.prank(player1);
        mouthGameNFT.payToPlay{value: GAME_ENTRY_FEE}();
        mouthGameNFT.recordScoreForPlayer(player1, 30); // Too low
        
        vm.prank(player1);
        vm.expectRevert("MouthGameNFT: Score too low for closed mouth NFT");
        mouthGameNFT.mintClosedMouthNFT();
    }
    
    function testMintClosedMouthNFTFailsIfAlreadyMinted() public {
        vm.prank(player1);
        mouthGameNFT.payToPlay{value: GAME_ENTRY_FEE}();
        mouthGameNFT.recordScoreForPlayer(player1, 180);
        
        vm.prank(player1);
        mouthGameNFT.mintClosedMouthNFT();
        
        vm.prank(player1);
        vm.expectRevert("MouthGameNFT: Closed mouth NFT already minted");
        mouthGameNFT.mintClosedMouthNFT();
    }
    
    function testMintOpenMouthNFT() public {
        // Setup
        vm.prank(player1);
        mouthGameNFT.payToPlay{value: GAME_ENTRY_FEE}();
        mouthGameNFT.recordScoreForPlayer(player1, 250);
        
        vm.expectEmit(true, false, false, true);
        emit NFTMinted(player1, 1, MouthGameNFT.NFTType.OPEN_MOUTH, 250);
        
        vm.prank(player1);
        mouthGameNFT.mintOpenMouthNFT();
        
        assertEq(mouthGameNFT.ownerOf(1), player1);
        assertTrue(mouthGameNFT.hasMintedNFT(player1, MouthGameNFT.NFTType.OPEN_MOUTH));
        assertEq(uint(mouthGameNFT.tokenNFTType(1)), uint(MouthGameNFT.NFTType.OPEN_MOUTH));
    }
    
    function testMintBothNFTTypes() public {
        // Setup
        vm.prank(player1);
        mouthGameNFT.payToPlay{value: GAME_ENTRY_FEE}();
        mouthGameNFT.recordScoreForPlayer(player1, 250);
        
        // Mint closed mouth NFT
        vm.prank(player1);
        mouthGameNFT.mintClosedMouthNFT();
        
        // Mint open mouth NFT
        vm.prank(player1);
        mouthGameNFT.mintOpenMouthNFT();
        
        assertEq(mouthGameNFT.ownerOf(1), player1);
        assertEq(mouthGameNFT.ownerOf(2), player1);
        assertTrue(mouthGameNFT.hasMintedNFT(player1, MouthGameNFT.NFTType.CLOSED_MOUTH));
        assertTrue(mouthGameNFT.hasMintedNFT(player1, MouthGameNFT.NFTType.OPEN_MOUTH));
    }
    
    function testCanMintFunctions() public {
        // Initially false
        assertFalse(mouthGameNFT.canMintClosedMouth(player1));
        assertFalse(mouthGameNFT.canMintOpenMouth(player1));
        
        // After paying
        vm.prank(player1);
        mouthGameNFT.payToPlay{value: GAME_ENTRY_FEE}();
        assertFalse(mouthGameNFT.canMintClosedMouth(player1));
        assertFalse(mouthGameNFT.canMintOpenMouth(player1));
        
        // After score >= 50
        mouthGameNFT.recordScoreForPlayer(player1, 50);
        assertTrue(mouthGameNFT.canMintClosedMouth(player1));
        assertFalse(mouthGameNFT.canMintOpenMouth(player1));
        
        // After score >= 160
        mouthGameNFT.recordScoreForPlayer(player1, 160);
        assertTrue(mouthGameNFT.canMintClosedMouth(player1));
        assertTrue(mouthGameNFT.canMintOpenMouth(player1));
        
        // After minting closed mouth
        vm.prank(player1);
        mouthGameNFT.mintClosedMouthNFT();
        assertFalse(mouthGameNFT.canMintClosedMouth(player1));
        assertTrue(mouthGameNFT.canMintOpenMouth(player1));
    }
    
    function testGetPlayerStatus() public {
        vm.prank(player1);
        mouthGameNFT.payToPlay{value: GAME_ENTRY_FEE}();
        mouthGameNFT.recordScoreForPlayer(player1, 250);
        
        (
            bool paid,
            uint256 highestScore,
            bool mintedClosed,
            bool mintedOpen,
            bool canMintClosed,
            bool canMintOpen
        ) = mouthGameNFT.getPlayerStatus(player1);
        
        assertTrue(paid);
        assertEq(highestScore, 250);
        assertFalse(mintedClosed);
        assertFalse(mintedOpen);
        assertTrue(canMintClosed);
        assertTrue(canMintOpen);
    }
    
    function testTokenURI() public {
        vm.prank(player1);
        mouthGameNFT.payToPlay{value: GAME_ENTRY_FEE}();
        mouthGameNFT.recordScoreForPlayer(player1, 250);
        
        vm.prank(player1);
        mouthGameNFT.mintClosedMouthNFT();
        
        string memory uri = mouthGameNFT.tokenURI(1);
        string memory expected = CLOSED_MOUTH_BASE_URI; // 修复后直接返回完整URI，不添加tokenId
        assertEq(uri, expected);
    }
    
    function testWithdrawFunds() public {
        vm.prank(player1);
        mouthGameNFT.payToPlay{value: GAME_ENTRY_FEE}();
        
        vm.prank(player2);
        mouthGameNFT.payToPlay{value: GAME_ENTRY_FEE}();
        
        uint256 contractBalance = address(mouthGameNFT).balance;
        uint256 ownerBalanceBefore = address(owner).balance;
        
        mouthGameNFT.withdrawFunds();
        
        assertEq(address(mouthGameNFT).balance, 0);
        assertEq(address(owner).balance, ownerBalanceBefore + contractBalance);
    }
    
    function testPauseUnpause() public {
        mouthGameNFT.pause();
        
        vm.prank(player1);
        vm.expectRevert();
        mouthGameNFT.payToPlay{value: GAME_ENTRY_FEE}();
        
        mouthGameNFT.unpause();
        
        vm.prank(player1);
        mouthGameNFT.payToPlay{value: GAME_ENTRY_FEE}();
        assertTrue(mouthGameNFT.hasPaidToPlay(player1));
    }
    
    function testOnlyOwnerFunctions() public {
        vm.prank(player1);
        vm.expectRevert();
        mouthGameNFT.recordScoreForPlayer(player1, 100);
        
        vm.prank(player1);
        vm.expectRevert();
        mouthGameNFT.pause();
        
        vm.prank(player1);
        vm.expectRevert();
        mouthGameNFT.withdrawFunds();
    }

    function testStartGame() public {
        // Player pays to play
        vm.prank(player1);
        mouthGameNFT.payToPlay{value: GAME_ENTRY_FEE}();
        assertTrue(mouthGameNFT.hasPaidToPlay(player1));
        
        // Player starts game, which resets payment status
        vm.prank(player1);
        mouthGameNFT.startGame();
        assertFalse(mouthGameNFT.hasPaidToPlay(player1));
    }

    function testStartGameFailsIfNotPaid() public {
        vm.prank(player1);
        vm.expectRevert("MouthGameNFT: Player has not paid to play");
        mouthGameNFT.startGame();
    }
}
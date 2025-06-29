// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721EnumerableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721URIStorageUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

/**
 * @title 嘴巴游戏NFT合约
 * @dev 可升级的NFT合约，专为嘴巴游戏设计
 * 
 * 游戏规则：
 * - 玩家支付 0.01 MON 进入游戏
 * - 根据游戏分数可以铸造不同的NFT：
 *   * 分数 50+: 闭嘴小马NFT（入门级奖励）
 *   * 分数 160+: 张嘴小马NFT（高级奖励）
 * 
 * 合约特性：
 * - 使用UUPS可升级模式，保证合约功能可扩展
 * - 支持暂停功能，紧急情况下可停止合约运行
 * - 防重入攻击保护，确保资金安全
 * - 枚举功能支持，方便查询所有NFT
 * - URI存储功能，每个NFT可有独特的元数据
 */
contract MouthGameNFT is
    Initializable,
    ERC721Upgradeable,
    ERC721EnumerableUpgradeable,
    ERC721URIStorageUpgradeable,
    OwnableUpgradeable,
    PausableUpgradeable,
    ReentrancyGuardUpgradeable,
    UUPSUpgradeable
{
    // 游戏入场费 (0.01 MON)
    // 使用 ether 单位，在Monad网络上等同于 MON
    uint256 public constant GAME_ENTRY_FEE = 0.01 ether;
    
    // NFT铸造的分数门槛
    uint256 public constant CLOSED_MOUTH_THRESHOLD = 50;    // 闭嘴小马NFT门槛：50分
    uint256 public constant OPEN_MOUTH_THRESHOLD = 160;     // 张嘴小马NFT门槛：160分
    
    // NFT类型枚举
    // 定义了合约中支持的所有NFT类型
    enum NFTType {
        NONE,           // 无类型（默认值）
        CLOSED_MOUTH,   // 闭嘴小马NFT
        OPEN_MOUTH      // 张嘴小马NFT
    }
    
    // 追踪哪些地址已经支付了游戏费用
    // 每次游戏结束后会重置，允许玩家重新付费游戏
    mapping(address => bool) public hasPaidToPlay;
    
    // 追踪玩家达到的最高分数
    // 只记录每个玩家的历史最高分，用于NFT铸造资格判定
    mapping(address => uint256) public playerHighestScores;
    
    // 追踪每个玩家已经铸造了哪些类型的NFT
    // 防止同一玩家重复铸造相同类型的NFT
    mapping(address => mapping(NFTType => bool)) public hasMintedNFT;
    
    // NFT代币ID计数器
    // 从1开始，每次铸造NFT时自增
    uint256 private _nextTokenId;
    
    // 不同NFT类型的基础URI
    // 用于构建完整的NFT元数据URI
    string public closedMouthBaseURI;  // 闭嘴小马NFT的基础URI
    string public openMouthBaseURI;    // 张嘴小马NFT的基础URI
    
    // 从代币ID映射到NFT类型
    // 记录每个NFT属于哪种类型，用于URI生成
    mapping(uint256 => NFTType) public tokenNFTType;
    
    // 事件定义
    // 游戏入场费支付事件，记录玩家地址和支付金额
    event GameEntryPaid(address indexed player, uint256 amount);
    
    // 分数记录事件，当玩家刷新最高分时触发
    event ScoreRecorded(address indexed player, uint256 score);
    
    // NFT铸造事件，记录铸造的玩家、代币ID、NFT类型和对应分数
    event NFTMinted(address indexed player, uint256 tokenId, NFTType nftType, uint256 score);
    
    // 基础URI更新事件，当管理员更新NFT元数据URI时触发
    event BaseURIUpdated(NFTType nftType, string newBaseURI);
    
    // 资金提取事件，记录提取者地址和提取金额
    event FundsWithdrawn(address indexed owner, uint256 amount);
    
    /// @custom:oz-upgrades-unsafe-allow constructor
    /**
     * @dev 构造函数
     * 由于这是一个可升级合约，构造函数中禁用初始化器
     * 防止实现合约被直接使用，必须通过代理合约调用
     */
    constructor() {
        _disableInitializers();
    }
    
    /**
     * @dev 初始化合约（仅在部署时调用一次）
     * @param _name NFT集合的名称，如"嘴巴游戏NFT"
     * @param _symbol NFT集合的符号，如"MOUTH"
     * @param _closedMouthBaseURI 闭嘴小马NFT的基础URI，用于生成元数据链接
     * @param _openMouthBaseURI 张嘴小马NFT的基础URI，用于生成元数据链接
     */
    function initialize(
        string memory _name,
        string memory _symbol,
        string memory _closedMouthBaseURI,
        string memory _openMouthBaseURI
    ) initializer public {
        __ERC721_init(_name, _symbol);
        __ERC721Enumerable_init();
        __ERC721URIStorage_init();
        __Ownable_init(msg.sender);
        __Pausable_init();
        __ReentrancyGuard_init();
        __UUPSUpgradeable_init();
        
        closedMouthBaseURI = _closedMouthBaseURI;
        openMouthBaseURI = _openMouthBaseURI;
        _nextTokenId = 1;
    }
    
    /**
     * @dev 支付游戏入场费
     * 玩家必须支付准确的0.01 MON才能参与游戏
     * 每个玩家在游戏结束前只能支付一次
     * 合约暂停时无法调用
     */
    function payToPlay() external payable whenNotPaused nonReentrant {
        require(msg.value == GAME_ENTRY_FEE, "MouthGameNFT: Incorrect payment amount");
        require(!hasPaidToPlay[msg.sender], "MouthGameNFT: Already paid to play");
        
        hasPaidToPlay[msg.sender] = true;
        
        emit GameEntryPaid(msg.sender, msg.value);
    }
    
    /**
     * @dev 开始游戏会话
     * 重置玩家的支付状态，允许玩家重新付费进行下一轮游戏
     * 只有已支付入场费的玩家才能调用
     * 合约暂停时无法调用
     */
    function startGame() external whenNotPaused nonReentrant {
        require(hasPaidToPlay[msg.sender], "MouthGameNFT: Player has not paid to play");
        
        // Reset payment status so player can pay again for next game
        hasPaidToPlay[msg.sender] = false;
    }

    /**
     * @dev 记录玩家分数（玩家自己调用）
     * @param score 玩家达到的分数
     * 
     * 特性：
     * - 玩家可以自己记录分数，无需管理员干预
     * - 只有当新分数高于历史最高分时才会更新
     * - 不需要支付状态检查，游戏结束后仍可记录分数
     */
    function recordScore(uint256 score) external whenNotPaused nonReentrant {
        // Player can record their own score without requiring payment
        // This allows for score recording even after payment has been reset
        
        // Update highest score if this score is higher
        if (score > playerHighestScores[msg.sender]) {
            playerHighestScores[msg.sender] = score;
            emit ScoreRecorded(msg.sender, score);
        }
    }

    /**
     * @dev 为玩家记录分数（仅管理员可调用）- 遗留功能
     * @param player 玩家的地址
     * @param score 玩家达到的分数
     * 
     * 说明：
     * - 这是遗留功能，主要用于游戏系统后端调用
     * - 只有合约所有者可以调用
     * - 建议使用recordScore让玩家自己记录分数
     */
    function recordScoreForPlayer(address player, uint256 score) external onlyOwner {
        // Update highest score if this score is higher
        if (score > playerHighestScores[player]) {
            playerHighestScores[player] = score;
            emit ScoreRecorded(player, score);
        }
    }
    
    /**
     * @dev 铸造闭嘴小马NFT（需要50+分数）
     * 
     * 铸造条件：
     * - 玩家必须已支付游戏入场费
     * - 玩家最高分数必须达到50分或以上
     * - 玩家之前未铸造过闭嘴小马NFT
     * - 合约未暂停且防重入保护有效
     */
    function mintClosedMouthNFT() external whenNotPaused nonReentrant {
        require(hasPaidToPlay[msg.sender], "MouthGameNFT: Must pay to play first");
        require(playerHighestScores[msg.sender] >= CLOSED_MOUTH_THRESHOLD, "MouthGameNFT: Score too low for closed mouth NFT");
        require(!hasMintedNFT[msg.sender][NFTType.CLOSED_MOUTH], "MouthGameNFT: Closed mouth NFT already minted");
        
        uint256 tokenId = _nextTokenId++;
        hasMintedNFT[msg.sender][NFTType.CLOSED_MOUTH] = true;
        tokenNFTType[tokenId] = NFTType.CLOSED_MOUTH;
        
        _safeMint(msg.sender, tokenId);
        
        emit NFTMinted(msg.sender, tokenId, NFTType.CLOSED_MOUTH, playerHighestScores[msg.sender]);
    }
    
    /**
     * @dev 铸造张嘴小马NFT（需要160+分数）
     * 
     * 铸造条件：
     * - 玩家必须已支付游戏入场费
     * - 玩家最高分数必须达到160分或以上
     * - 玩家之前未铸造过张嘴小马NFT
     * - 合约未暂停且防重入保护有效
     * 
     * 注意：这是高级奖励，门槛较高
     */
    function mintOpenMouthNFT() external whenNotPaused nonReentrant {
        require(hasPaidToPlay[msg.sender], "MouthGameNFT: Must pay to play first");
        require(playerHighestScores[msg.sender] >= OPEN_MOUTH_THRESHOLD, "MouthGameNFT: Score too low for open mouth NFT");
        require(!hasMintedNFT[msg.sender][NFTType.OPEN_MOUTH], "MouthGameNFT: Open mouth NFT already minted");
        
        uint256 tokenId = _nextTokenId++;
        hasMintedNFT[msg.sender][NFTType.OPEN_MOUTH] = true;
        tokenNFTType[tokenId] = NFTType.OPEN_MOUTH;
        
        _safeMint(msg.sender, tokenId);
        
        emit NFTMinted(msg.sender, tokenId, NFTType.OPEN_MOUTH, playerHighestScores[msg.sender]);
    }
    
    /**
     * @dev 检查玩家是否可以铸造闭嘴小马NFT
     * @param player 要检查的玩家地址
     * @return bool 是否满足铸造条件
     * 
     * 检查条件：
     * - 已支付入场费
     * - 分数达到50分门槛
     * - 未曾铸造过此类型NFT
     */
    function canMintClosedMouth(address player) external view returns (bool) {
        return hasPaidToPlay[player] && 
               playerHighestScores[player] >= CLOSED_MOUTH_THRESHOLD &&
               !hasMintedNFT[player][NFTType.CLOSED_MOUTH];
    }
    
    /**
     * @dev 检查玩家是否可以铸造张嘴小马NFT
     * @param player 要检查的玩家地址
     * @return bool 是否满足铸造条件
     * 
     * 检查条件：
     * - 已支付入场费
     * - 分数达到160分门槛
     * - 未曾铸造过此类型NFT
     */
    function canMintOpenMouth(address player) external view returns (bool) {
        return hasPaidToPlay[player] && 
               playerHighestScores[player] >= OPEN_MOUTH_THRESHOLD &&
               !hasMintedNFT[player][NFTType.OPEN_MOUTH];
    }
    
    /**
     * @dev 获取玩家的完整游戏状态
     * @param player 要查询的玩家地址
     * @return paid 是否已支付入场费
     * @return highestScore 玩家的历史最高分
     * @return mintedClosed 是否已铸造闭嘴小马NFT
     * @return mintedOpen 是否已铸造张嘴小马NFT
     * @return canMintClosed 是否可以铸造闭嘴小马NFT
     * @return canMintOpen 是否可以铸造张嘴小马NFT
     * 
     * 这是一个便利函数，一次性返回玩家的所有相关状态
     */
    function getPlayerStatus(address player) external view returns (
        bool paid,
        uint256 highestScore,
        bool mintedClosed,
        bool mintedOpen,
        bool canMintClosed,
        bool canMintOpen
    ) {
        paid = hasPaidToPlay[player];
        highestScore = playerHighestScores[player];
        mintedClosed = hasMintedNFT[player][NFTType.CLOSED_MOUTH];
        mintedOpen = hasMintedNFT[player][NFTType.OPEN_MOUTH];
        canMintClosed = paid && highestScore >= CLOSED_MOUTH_THRESHOLD && !mintedClosed;
        canMintOpen = paid && highestScore >= OPEN_MOUTH_THRESHOLD && !mintedOpen;
    }
    
    /**
     * @dev 更新NFT类型的基础URI（仅管理员）
     * @param nftType 要更新的NFT类型（闭嘴或张嘴小马）
     * @param newBaseURI 新的基础URI地址
     * 
     * 用途：
     * - 管理员可以更新NFT的元数据地址
     * - 支持IPFS或其他去中心化存储迁移
     * - 可以修复或改进NFT的展示效果
     */
    function updateBaseURI(NFTType nftType, string memory newBaseURI) external onlyOwner {
        if (nftType == NFTType.CLOSED_MOUTH) {
            closedMouthBaseURI = newBaseURI;
        } else if (nftType == NFTType.OPEN_MOUTH) {
            openMouthBaseURI = newBaseURI;
        } else {
            revert("MouthGameNFT: Invalid NFT type");
        }
        
        emit BaseURIUpdated(nftType, newBaseURI);
    }
    
    /**
     * @dev 提取合约资金（仅管理员）
     * 
     * 功能：
     * - 将合约中的所有MON余额提取给合约所有者
     * - 包含防重入保护，确保资金安全
     * - 只有合约余额大于0时才能提取
     * - 提取失败会回滚交易
     */
    function withdrawFunds() external onlyOwner nonReentrant {
        uint256 balance = address(this).balance;
        require(balance > 0, "MouthGameNFT: No funds to withdraw");
        
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "MouthGameNFT: Withdrawal failed");
        
        emit FundsWithdrawn(owner(), balance);
    }
    
    /**
     * @dev 暂停合约（仅管理员）
     * 
     * 紧急停止功能：
     * - 暂停后将禁止所有游戏相关操作
     * - 包括支付入场费、记录分数、铸造NFT等
     * - 用于紧急情况或合约维护
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev 恢复合约运行（仅管理员）
     * 
     * 解除暂停状态：
     * - 恢复所有正常的游戏功能
     * - 玩家可以重新进行游戏和铸造NFT
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @dev 重置玩家的支付状态（仅管理员，用于测试）
     * @param player 要重置支付状态的玩家地址
     * 
     * 管理功能：
     * - 主要用于测试环境
     * - 可以重置玩家的支付状态为未支付
     * - 允许玩家重新支付入场费进行游戏
     */
    function resetPlayerPayment(address player) external onlyOwner {
        hasPaidToPlay[player] = false;
    }
    
    // Solidity要求的重写函数
    // 以下函数是由于多重继承而必须重写的函数
    
    /**
     * @dev 获取NFT的元数据URI
     * @param tokenId 要查询的NFT代币ID
     * @return string NFT的完整元数据URI
     * 
     * 逻辑：
     * - 根据NFT类型选择对应的基础URI
     * - 将代币ID拼接到基础URI后面
     * - 例如：baseURI + tokenId = "https://api.example.com/metadata/1"
     */
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721Upgradeable, ERC721URIStorageUpgradeable)
        returns (string memory)
    {
        require(_ownerOf(tokenId) != address(0), "MouthGameNFT: URI query for nonexistent token");
        
        NFTType nftType = tokenNFTType[tokenId];
        string memory baseURI;
        
        if (nftType == NFTType.CLOSED_MOUTH) {
            baseURI = closedMouthBaseURI;
        } else if (nftType == NFTType.OPEN_MOUTH) {
            baseURI = openMouthBaseURI;
        } else {
            return super.tokenURI(tokenId);
        }
        
        // 直接返回完整的IPFS URI，不添加tokenId后缀
        // 因为我们的metadata文件已经是完整的，不需要基于tokenId生成
        return bytes(baseURI).length > 0 ? baseURI : "";
    }
    
    /**
     * @dev 内部更新函数，处理NFT转移时的状态更新
     * 重写此函数以兼容ERC721和ERC721Enumerable扩展
     */
    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721Upgradeable, ERC721EnumerableUpgradeable)
        returns (address)
    {
        return super._update(to, tokenId, auth);
    }
    
    /**
     * @dev 内部函数，增加账户的NFT余额计数
     * 重写此函数以兼容ERC721和ERC721Enumerable扩展
     */
    function _increaseBalance(address account, uint128 value)
        internal
        override(ERC721Upgradeable, ERC721EnumerableUpgradeable)
    {
        super._increaseBalance(account, value);
    }
    
    /**
     * @dev 检查合约是否支持特定的接口
     * 重写此函数以支持所有继承的ERC721扩展接口
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721Upgradeable, ERC721EnumerableUpgradeable, ERC721URIStorageUpgradeable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
    
    /**
     * @dev 授权合约升级（UUPS模式要求）
     * @param newImplementation 新的实现合约地址
     * 
     * 安全机制：
     * - 只有合约所有者可以授权升级
     * - 这是UUPS可升级模式的核心安全检查
     * - 防止未授权的合约升级攻击
     */
    function _authorizeUpgrade(address newImplementation)
        internal
        onlyOwner
        override
    {}
    
    /**
     * @dev 将uint256数字转换为字符串表示
     * @param value 要转换的数字
     * @return string 数字的字符串形式
     * 
     * 用途：
     * - 用于在tokenURI函数中将代币ID转换为字符串
     * - 拼接到基础URI后面形成完整的元数据地址
     */
    function _toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) {
            return "0";
        }
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }
}
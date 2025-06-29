# Mouth Game - Web3集成版 🎮🔗

一个集成了Web3功能的音乐节奏游戏，玩家可以通过达到特定分数来获得NFT奖励。

## 项目结构

```
mouth/
├── mouthContract/          # Foundry智能合约项目
│   ├── src/               # 合约源码
│   ├── script/            # 部署脚本
│   ├── test/              # 合约测试
│   └── Makefile           # 构建脚本
└── mouthGame/             # React前端游戏
    ├── src/
    │   ├── components/    # React组件
    │   ├── contracts/     # 合约配置和ABI
    │   └── hooks/         # Web3钩子
    └── package.json
```

## 功能特点

### 🎯 游戏机制
- **支付游戏**: 玩家需支付0.01 MON进入游戏
- **分数系统**: 
  - 50+分: 获得小马闭嘴NFT
  - 160+分: 获得小马张嘴NFT
- **可升级合约**: 使用OpenZeppelin的UUPS代理模式

### 🔗 Web3功能
- **钱包连接**: 支持MetaMask钱包
- **网络支持**: Monad测试网络
- **NFT奖励**: 基于分数的动态NFT铸造
- **支付系统**: 链上支付验证

## 快速开始

### 1. 部署智能合约

```bash
cd mouthContract

# 复制环境变量模板
cp .env.example .env

# 编辑.env文件，填入你的私钥和API密钥
vim .env

# 构建合约
make build

# 运行测试
make test

# 部署到Monad测试网
make deploy-monad
```

### 2. 配置前端

```bash
cd mouthGame

# 安装依赖
npm install

# 更新合约地址
# 编辑 src/contracts/config.ts，将 CONTRACT_CONFIG.ADDRESS 更新为部署的合约地址

# 启动开发服务器
npm run dev
```

### 3. 设置MetaMask

1. 添加Monad测试网络：
   - 网络名称: Monad Testnet
   - RPC URL: https://testnet1.monad.xyz
   - 链ID: 41454
   - 货币符号: MON
   - 区块浏览器: https://testnet-explorer.monad.xyz

2. 获取测试代币（如果有水龙头）

## 合约部署

### 环境变量配置

在 `mouthContract/.env` 文件中配置：

```bash
PRIVATE_KEY=your_private_key_without_0x_prefix
MONAD_TESTNET_RPC=https://testnet1.monad.xyz
NETWORK_NAME=monad_testnet
ETHERSCAN_API_KEY=your_etherscan_api_key
```

### 部署命令

```bash
# 部署到Monad测试网
make deploy-monad

# 升级合约（如果需要）
export PROXY_ADDRESS=0x... # 之前部署的代理地址
make upgrade-monad
```

### 验证合约

```bash
make verify-monad
```

## 合约功能

### 主要方法

- `payToPlay()`: 支付0.01 MON进入游戏
- `recordScore(address player, uint256 score)`: 记录玩家分数（仅owner）
- `mintClosedMouthNFT()`: 铸造闭嘴小马NFT（150+分）
- `mintOpenMouthNFT()`: 铸造张嘴小马NFT（200+分）
- `getPlayerStatus(address)`: 获取玩家状态

### 查询方法

- `canMintClosedMouth(address)`: 检查是否可以铸造闭嘴NFT
- `canMintOpenMouth(address)`: 检查是否可以铸造张嘴NFT
- `playerHighestScores(address)`: 玩家最高分数
- `hasPaidToPlay(address)`: 是否已支付游戏费用

## 前端集成

### Web3 Hooks

```typescript
// 钱包连接
const { address, isConnected, connect, disconnect } = useWeb3()

// 玩家状态
const { playerStatus } = usePlayerStatus(address)

// 支付游戏
const { payToPlay, isLoading } = usePayToPlay()

// 铸造NFT
const { mintNFT } = useMintNFT(NFTType.CLOSED_MOUTH)
```

### 游戏流程

1. **连接钱包**: 用户连接MetaMask钱包
2. **切换网络**: 确保在Monad测试网络
3. **支付游戏**: 支付0.01 MON进入游戏
4. **开始游戏**: 点击开始按钮进入游戏
5. **获得奖励**: 根据分数铸造对应的NFT

## 开发指南

### 合约开发

```bash
# 编译合约
forge build

# 运行测试
forge test -vv

# 生成覆盖率报告
forge coverage

# 格式化代码
forge fmt
```

### 前端开发

```bash
# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 代码检查
npm run lint
```

### 生成ABI

当合约更新后，需要重新生成ABI：

```bash
cd mouthContract
make abi
```

## 故障排除

### 常见问题

1. **合约地址未配置**
   - 确保在 `src/contracts/config.ts` 中设置了正确的合约地址

2. **网络连接问题**
   - 检查MetaMask是否连接到Monad测试网络
   - 确认RPC URL配置正确

3. **交易失败**
   - 检查账户余额是否足够支付gas费
   - 确认合约地址是否正确

4. **NFT铸造失败**
   - 确认玩家分数是否达到要求
   - 检查是否已经铸造过该类型的NFT

### 调试技巧

1. 查看浏览器控制台的错误信息
2. 使用Monad测试网浏览器查看交易状态
3. 检查合约事件日志

## 许可证

MIT License

## 贡献指南

1. Fork 这个仓库
2. 创建你的功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交你的更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开一个 Pull Request

## 支持

如果你有任何问题，请提交Issue或联系项目维护者。

---

🎮 开始游戏，赢取NFT奖励！

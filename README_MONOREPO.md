# Mouth Game Monorepo

This project has been restructured as a monorepo for better organization and deployment on Vercel.

## 🏗️ Project Structure

```
mouth/
├── packages/
│   ├── game/              # React/Vite frontend application
│   │   ├── src/
│   │   ├── public/
│   │   ├── package.json
│   │   └── vite.config.ts
│   └── contracts/         # Foundry smart contracts
│       ├── src/
│       ├── script/
│       ├── test/
│       ├── foundry.toml
│       └── package.json
├── package.json           # Root package.json with workspaces
├── vercel.json           # Vercel deployment configuration
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Node.js >= 18.0.0
- npm >= 8.0.0
- Foundry (for smart contracts)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd mouth
```

2. Install all dependencies:
```bash
npm install
```

## 📦 Available Scripts

### Root Level Commands

```bash
# Install all dependencies
npm install

# Build all packages
npm run build

# Run development server for game
npm run dev

# Build only the game package
npm run game:build

# Run game in development mode
npm run game:dev

# Preview built game
npm run game:preview

# Build contracts
npm run contracts:build

# Test contracts
npm run contracts:test

# Deploy contracts
npm run contracts:deploy
```

### Game Package (`packages/game`)

```bash
# Navigate to game package
cd packages/game

# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

### Contracts Package (`packages/contracts`)

```bash
# Navigate to contracts package
cd packages/contracts

# Build contracts
npm run build

# Run tests
npm run test

# Deploy to network
npm run deploy

# Format code
npm run format

# Lint Solidity code
npm run lint
```

## 🌐 Deployment

### Vercel Deployment

This monorepo is configured for deployment on Vercel:

1. The `vercel.json` configuration automatically builds the game package
2. The build command is `npm run game:build`
3. The output directory is `packages/game/dist`

To deploy:
1. Connect your repository to Vercel
2. Vercel will automatically detect the configuration and deploy

### Manual Deployment

```bash
# Build the game for production
npm run game:build

# The built files will be in packages/game/dist/
```

## 🔧 Configuration

### Environment Variables

Create `.env` files in the respective packages:

- `packages/game/.env` - Frontend environment variables
- `packages/contracts/.env` - Contract deployment variables

### Vercel Configuration

The `vercel.json` file is configured to:
- Build the game package using the static build system
- Route all requests to the game's dist folder
- Use the monorepo-aware build commands

## 📋 Migration Notes

This project was migrated from a multi-folder structure to a proper monorepo:

- `mouthGame/` → `packages/game/`
- `mouthContract/` → `packages/contracts/`
- Added root-level `package.json` with workspaces
- Updated `vercel.json` for monorepo deployment
- Updated `.gitignore` for new structure

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes in the appropriate package
4. Test your changes
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details
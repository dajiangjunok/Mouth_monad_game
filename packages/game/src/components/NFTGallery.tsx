import { useState } from 'react'
import { useWeb3, usePlayerStatus, useMintNFT } from '../hooks/useWeb3'

interface NFTGalleryProps {
  onBack: () => void
}

interface NFTItem {
  id: number
  name: string
  description: string
  image: string
  type: 'closed' | 'open'
  minted: boolean
  canMint: boolean
  score: number
}

export function NFTGallery({ onBack }: NFTGalleryProps) {
  const { address, isConnected } = useWeb3()
  const { playerStatus, refetchPlayerStatus } = usePlayerStatus(address)
  const { mintClosedMouth, mintOpenMouth, isMintingClosed, isMintingOpen } = useMintNFT()
  const [selectedNFT, setSelectedNFT] = useState<NFTItem | null>(null)
  const [showMintSuccess, setShowMintSuccess] = useState(false)

  const nftItems: NFTItem[] = [
    {
      id: 1,
      name: '闭嘴小马',
      description: '达到50分解锁的特殊NFT，代表着你在游戏中的基础控制能力。',
      image: '/close_NFT.png', // This should match your public folder
      type: 'closed',
      minted: playerStatus?.mintedClosed || false,
      canMint: playerStatus?.canMintClosed || false,
      score: 50
    },
    {
      id: 2,
      name: '张嘴小马',
      description: '达到160分解锁的传奇NFT，证明你是真正的游戏大师。',
      image: '/open_NFT.png', // This should match your public folder
      type: 'open',
      minted: playerStatus?.mintedOpen || false,
      canMint: playerStatus?.canMintOpen || false,
      score: 160
    }
  ]

  const handleMintNFT = async (nft: NFTItem) => {
    if (!nft.canMint) {
      alert(`你需要达到 ${nft.score} 分才能铸造这个NFT！`)
      return
    }

    try {
      if (nft.type === 'closed' && mintClosedMouth) {
        await mintClosedMouth()
      } else if (nft.type === 'open' && mintOpenMouth) {
        await mintOpenMouth()
      }
      
      setShowMintSuccess(true)
      setTimeout(() => {
        setShowMintSuccess(false)
        refetchPlayerStatus()
      }, 3000)
    } catch (error) {
      console.error('铸造NFT失败:', error)
      alert('铸造失败，请重试！')
    }
  }

  const getHighestScore = (): string => {
    if (!playerStatus?.highestScore) return '0'
    try {
      return playerStatus.highestScore.toString()
    } catch {
      return '0'
    }
  }

  if (!isConnected) {
    return (
      <div className="nft-gallery">
        <div className="retro-panel title-panel">
          <h1>🖼️ NFT 收藏馆</h1>
        </div>
        
        <div className="retro-panel message-panel">
          <div className="panel-header">
            <span className="panel-icon">⚠️</span>
            <span>未连接钱包</span>
          </div>
          <div className="panel-content">
            <p>请先连接钱包查看你的NFT收藏</p>
            <button onClick={onBack} className="retro-button">
              返回钱包
            </button>
          </div>
        </div>

        <style>{nftGalleryStyles}</style>
      </div>
    )
  }

  return (
    <div className="nft-gallery">
      {/* Success Modal */}
      {showMintSuccess && (
        <div className="success-modal">
          <div className="modal-content">
            <h2>🎉 铸造成功！</h2>
            <p>恭喜你获得了新的NFT！</p>
          </div>
        </div>
      )}

      {/* Title Panel */}
      <div className="retro-panel title-panel">
        <h1>🖼️ NFT 收藏馆</h1>
        <button onClick={onBack} className="back-button">
          ← 返回
        </button>
      </div>

      {/* Player Progress Panel */}
      <div className="retro-panel progress-panel">
        <div className="panel-header">
          <span className="panel-icon">📊</span>
          <span>玩家进度</span>
        </div>
        <div className="panel-content">
          <div className="progress-stats">
            <div className="stat-item">
              <span className="stat-label">当前最高分:</span>
              <span className="stat-value">{getHighestScore()}</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{
                width: `${Math.min((parseInt(getHighestScore()) / 160) * 100, 100)}%`
              }}></div>
              <div className="progress-markers">
                <span className="marker" style={{left: '31.25%'}}>50</span>
                <span className="marker" style={{left: '100%'}}>160</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* NFT Collection Panel */}
      <div className="retro-panel collection-panel">
        <div className="panel-header">
          <span className="panel-icon">🎨</span>
          <span>我的收藏</span>
        </div>
        <div className="panel-content">
          <div className="nft-grid">
            {nftItems.map((nft) => (
              <div 
                key={nft.id} 
                className={`nft-card ${nft.minted ? 'minted' : ''} ${nft.canMint ? 'can-mint' : ''}`}
                onClick={() => setSelectedNFT(nft)}
              >
                <div className="nft-image">
                  <img 
                    src={nft.image} 
                    alt={nft.name}
                    onError={(e) => {
                      // Fallback to emoji if image doesn't load
                      e.currentTarget.style.display = 'none'
                      e.currentTarget.parentElement!.innerHTML = nft.type === 'closed' ? '🤐' : '😮'
                    }}
                  />
                </div>
                <div className="nft-info">
                  <h3>{nft.name}</h3>
                  <div className="nft-status">
                    {nft.minted ? (
                      <span className="status-badge minted">已获得</span>
                    ) : nft.canMint ? (
                      <span className="status-badge can-mint">可铸造</span>
                    ) : (
                      <span className="status-badge locked">需要 {nft.score} 分</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* NFT Details Modal */}
      {selectedNFT && (
        <div className="nft-modal" onClick={() => setSelectedNFT(null)}>
          <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
            <div className="panel-header">
              <span className="panel-icon">🖼️</span>
              <span>{selectedNFT.name}</span>
              <button 
                className="close-button"
                onClick={() => setSelectedNFT(null)}
              >
                ✕
              </button>
            </div>
            <div className="panel-content">
              <div className="nft-detail">
                <div className="nft-detail-image">
                  <img 
                    src={selectedNFT.image} 
                    alt={selectedNFT.name}
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                      e.currentTarget.parentElement!.innerHTML = `<div class="emoji-fallback">${selectedNFT.type === 'closed' ? '🤐' : '😮'}</div>`
                    }}
                  />
                </div>
                <div className="nft-detail-info">
                  <h3>{selectedNFT.name}</h3>
                  <p>{selectedNFT.description}</p>
                  <div className="nft-requirements">
                    <strong>解锁条件:</strong> 达到 {selectedNFT.score} 分
                  </div>
                  <div className="nft-actions">
                    {selectedNFT.minted ? (
                      <div className="minted-badge">
                        ✅ 已在你的钱包中
                      </div>
                    ) : selectedNFT.canMint ? (
                      <button 
                        className="retro-button mint-button"
                        onClick={() => handleMintNFT(selectedNFT)}
                        disabled={
                          (selectedNFT.type === 'closed' && isMintingClosed) ||
                          (selectedNFT.type === 'open' && isMintingOpen)
                        }
                      >
                        {((selectedNFT.type === 'closed' && isMintingClosed) ||
                          (selectedNFT.type === 'open' && isMintingOpen)) 
                          ? '铸造中...' : '🎯 铸造 NFT'}
                      </button>
                    ) : (
                      <div className="locked-message">
                        🔒 还需要 {selectedNFT.score - parseInt(getHighestScore())} 分解锁
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Instructions Panel */}
      <div className="retro-panel instructions-panel">
        <div className="panel-header">
          <span className="panel-icon">💡</span>
          <span>NFT 说明</span>
        </div>
        <div className="panel-content">
          <div className="instruction-list">
            <div className="instruction-item">
              <span className="instruction-icon">🎮</span>
              <span>在游戏中达到指定分数即可解锁对应NFT</span>
            </div>
            <div className="instruction-item">
              <span className="instruction-icon">🎯</span>
              <span>每个NFT只能铸造一次，请珍惜</span>
            </div>
            <div className="instruction-item">
              <span className="instruction-icon">💎</span>
              <span>NFT将永久存储在区块链上</span>
            </div>
          </div>
        </div>
      </div>

      <style>{nftGalleryStyles}</style>
    </div>
  )
}

const nftGalleryStyles = `
  .nft-gallery {
    width: 100vw;
    height: 100vh;
    background: #8B7355;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 20px;
    font-family: 'Microsoft YaHei', SimSun, serif;
    overflow-y: auto;
    gap: 15px;
  }

  .retro-panel {
    background: #E6D7C3;
    border: 4px solid #2C1810;
    border-radius: 0;
    position: relative;
    box-shadow: 
      inset -2px -2px 0 #C5B299,
      inset 2px 2px 0 #F5E6D3,
      4px 4px 8px rgba(0,0,0,0.3);
  }

  .title-panel {
    width: 400px;
    padding: 20px;
    text-align: center;
    position: relative;
  }

  .title-panel h1 {
    font-size: 24px;
    color: #2C1810;
    font-weight: bold;
    text-shadow: 1px 1px 0 #F5E6D3;
    margin: 0;
  }

  .back-button {
    position: absolute;
    top: 20px;
    left: 20px;
    background: #DC143C;
    color: white;
    border: 2px solid #8B0000;
    padding: 8px 16px;
    font-size: 12px;
    font-weight: bold;
    cursor: pointer;
    font-family: inherit;
  }

  .back-button:hover {
    background: #FF6347;
  }

  .progress-panel, .collection-panel, .instructions-panel {
    width: 500px;
    max-width: calc(100vw - 40px);
  }

  .panel-header {
    background: #D4C5AA;
    padding: 12px 20px;
    border-bottom: 2px solid #2C1810;
    font-size: 16px;
    font-weight: bold;
    color: #2C1810;
    display: flex;
    align-items: center;
    gap: 10px;
    position: relative;
  }

  .close-button {
    position: absolute;
    right: 15px;
    background: none;
    border: none;
    font-size: 18px;
    cursor: pointer;
    color: #2C1810;
    font-weight: bold;
  }

  .close-button:hover {
    color: #DC143C;
  }

  .panel-content {
    padding: 20px;
  }

  .progress-stats {
    display: flex;
    flex-direction: column;
    gap: 15px;
  }

  .stat-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 16px;
    font-weight: bold;
    color: #2C1810;
  }

  .stat-value {
    color: #8B4513;
    font-size: 18px;
  }

  .progress-bar {
    position: relative;
    height: 30px;
    background: #C5B299;
    border: 2px solid #2C1810;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #228B22, #32CD32);
    transition: width 0.5s ease;
  }

  .progress-markers {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;
  }

  .marker {
    position: absolute;
    top: -25px;
    font-size: 12px;
    font-weight: bold;
    color: #2C1810;
    transform: translateX(-50%);
  }

  .nft-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 20px;
  }

  .nft-card {
    background: #F5E6D3;
    border: 3px solid #2C1810;
    padding: 15px;
    cursor: pointer;
    transition: all 0.2s;
    position: relative;
    box-shadow: 
      inset -1px -1px 0 #D4C5AA,
      inset 1px 1px 0 #FFFFFF;
  }

  .nft-card:hover {
    background: #FFFFFF;
    transform: translateY(-2px);
    box-shadow: 
      inset -1px -1px 0 #E6D7C3,
      inset 1px 1px 0 #FFFFFF,
      0 4px 8px rgba(0,0,0,0.2);
  }

  .nft-card.minted {
    background: #E6FFE6;
    border-color: #228B22;
  }

  .nft-card.can-mint {
    background: #FFE6CC;
    border-color: #FF8C00;
    animation: glow 2s infinite alternate;
  }

  @keyframes glow {
    from { box-shadow: inset -1px -1px 0 #D4C5AA, inset 1px 1px 0 #FFFFFF; }
    to { box-shadow: inset -1px -1px 0 #D4C5AA, inset 1px 1px 0 #FFFFFF, 0 0 15px rgba(255, 140, 0, 0.5); }
  }

  .nft-image {
    width: 100%;
    height: 120px;
    background: #D4C5AA;
    border: 2px solid #2C1810;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 15px;
    font-size: 48px;
    overflow: hidden;
  }

  .nft-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .nft-info h3 {
    margin: 0 0 10px 0;
    font-size: 16px;
    font-weight: bold;
    color: #2C1810;
    text-align: center;
  }

  .nft-status {
    text-align: center;
  }

  .status-badge {
    padding: 6px 12px;
    font-size: 12px;
    font-weight: bold;
    border-radius: 0;
    display: inline-block;
  }

  .status-badge.minted {
    background: #228B22;
    color: white;
    border: 2px solid #0F4F0F;
  }

  .status-badge.can-mint {
    background: #FF8C00;
    color: white;
    border: 2px solid #FF4500;
    animation: pulse 1.5s infinite;
  }

  .status-badge.locked {
    background: #808080;
    color: white;
    border: 2px solid #404040;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
  }

  .nft-modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0,0,0,0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .modal-panel {
    background: #E6D7C3;
    border: 4px solid #2C1810;
    width: 90%;
    max-width: 500px;
    max-height: 80vh;
    overflow-y: auto;
    box-shadow: 
      inset -2px -2px 0 #C5B299,
      inset 2px 2px 0 #F5E6D3,
      8px 8px 16px rgba(0,0,0,0.5);
  }

  .nft-detail {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .nft-detail-image {
    width: 200px;
    height: 200px;
    background: #D4C5AA;
    border: 3px solid #2C1810;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto;
    font-size: 80px;
    overflow: hidden;
  }

  .nft-detail-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .emoji-fallback {
    font-size: 80px;
  }

  .nft-detail-info {
    text-align: center;
  }

  .nft-detail-info h3 {
    font-size: 24px;
    color: #2C1810;
    margin: 0 0 15px 0;
    font-weight: bold;
  }

  .nft-detail-info p {
    color: #2C1810;
    font-size: 14px;
    line-height: 1.6;
    margin: 0 0 20px 0;
  }

  .nft-requirements {
    background: #F5E6D3;
    padding: 15px;
    border: 2px solid #C5B299;
    margin: 20px 0;
    font-size: 14px;
    color: #2C1810;
  }

  .nft-actions {
    margin-top: 20px;
  }

  .retro-button {
    background: #E6D7C3;
    border: 3px solid #2C1810;
    color: #2C1810;
    padding: 12px 24px;
    font-size: 14px;
    font-weight: bold;
    cursor: pointer;
    font-family: inherit;
    box-shadow: 
      inset -1px -1px 0 #C5B299,
      inset 1px 1px 0 #F5E6D3;
    transition: all 0.1s;
  }

  .retro-button:hover:not(:disabled) {
    background: #F0E1CE;
    box-shadow: 
      inset -1px -1px 0 #D4C5AA,
      inset 1px 1px 0 #FFFFFF;
  }

  .retro-button:active:not(:disabled) {
    box-shadow: 
      inset 1px 1px 0 #C5B299,
      inset -1px -1px 0 #F5E6D3;
  }

  .retro-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    background: #D4C5AA;
  }

  .mint-button {
    background: #FF8C00;
    color: white;
    border-color: #FF4500;
    font-size: 16px;
    padding: 15px 30px;
  }

  .mint-button:hover:not(:disabled) {
    background: #FFA500;
  }

  .minted-badge {
    background: #228B22;
    color: white;
    padding: 15px 30px;
    font-size: 16px;
    font-weight: bold;
    border: 3px solid #0F4F0F;
    display: inline-block;
  }

  .locked-message {
    background: #808080;
    color: white;
    padding: 15px 30px;
    font-size: 14px;
    font-weight: bold;
    border: 3px solid #404040;
    display: inline-block;
  }

  .instruction-list {
    display: flex;
    flex-direction: column;
    gap: 15px;
  }

  .instruction-item {
    display: flex;
    align-items: center;
    gap: 15px;
    padding: 12px;
    background: #F5E6D3;
    border: 2px solid #C5B299;
    font-size: 14px;
    color: #2C1810;
  }

  .instruction-icon {
    font-size: 20px;
    min-width: 30px;
  }

  .success-modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0,0,0,0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2000;
  }

  .modal-content {
    background: #E6D7C3;
    border: 4px solid #228B22;
    padding: 40px;
    text-align: center;
    box-shadow: 
      inset -2px -2px 0 #C5B299,
      inset 2px 2px 0 #F5E6D3,
      8px 8px 16px rgba(0,0,0,0.5);
  }

  .modal-content h2 {
    font-size: 24px;
    color: #228B22;
    margin: 0 0 15px 0;
    font-weight: bold;
  }

  .modal-content p {
    font-size: 16px;
    color: #2C1810;
    margin: 0;
  }

  .message-panel {
    width: 400px;
    max-width: calc(100vw - 40px);
  }

  /* Mobile responsive */
  @media (max-width: 768px) {
    .nft-gallery {
      padding: 10px;
    }
    
    .title-panel, .progress-panel, .collection-panel, .instructions-panel, .message-panel {
      width: calc(100vw - 40px);
      max-width: none;
    }
    
    .nft-grid {
      grid-template-columns: 1fr;
    }
    
    .nft-detail {
      align-items: center;
    }
    
    .nft-detail-image {
      width: 150px;
      height: 150px;
      font-size: 60px;
    }
    
    .modal-panel {
      width: 95%;
      margin: 20px;
    }
    
    .back-button {
      position: static;
      margin-top: 15px;
    }
    
    .title-panel {
      text-align: center;
    }
  }
`
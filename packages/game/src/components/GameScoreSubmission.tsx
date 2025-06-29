import { useState } from 'react'
import { useGameSession } from '../hooks/useGameSession'
import { useWeb3, usePlayerStatus } from '../hooks/useWeb3'
import { CONTRACT_CONFIG } from '../contracts/config'

interface GameScoreSubmissionProps {
  finalScore: number
  nftEligibility?: {
    type: string
    name: string
    threshold: number
  } | null
}

export function GameScoreSubmission({ 
  finalScore, 
  nftEligibility
}: GameScoreSubmissionProps) {
  const { endGameSession } = useGameSession()
  const { address } = useWeb3()
  const { playerStatus, refetchPlayerStatus } = usePlayerStatus(address)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmitScore = async () => {
    if (!address) {
      setError('钱包未连接!')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      await endGameSession(finalScore)
      setSubmitted(true)
      
      // Refresh player status to get updated NFT eligibility but don't trigger transitions
      setTimeout(async () => {
        await refetchPlayerStatus()
        // 分数提交完成后不再调用 onSubmissionComplete，避免跳转到其他界面
        console.log('分数已成功提交到区块链，游戏结束')
      }, 2000)
    } catch (error) {
      console.error('提交分数失败:', error)
      setError('提交分数失败，请重试!')
    } finally {
      setIsSubmitting(false)
    }
  }

  const isNewHighScore = playerStatus?.highestScore 
    ? finalScore > parseInt(playerStatus.highestScore.toString())
    : finalScore > 0

  const canGetClosedMouthNFT = finalScore >= CONTRACT_CONFIG.CLOSED_MOUTH_THRESHOLD
  const canGetOpenMouthNFT = finalScore >= CONTRACT_CONFIG.OPEN_MOUTH_THRESHOLD

  if (submitted) {
    return (
      <div className="score-submission">
        <div className="retro-panel success-panel">
          <div className="panel-header">
            <span className="panel-icon">🎮</span>
            <span>游戏结束</span>
          </div>
          <div className="panel-content">
            <div className="success-message">
              <h2>游戏完成!</h2>
              <div className="final-score">{finalScore}</div>
              <p>你的最终得分是 {finalScore} 分</p>
              
              {isNewHighScore && (
                <div className="new-record">
                  <p>🏆 新记录达成!</p>
                </div>
              )}

              {finalScore >= CONTRACT_CONFIG.CLOSED_MOUTH_THRESHOLD && (
                <div className="nft-reward">
                  <p>🎯 恭喜！你达到了NFT获取条件！</p>
                  {finalScore >= CONTRACT_CONFIG.OPEN_MOUTH_THRESHOLD 
                    ? <p>你可以获得「张嘴小马NFT」</p>
                    : <p>你可以获得「闭嘴小马NFT」</p>
                  }
                </div>
              )}

              <div className="game-complete-notice">
                <p>🎮 游戏已结束，感谢你的参与！</p>
                <p>如果你提交了分数，它已记录到区块链上。</p>
              </div>
            </div>
          </div>
        </div>

        <style>{scoreSubmissionStyles}</style>
      </div>
    )
  }

  return (
    <div className="score-submission">
      <div className="retro-panel score-panel">
        <div className="panel-header">
          <span className="panel-icon">🎮</span>
          <span>游戏结束</span>
        </div>
        <div className="panel-content">
          <div className="score-display">
            <h2>你的得分</h2>
            <div className="final-score">{finalScore}</div>
            
            {isNewHighScore && (
              <div className="new-record-notice">
                <p>🏆 新记录!</p>
              </div>
            )}

            <div className="score-details">
              <p>当前最高分: {playerStatus?.highestScore?.toString() || '0'}</p>
              <p>本次得分: {finalScore}</p>
            </div>

            <div className="rewards-info">
              <h3>NFT 奖励状态:</h3>
              <div className="reward-item">
                <span className={`reward-status ${canGetClosedMouthNFT ? 'available' : 'locked'}`}>
                  {canGetClosedMouthNFT ? '✅' : '❌'} 闭嘴小马NFT (需要{CONTRACT_CONFIG.CLOSED_MOUTH_THRESHOLD}分)
                </span>
              </div>
              <div className="reward-item">
                <span className={`reward-status ${canGetOpenMouthNFT ? 'available' : 'locked'}`}>
                  {canGetOpenMouthNFT ? '✅' : '❌'} 张嘴小马NFT (需要{CONTRACT_CONFIG.OPEN_MOUTH_THRESHOLD}分)
                </span>
              </div>
              {nftEligibility && (
                <div className="current-eligible">
                  🎉 恭喜! 你可以获得: <strong>{nftEligibility.name}</strong>
                </div>
              )}
            </div>

            {error && (
              <div className="error-message">
                <p>❌ {error}</p>
              </div>
            )}

            <div className="action-buttons">
              <button 
                onClick={handleSubmitScore}
                disabled={isSubmitting}
                className="retro-button submit-button"
              >
                {isSubmitting ? '提交中...' : '提交分数到区块链'}
              </button>
              
              <button 
                onClick={() => {
                  setSubmitted(true) // 直接显示完成状态，不调用钱包跳转
                }}
                className="retro-button cancel-button"
              >
                跳过提交
              </button>
            </div>

            <div className="info-notice">
              <p>💡 提交分数将消耗少量Gas费，但会永久记录你的成绩</p>
            </div>
          </div>
        </div>
      </div>

      <style>{scoreSubmissionStyles}</style>
    </div>
  )
}

const scoreSubmissionStyles = `
  .score-submission {
    width: 100vw;
    height: 100vh;
    background: #8B7355;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    font-family: 'Microsoft YaHei', SimSun, serif;
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
    width: 100%;
    max-width: 500px;
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
  }

  .panel-content {
    padding: 30px;
    text-align: center;
  }

  .score-display h2,
  .success-message h2 {
    font-size: 24px;
    color: #2C1810;
    margin: 0 0 20px 0;
    font-weight: bold;
  }

  .final-score {
    font-size: 48px;
    font-weight: bold;
    color: #FF8C00;
    margin: 20px 0;
    text-shadow: 2px 2px 0 #2C1810;
  }

  .new-record-notice,
  .new-record {
    background: #FFD700;
    color: #8B4513;
    padding: 10px 20px;
    margin: 15px 0;
    border: 3px solid #DAA520;
    font-weight: bold;
    animation: glow 1.5s infinite alternate;
  }

  @keyframes glow {
    from { box-shadow: 0 0 5px rgba(255, 215, 0, 0.5); }
    to { box-shadow: 0 0 15px rgba(255, 215, 0, 0.8); }
  }

  .score-details {
    background: #F5E6D3;
    padding: 15px;
    margin: 20px 0;
    border: 2px solid #C5B299;
    text-align: left;
  }

  .score-details p {
    margin: 8px 0;
    font-size: 14px;
    color: #2C1810;
    font-weight: bold;
  }

  .rewards-info {
    margin: 25px 0;
  }

  .rewards-info h3 {
    font-size: 16px;
    color: #2C1810;
    margin: 0 0 15px 0;
    font-weight: bold;
  }

  .reward-item {
    margin: 10px 0;
  }

  .reward-status {
    display: inline-block;
    padding: 8px 15px;
    font-size: 14px;
    font-weight: bold;
    border: 2px solid;
  }

  .reward-status.available {
    background: #228B22;
    color: white;
    border-color: #0F4F0F;
  }

  .reward-status.locked {
    background: #808080;
    color: white;
    border-color: #404040;
  }

  .error-message {
    background: #FF6B6B;
    color: white;
    padding: 12px;
    margin: 15px 0;
    border: 2px solid #DC143C;
    font-weight: bold;
  }

  .action-buttons {
    display: flex;
    flex-direction: column;
    gap: 15px;
    margin: 25px 0;
  }

  .retro-button {
    background: #E6D7C3;
    border: 3px solid #2C1810;
    color: #2C1810;
    padding: 15px 24px;
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

  .submit-button {
    background: #4A90E2;
    color: white;
    border-color: #2C5AA0;
    font-size: 16px;
  }

  .submit-button:hover:not(:disabled) {
    background: #5BA3F5;
  }

  .cancel-button {
    background: #808080;
    color: white;
    border-color: #404040;
  }

  .cancel-button:hover:not(:disabled) {
    background: #A0A0A0;
  }

  .back-button {
    background: #228B22;
    color: white;
    border-color: #0F4F0F;
    font-size: 16px;
    margin-top: 20px;
  }

  .back-button:hover:not(:disabled) {
    background: #32CD32;
  }

  .info-notice {
    margin-top: 20px;
    padding: 12px;
    background: #F5E6D3;
    border: 2px solid #C5B299;
    font-size: 12px;
    color: #2C1810;
    line-height: 1.4;
  }

  .success-message {
    text-align: center;
  }

  .success-message p {
    margin: 15px 0;
    font-size: 16px;
    color: #2C1810;
  }

  .nft-reward {
    background: #E6FFE6;
    color: #228B22;
    padding: 12px;
    margin: 15px 0;
    border: 2px solid #90EE90;
    font-weight: bold;
  }

  .current-eligible {
    background: #FFD700;
    color: #8B4513;
    padding: 12px;
    margin: 15px 0;
    border: 2px solid #DAA520;
    font-weight: bold;
    animation: pulse 1.5s infinite;
  }

  .game-complete-notice {
    background: #E6F3FF;
    color: #2C5282;
    padding: 20px;
    margin: 20px 0;
    border: 2px solid #A3D2FF;
    border-radius: 8px;
    font-weight: normal;
    text-align: center;
  }

  .game-complete-notice p {
    margin: 8px 0;
    font-size: 14px;
    line-height: 1.5;
  }

  /* Mobile responsive */
  @media (max-width: 768px) {
    .score-submission {
      padding: 10px;
    }
    
    .retro-panel {
      max-width: calc(100vw - 20px);
    }
    
    .panel-content {
      padding: 20px;
    }
    
    .final-score {
      font-size: 36px;
    }
    
    .action-buttons {
      gap: 10px;
    }
  }
`
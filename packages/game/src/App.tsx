import './App.css'
import { Web3Provider } from './components/Web3Provider'
import Web3MusicGame from './components/Web3MusicGame'

function App() {
  return (
    <Web3Provider>
      <Web3MusicGame />
    </Web3Provider>
  )
}

export default App

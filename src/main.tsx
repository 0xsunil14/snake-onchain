import ReactDOM from 'react-dom/client'
import { WagmiConfig } from 'wagmi'
import App from './App'
import { wagmiConfig } from './wagmi'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <WagmiConfig config={wagmiConfig}>
    <App />
  </WagmiConfig>
)

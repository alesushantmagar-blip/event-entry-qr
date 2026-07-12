import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { clusterApiUrl } from '@solana/web3.js'
import '@solana/wallet-adapter-react-ui/styles.css'
import App from './App.tsx'
import './index.css'

const endpoint = import.meta.env.VITE_HELIUS_RPC_URL || clusterApiUrl('devnet')

// Intentionally empty: Phantom (and most modern wallets) register
// themselves automatically via the Wallet Standard. Manually adding
// PhantomWalletAdapter on top creates a duplicate entry and can cause
// sendTransaction to hang on a stale reference.
const wallets: never[] = []

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <App />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  </StrictMode>,
)

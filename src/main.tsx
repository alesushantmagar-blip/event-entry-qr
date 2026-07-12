import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets'
import { clusterApiUrl } from '@solana/web3.js'
import '@solana/wallet-adapter-react-ui/styles.css'
import App from './App.tsx'
import './index.css'

const endpoint = import.meta.env.VITE_HELIUS_RPC_URL || clusterApiUrl('devnet')

// Explicitly using the legacy PhantomWalletAdapter here rather than
// auto-detected Standard Wallet: testing showed Phantom's newer
// Wallet Standard signAndSendTransaction path fails on multi-instruction
// transactions (e.g. USDC transfers that also create a token account),
// while this legacy adapter handles them correctly. The console warning
// about Phantom already being a Standard Wallet is safe to ignore here.
const wallets = [new PhantomWalletAdapter()]

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

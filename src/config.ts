import { address, createSolanaRpc } from '@solana/kit'

const HELIUS_RPC_URL = import.meta.env.VITE_HELIUS_RPC_URL || 'https://api.devnet.solana.com'

export const rpc = createSolanaRpc(HELIUS_RPC_URL)

export const MERCHANT_WALLET = address('8MqW5jP5qvKECuazcsbvPg7yQJh4tZki8MywqtNDgjQL')
export const MERCHANT_WALLET_STR = '8MqW5jP5qvKECuazcsbvPg7yQJh4tZki8MywqtNDgjQL'

// USDC is the source-of-truth price for the entry fee (stable, easy to
// reason about). The SOL price is derived live so both currencies charge
// the same real-world value -- see src/lib/price.ts.
export const ENTRY_FEE_USDC = 0.01 // = 1 cent

// Used only if the live SOL price fetch fails, so the app still works.
export const FALLBACK_ENTRY_FEE_SOL = 0.0001

// Circle's official Solana Devnet USDC mint
export const USDC_DEVNET_MINT = '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU'
export const USDC_DECIMALS = 6

export type Currency = 'SOL' | 'USDC'

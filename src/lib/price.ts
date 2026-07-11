// Fetches the current SOL/USD price so the SOL entry fee can be kept
// equal in real value to the USDC entry fee, rather than an arbitrary
// flat number.
export async function fetchSolPriceUsd(): Promise<number> {
  const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd')
  if (!res.ok) throw new Error('Price fetch failed')
  const data = await res.json()
  const price = data?.solana?.usd
  if (typeof price !== 'number') throw new Error('Unexpected price response')
  return price
}

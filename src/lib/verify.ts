import { findReference, validateTransfer } from '@solana/pay'
import { rpc, MERCHANT_WALLET, USDC_DEVNET_MINT } from '../config'
import type { Address } from '@solana/kit'
import { address } from '@solana/kit'
import type { Currency } from '../config'

export async function checkPayment(
  reference: Address,
  expectedAmount: number,
  currency: Currency = 'SOL'
): Promise<boolean> {
  try {
    const signatureInfo = await findReference(rpc, reference)

    await validateTransfer(rpc, signatureInfo.signature, {
      recipient: MERCHANT_WALLET,
      amount: expectedAmount,
      ...(currency === 'USDC' ? { splToken: address(USDC_DEVNET_MINT) } : {}),
    })

    return true
  } catch {
    return false
  }
}

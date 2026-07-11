import { encodeURL } from '@solana/pay'
import { generateKeyPairSigner, address } from '@solana/kit'
import { MERCHANT_WALLET, USDC_DEVNET_MINT } from '../config'
import type { Currency } from '../config'

export async function generatePaymentRequest(
  attendeeName: string,
  groupSize: number,
  currency: Currency,
  perPersonFee: number
) {
  const referenceSigner = await generateKeyPairSigner()
  const reference = referenceSigner.address

  const totalAmount = perPersonFee * groupSize

  const message =
    groupSize > 1
      ? `Entry fee for ${attendeeName} + ${groupSize - 1} guest${groupSize - 1 > 1 ? 's' : ''} (${groupSize} total)`
      : `Entry fee for ${attendeeName}`

  const rawUrl = encodeURL({
    recipient: MERCHANT_WALLET,
    amount: totalAmount,
    reference,
    label: 'Event Entry',
    message,
    ...(currency === 'USDC' ? { splToken: address(USDC_DEVNET_MINT) } : {}),
  })

  // Fix "+"-encoded spaces -> proper "%20" URI encoding (Solflare requires this)
  const fixedUrlString = rawUrl.toString().replace(/\+/g, '%20')
  const url = new URL(fixedUrlString)

  return { url, reference, totalAmount, groupSize, currency }
}

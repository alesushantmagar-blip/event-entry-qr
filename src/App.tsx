import { useState, useEffect } from 'react'
import { useWallet, useConnection } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js'
import {
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  createTransferInstruction,
} from '@solana/spl-token'
import { generatePaymentRequest } from './lib/payment'
import { checkPayment } from './lib/verify'
import { fetchSolPriceUsd } from './lib/price'
import { QRDisplay } from './components/QRDisplay'
import {
  MERCHANT_WALLET_STR,
  ENTRY_FEE_USDC,
  FALLBACK_ENTRY_FEE_SOL,
  USDC_DEVNET_MINT,
  USDC_DECIMALS,
} from './config'
import type { Currency } from './config'
import './App.css'

function App() {
  const { publicKey, sendTransaction, connected } = useWallet()
  const { connection } = useConnection()

  const [name, setName] = useState('')
  const [groupSizeInput, setGroupSizeInput] = useState('1')
  const [currency, setCurrency] = useState<Currency>('SOL')
  const [payment, setPayment] = useState<{
    url: URL
    reference: string
    totalAmount: number
    groupSize: number
    currency: Currency
  } | null>(null)
  const [attendee, setAttendee] = useState('')
  const [paid, setPaid] = useState(false)
  const [status, setStatus] = useState('')
  const [txSignature, setTxSignature] = useState<string | null>(null)
  const [solFee, setSolFee] = useState<number | null>(null)
  const [priceLoading, setPriceLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setPriceLoading(true)
    fetchSolPriceUsd()
      .then((solUsdPrice) => {
        if (cancelled) return
        setSolFee(ENTRY_FEE_USDC / solUsdPrice)
      })
      .catch(() => {
        if (cancelled) return
        setSolFee(FALLBACK_ENTRY_FEE_SOL)
      })
      .finally(() => {
        if (!cancelled) setPriceLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const groupSize = Math.max(1, parseInt(groupSizeInput, 10) || 1)
  const perPersonFee = currency === 'SOL' ? (solFee ?? FALLBACK_ENTRY_FEE_SOL) : ENTRY_FEE_USDC

  const handleGenerate = async () => {
    if (!name) return
    setPaid(false)
    setTxSignature(null)
    setStatus('')
    const result = await generatePaymentRequest(name, groupSize, currency, perPersonFee)
    console.log('Payment URL:', result.url.toString())
    setPayment(result)
    setAttendee(name)
  }

  const handlePayDirectly = async () => {
    if (!publicKey || !payment) return
    try {
      setStatus('Sending transaction...')
      const merchantPubkey = new PublicKey(MERCHANT_WALLET_STR)

      if (payment.currency === 'SOL') {
        const transaction = new Transaction().add(
          SystemProgram.transfer({
            fromPubkey: publicKey,
            toPubkey: merchantPubkey,
            lamports: Math.round(payment.totalAmount * LAMPORTS_PER_SOL),
          })
        )
        const signature = await sendTransaction(transaction, connection)
        setTxSignature(signature)
        setStatus('Confirming...')
        await connection.confirmTransaction(signature, 'confirmed')
      } else {
        const usdcMint = new PublicKey(USDC_DEVNET_MINT)
        const senderATA = await getAssociatedTokenAddress(usdcMint, publicKey)
        const merchantATA = await getAssociatedTokenAddress(usdcMint, merchantPubkey)

        const transaction = new Transaction()

        const merchantAccountInfo = await connection.getAccountInfo(merchantATA)
        if (!merchantAccountInfo) {
          transaction.add(
            createAssociatedTokenAccountInstruction(publicKey, merchantATA, merchantPubkey, usdcMint)
          )
        }

        const amountInBaseUnits = Math.round(payment.totalAmount * 10 ** USDC_DECIMALS)
        transaction.add(
          createTransferInstruction(senderATA, merchantATA, publicKey, amountInBaseUnits)
        )

        const signature = await sendTransaction(transaction, connection)
        setTxSignature(signature)
        setStatus('Confirming...')
        await connection.confirmTransaction(signature, 'confirmed')
      }

      setPaid(true)
      setStatus('confirmed')
    } catch (err: any) {
      console.error('Payment error (full object):', err)
      console.error('Error message:', err?.message)
      console.error('Error.error (nested):', err?.error)
      console.error('Error.error.message:', err?.error?.message)
      console.error('Error logs:', err?.logs)
      console.error('Error cause:', err?.cause)
      console.error('Error name:', err?.name)
      console.error('All own keys:', Object.keys(err || {}))
      setStatus('error')
    }
  }

  useEffect(() => {
    if (!payment || paid) return
    const interval = setInterval(async () => {
      const confirmed = await checkPayment(payment.reference as any, payment.totalAmount, payment.currency)
      if (confirmed) {
        setPaid(true)
        clearInterval(interval)
      }
    }, 3000)
    return () => clearInterval(interval)
  }, [payment, paid])

  const isError = status === 'error'

  return (
    <div className="app">
      <div className="app-header">
        <p className="eyebrow">Solana Devnet - Entry Terminal</p>
        <h1 className="app-title">Event Entry</h1>
        <p className="app-subtitle">
          Issue a ticket, get a scannable Solana Pay QR, and watch payment confirm on-chain in real time.
        </p>
        <div className="wallet-row">
          <WalletMultiButton />
        </div>
      </div>

      <div className="ticket">
        <div className="ticket-issue">
          <div>
            <p className="field-label">Attendee name</p>
            <input
              className="name-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Sushant Magar"
              style={{ width: '100%', marginTop: '0.4rem' }}
            />
          </div>

          <div>
            <p className="field-label">Group size</p>
            <input
              className="name-input"
              type="number"
              min={1}
              value={groupSizeInput}
              onChange={(e) => setGroupSizeInput(e.target.value)}
              onBlur={() => setGroupSizeInput(String(groupSize))}
              style={{ width: '100%', marginTop: '0.4rem' }}
            />
          </div>

          <div>
            <p className="field-label">Pay with</p>
            <div className="currency-toggle">
              <button
                type="button"
                className={'currency-option' + (currency === 'SOL' ? ' active' : '')}
                onClick={() => setCurrency('SOL')}
              >
                SOL
              </button>
              <button
                type="button"
                className={'currency-option' + (currency === 'USDC' ? ' active' : '')}
                onClick={() => setCurrency('USDC')}
              >
                USDC
              </button>
            </div>
          </div>

          <button className="btn btn-primary" onClick={handleGenerate}>
            Issue Ticket
          </button>

          <p className="fee-line">
            {currency === 'SOL' && priceLoading ? (
              'Fetching live SOL price...'
            ) : (
              <>
                Entry fee <strong>{perPersonFee.toFixed(currency === 'SOL' ? 6 : 2)} {currency}</strong> x {groupSize} ={' '}
                <strong>{(perPersonFee * groupSize).toFixed(currency === 'SOL' ? 6 : 2)} {currency}</strong>
                {currency === 'SOL' && <> (approx ${(ENTRY_FEE_USDC * groupSize).toFixed(2)})</>}
              </>
            )}
          </p>
        </div>

        <div className="perforation" />

        <div className="ticket-stub">
          {!payment && (
            <>
              <div className="viewfinder">
                <span className="tl" />
                <span className="tr" />
                <span className="bl" />
                <span className="br" />
              </div>
              <p className="ticket-stub-empty">
                Issue a ticket to generate the QR, reference, and live payment status here.
              </p>
            </>
          )}

          {payment && (
            <div className="stub-content">
              <p className="attendee-name">
                {attendee}
                {payment.groupSize > 1 ? ` + ${payment.groupSize - 1} guest${payment.groupSize > 2 ? 's' : ''}` : ''}
              </p>

              <div className="qr-frame">
                <QRDisplay url={payment.url} />
              </div>

              <p className="ref-code">
                REF <span>{payment.reference}</span>
              </p>

              <p className="ref-code">
                TOTAL <span>{payment.totalAmount} {payment.currency}</span> - {payment.groupSize}{' '}
                {payment.groupSize === 1 ? 'person' : 'people'}
              </p>

              {connected && !paid && (
                <button className="btn btn-secondary" onClick={handlePayDirectly}>
                  Pay Directly from Browser Wallet
                </button>
              )}

              <span
                className={
                  'status-pill ' +
                  (paid ? 'status-confirmed' : isError ? 'status-error' : 'status-waiting')
                }
              >
                <span className="status-dot" />
                {paid ? 'Payment confirmed' : isError ? 'Payment failed' : status || 'Waiting for payment'}
              </span>

              {txSignature && (
                <a
                  className="explorer-link"
                  href={`https://explorer.solana.com/tx/${txSignature}?cluster=devnet`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View transaction on Solana Explorer
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default App

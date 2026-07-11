# Event Entry QR

A ticketing app for events, built on Solana Pay. You type in an attendee's name, pick SOL or USDC, and it spits out a QR code they can scan to pay their entry fee. Payment gets checked on-chain automatically, no backend or database involved.

Built this for a Superteam Earn hackathon (USDC checkout w/ Solana Pay track).

## Features

- Unique QR code per attendee, each tied to its own on-chain reference so payments can be tracked individually
- Works with SOL or USDC. The USDC price (1 cent) is the base price, and the SOL amount is calculated from the live SOL/USD rate so both options cost the same in real terms
- Group payments - one QR can cover multiple people at once, just multiplies the fee
- Also has a "Pay Directly" button if you've got a wallet extension connected in your browser, in case scanning a QR isn't convenient
- Payment status updates live (waiting -> confirmed) by polling the chain for the transaction
- Link to view the confirmed tx on Solana Explorer once it's done

## Built with

- Vite + React + TypeScript
- `@solana/pay` - builds the payment URL, generates the QR, and handles on-chain verification
- `@solana/wallet-adapter-react` / `wallet-adapter-react-ui` - browser wallet connect
- `@solana/web3.js` + `@solana/spl-token` - constructing the actual transactions
- `@solana/kit` - used internally by this version of `@solana/pay`
- Running on Solana Devnet

## Running it

```bash
git clone https://github.com/alesushantmagar-blip/event-entry-qr.git
cd event-entry-qr
npm install --legacy-peer-deps
npm run dev
```

Then open whatever localhost URL Vite gives you.

You'll need:
- Phantom (or similar) set to Devnet
- Some devnet SOL - faucet.solana.com or solfaucet.com
- Devnet USDC if you want to test that option - Circle's faucet at faucet.circle.com, pick Solana Devnet. Different token from devnet SOL, you'll need both separately.

To actually try it out:
1. Type a name (and group size if you want), pick a currency, hit Issue Ticket
2. Connect your wallet up top
3. Hit "Pay Directly from Browser Wallet" and approve it
4. Should confirm within a few seconds, then you can check it on Explorer

## A note on QR scanning

The QR is a valid Solana Pay URL, I checked it against spec directly (including using proper %20 encoding for spaces instead of the + encoding some libraries default to, since that trips up stricter wallets like Solflare).

That said, mobile wallet support for scanning is a bit inconsistent right now:
- SOL QR works fine scanning with Solflare
- USDC QR shows the right recipient in Solflare but not the amount - probably because devnet USDC doesn't have the token metadata that mainnet USDC has
- Phantom on iOS only picks up the recipient address when scanning, not the full payment details, for either currency. Seems to be a Phantom-specific thing, not a QR formatting issue on my end

Point is, if you want it to just work every time, use the "Pay Directly" button instead of scanning. That path is fully tested for both SOL and USDC.

## Config

Wallet address and pricing are set in `src/config.ts`:

```ts
export const MERCHANT_WALLET_STR = '<your wallet address>'
export const ENTRY_FEE_USDC = 0.01 // base price, SOL is derived from this
```

## Notes

This is all devnet right now. For mainnet you'd swap the RPC endpoint, use the real USDC mint instead of the devnet one, and make sure the merchant wallet has a proper token account set up.

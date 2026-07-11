import { useEffect, useRef } from 'react'
import { createQR } from '@solana/pay'

export function QRDisplay({ url }: { url: URL }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current) return
    ref.current.innerHTML = ''
    const qr = createQR(url, 300, 'transparent')
    qr.append(ref.current)
  }, [url])

  return <div ref={ref} />
}

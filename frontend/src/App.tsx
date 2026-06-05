import React, { useEffect, useState } from 'react'
let hasComponentRemount = false

export default function App() {
  const [identityKey, setIdentityKey] = useState<string | null>(null)

  useEffect(() => {
    //? We use a flag (hasComponentRemount) to ensure that the transaction creation function is only called once when the app starts. This prevents multiple transactions from being created if the component re-renders for any reason, which is important for debugging and ensuring that we don't create unintended transactions.
    if (hasComponentRemount) return
    hasComponentRemount = true

    const init = async () => {
      try {
        await initializeClient()
        const key = await getMyIdentityKey()
        setIdentityKey(key)
      } catch (err) {
        console.error('Initialization error:', err)
      }
    }
    init()
  }, [])

  return <div>Whatever code</div>
}

import { createContext, useContext, useEffect, useState } from 'react'

export const BackendContext = createContext(null)
export const useBackend = () => useContext(BackendContext)

// Live rows from one collection.
export function useCollection(name) {
  const be = useBackend()
  const [rows, setRows] = useState(null)
  const [error, setError] = useState(null)
  useEffect(() => {
    if (!be) return
    return be.subscribe(name, setRows, setError)
  }, [be, name])
  return { rows: rows || [], loading: rows === null && !error, error }
}

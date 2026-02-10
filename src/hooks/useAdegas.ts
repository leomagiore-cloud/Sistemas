import { supabase } from '@/lib/supabase'
import { useEffect, useState } from 'react'

export function useAdegas(userId?: string) {
  const [adegas, setAdegas] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) return

    async function fetchAdegas() {
      const { data, error } = await supabase
        .from('adega_usuarios')
        .select(`
          adega:adegas (
            id,
            nome
          )
        `)
        .eq('user_id', userId)

      if (!error) {
        setAdegas(data.map(d => d.adega))
      }

      setLoading(false)
    }

    fetchAdegas()
  }, [userId])

  return { adegas, loading }
}

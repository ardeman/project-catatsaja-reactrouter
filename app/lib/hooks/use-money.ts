import { useUserData } from '~/lib/hooks/use-get-user'
import { TFinanceCurrency } from '~/lib/types/finance'
import { formatCurrency, getDefaultCurrencyFormat } from '~/lib/utils/parser'

// Formats amounts with the person's own currency format (settings).
export const useMoney = () => {
  const { data: userData } = useUserData()
  const format = userData?.currencyFormat ?? getDefaultCurrencyFormat()

  return (amount: number, currency: TFinanceCurrency, signed = false) => {
    const text = formatCurrency({ amount: Math.abs(amount), format, currency })
    if (!signed || amount === 0) return text
    return `${amount < 0 ? '−' : '+'}${text}`
  }
}

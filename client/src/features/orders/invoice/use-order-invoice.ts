import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { downloadOrderInvoice, printOrderInvoice } from './order-invoice'
import type { Order } from '../slice/orders-types'

type InvoiceAction = 'print' | 'download'

/**
 * Print / download an order's invoice in the current language. `pending`
 * says which of the two is running, so a button can disable itself while a
 * PDF is being rendered.
 */
export const useOrderInvoice = () => {
  const { t, i18n } = useTranslation()
  const [pending, setPending] = useState<InvoiceAction | null>(null)

  const run = async (action: InvoiceAction, order: Order) => {
    if (pending) return
    setPending(action)

    const options = {
      t: (key: string) => t(key),
      language: i18n.language,
      dir: i18n.dir(i18n.language),
    }

    try {
      if (action === 'print') await printOrderInvoice(order, options)
      else await downloadOrderInvoice(order, options)
    } catch {
      toast.error(t('Could not generate the invoice.'))
    } finally {
      setPending(null)
    }
  }

  return {
    pending,
    print: (order: Order) => run('print', order),
    download: (order: Order) => run('download', order),
  }
}

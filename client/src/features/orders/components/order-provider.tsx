import useDialogState from '#/hooks/use-dialog-state'

import React, { createContext, useContext, useState } from 'react'
import type { Order } from '../slice/orders-types'

export type OrderDialogType =
  'create-order' | 'edit-order' | 'delete-order' | 'details-order'

type OrderContextType = {
  open: OrderDialogType | null
  setOpen: (str: OrderDialogType | null) => void
  currentRow: Order | null
  // Through the `React` namespace rather than inline `type` specifiers: this
  // file's lint config wants type imports split out, and a second `import
  // type` from 'react' would trip `import/no-duplicates` instead.
  setCurrentRow: React.Dispatch<React.SetStateAction<Order | null>>
}

const OrderContext = createContext<OrderContextType | null>(null)

export function OrderProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useDialogState<OrderDialogType>(null)
  const [currentRow, setCurrentRow] = useState<Order | null>(null)

  return (
    <OrderContext.Provider
      value={{
        open,
        setOpen,
        currentRow,
        setCurrentRow,
      }}
    >
      {children}
    </OrderContext.Provider>
  )
}

export const useOrder = () => {
  const orderContext = useContext(OrderContext)

  if (!orderContext) {
    throw new Error('useOrder has to be used within <OrderContext.Provider>')
  }

  return orderContext
}

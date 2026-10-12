import useDialogState from '#/hooks/use-dialog-state'

import React, {
  createContext,
  useContext,
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react'
import type { Customer } from '../slice/customers-types'

export type CustomerDialogType =
  'create-customer' | 'edit-customer' | 'delete-customer'

type CustomerContextType = {
  open: CustomerDialogType | null
  setOpen: (str: CustomerDialogType | null) => void
  currentRow: Customer | null
  setCurrentRow: Dispatch<SetStateAction<Customer | null>>
}

const CustomerContext = createContext<CustomerContextType | null>(null)

export function CustomerProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useDialogState<CustomerDialogType>(null)
  const [currentRow, setCurrentRow] = useState<Customer | null>(null)

  return (
    <CustomerContext.Provider
      value={{
        open,
        setOpen,
        currentRow,
        setCurrentRow,
      }}
    >
      {children}
    </CustomerContext.Provider>
  )
}

export const useCustomer = () => {
  const customerContext = useContext(CustomerContext)

  if (!customerContext) {
    throw new Error(
      'useCustomer has to be used within <CustomerContext.Provider>',
    )
  }

  return customerContext
}

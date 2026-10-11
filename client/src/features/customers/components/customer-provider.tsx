import useDialogState from '#/hooks/use-dialog-state'

import React, { createContext, useContext } from 'react'

export type CustomerDialogType = 'create-task'

type CustomerContextType = {
  open: CustomerDialogType | null
  setOpen: (str: CustomerDialogType | null) => void
}

const CustomerContext = createContext<CustomerContextType | null>(null)

export function CustomerProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useDialogState<CustomerDialogType>(null)

  return (
    <CustomerContext.Provider
      value={{
        open,
        setOpen,
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

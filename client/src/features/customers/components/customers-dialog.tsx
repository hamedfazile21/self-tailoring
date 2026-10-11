import Dialog from '#/components/dialog'
import React from 'react'
import CreateCustomerDialog from './create-customer-dialog'
import { useCustomer } from './customers-provider'

const CustomerDialog = () => {
  const { open, setOpen, currentRow } = useCustomer()
  return (
    <>
      <CreateCustomerDialog
        key={'create-customer-dialog'}
        open={open === 'create-customer'}
        setOpen={setOpen}
        currentRow={null}
      />

      <CreateCustomerDialog
        key={'edit-customer-dialog'}
        open={open === 'edit-customer'}
        setOpen={setOpen}
        currentRow={currentRow}
      />
    </>
  )
}

export default CustomerDialog

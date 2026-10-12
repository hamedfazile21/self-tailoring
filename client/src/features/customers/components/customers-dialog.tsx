import Dialog from '#/components/dialog'
import React from 'react'
import CreateCustomerDialog from './create-customer-dialog'
import { useCustomer } from './customers-provider'
import DeleteCustomerDialog from './delete-customer-dialog'
import DetailsCustomerDialog from './details-customer-dialog'

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

      <DeleteCustomerDialog
        key={'delete-customer-dialog'}
        open={open === 'delete-customer'}
        setOpen={setOpen}
        currentRow={currentRow}
      />

      <DetailsCustomerDialog
        key={'details-customer-dialog'}
        open={open === 'details-customer'}
        setOpen={setOpen}
        currentRow={currentRow?.id ?? null}
      />
    </>
  )
}

export default CustomerDialog

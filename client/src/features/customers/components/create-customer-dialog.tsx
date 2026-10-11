import Dialog from '#/components/dialog'
import React, { type FC } from 'react'
import type { Customer } from '../slice/customers-types'
import type { CustomerDialogType } from './customers-provider'
import { useTranslation } from 'react-i18next'

interface props {
  open: boolean
  setOpen: (str: CustomerDialogType | null) => void
  currentRow?: Customer | null
}

const CreateCustomerDialog: FC<props> = ({ open, setOpen, currentRow }) => {
  const { t } = useTranslation('')
  const isEditMode = currentRow

  const onCloseDialog = () => {
    if (isEditMode) {
      setOpen('edit-customer')
    } else {
      setOpen('create-customer')
    }
  }

  console.log(currentRow, 'from dialog')

  return (
    <div>
      <Dialog
        open={open}
        onClose={onCloseDialog}
        title={isEditMode ? t('Update Customer') : t('New Customer')}
        children={<p>Next Step</p>}
        position="top"
        size="xl"
      />
    </div>
  )
}

export default CreateCustomerDialog

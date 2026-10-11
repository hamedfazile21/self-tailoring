import { useAppSelector } from '#/hooks/redux'
import React from 'react'
import CustomersTable from './components/customers-table'
import { useTranslation } from 'react-i18next'
import CustomerDialog from './components/customers-dialog'
import { useCustomer } from './components/customers-provider'

const Customer = () => {
  const { t } = useTranslation('')
  const { setOpen, setCurrentRow } = useCustomer()
  return (
    <div className="relative">
      <div className="flex items-center justify-between">
        <div className="mb-8">
          <h1 className="text-xl font-semibold text-foreground">
            {t('Customer')}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {t('View, search, and manage every Customer.')}
          </p>
        </div>
        <div>
          <button
            className="btn btn-primary"
            onClick={() => {
              setOpen('create-customer')
              setCurrentRow(null)
            }}
          >
            {t('New Customer')}
          </button>
        </div>
      </div>
      <div className="card w-full overflow-hidden p-0!">
        <CustomersTable />
      </div>
      <CustomerDialog />
    </div>
  )
}

export default Customer

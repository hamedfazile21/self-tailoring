import { useAppSelector } from '#/hooks/redux'
import React from 'react'
import CustomersTable from './components/customers-table'
import { useTranslation } from 'react-i18next'

const Customer = () => {
  const { t } = useTranslation('')
  const { list } = useAppSelector((state) => state.customers)
  console.log(list)
  return (
    // <div>
    //   <CustomersTable />
    // </div>
    <div className="relative">
      <div className="flex items-center justify-between">
        <div className="mb-8">
          <h1 className="text-xl font-semibold text-foreground">
            {t('Tasks')}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {t(
              'View, search, and manage every task assigned across your team.',
            )}
          </p>
        </div>
        <div>
          <button
            className="btn btn-primary"
            onClick={() => {
              //  / setOpen('create-task')
              // setCurrentRow(null)
            }}
          >
            {t('New Task')}
          </button>
        </div>
      </div>
      <div className="card w-full overflow-hidden p-0!">
        <CustomersTable />
      </div>
      {/* <TaskDialog /> */}
    </div>
  )
}

export default Customer

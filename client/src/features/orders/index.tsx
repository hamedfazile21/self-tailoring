import { useTranslation } from 'react-i18next'
import OrdersTable from './components/orders-table'
import { useOrder } from './components/order-provider'

const Orders = () => {
  const { t } = useTranslation('')
  const { setOpen, setCurrentRow } = useOrder()

  return (
    <div className="relative">
      <div className="flex items-center justify-between">
        <div className="mb-8">
          <h1 className="text-xl font-semibold text-foreground">
            {t('Orders')}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {t('View, search, and manage every order.')}
          </p>
        </div>
        <div>
          <button
            className="btn btn-primary"
            onClick={() => {
              setOpen('create-order')
              setCurrentRow(null)
            }}
          >
            {t('New Order')}
          </button>
        </div>
      </div>
      <div className="card w-full overflow-hidden p-0!">
        <OrdersTable />
      </div>
    </div>
  )
}

export default Orders

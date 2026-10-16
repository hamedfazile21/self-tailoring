import CreateOrderDialog from './create-order-dialog'
import { useOrder } from './order-provider'

const OrderDialog = () => {
  const { open, setOpen, currentRow } = useOrder()

  return (
    <>
      <CreateOrderDialog
        key={'create-order-dialog'}
        open={open === 'create-order'}
        setOpen={setOpen}
        currentRow={null}
      />

      <CreateOrderDialog
        key={'edit-order-dialog'}
        open={open === 'edit-order'}
        setOpen={setOpen}
        currentRow={currentRow}
      />
    </>
  )
}

export default OrderDialog

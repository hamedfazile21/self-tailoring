import Card from '#/components/card/card'
import { useAppSelector } from '#/hooks/redux'
import {
  DollarSign,
  Key,
  ShoppingCart,
  TrendingDown,
  TrendingUp,
  Users,
} from 'lucide-react'
import React from 'react'

// const stats = [
//   {
//     label: 'Total Customer',
//     value: 12,
//     change: null,
//     up: true,
//     icon: DollarSign,
//   },
//   {
//     label: 'Active Measurements',
//     value: 12,
//     change: null,
//     up: true,
//     icon: Users,
//   },
//   {
//     label: 'Total Orders',
//     value: 12,
//     change: null,
//     up: false,
//     icon: ShoppingCart,
//   },
// ]

const CardInfo = () => {
  const { totals } = useAppSelector((state) => state.dashboard)

  const currentIcon = (label: string) => {
    switch (label) {
      case 'customers':
        return Users
      case 'measurements':
        return Key
      case 'orders':
        return ShoppingCart
      default:
        return null
    }
  }

  const stats = Object.entries(totals.data ?? {}).map(([label, value]) => ({
    label: `Total ${label}`,
    value: value ?? '',
    change: null,
    up: true,
    icon: currentIcon(label),
  }))

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {stats.map((value, index: React.Key) => {
        const Icon = value.icon
        return (
          <Card key={index} view="stat" className="">
            <Card.Header>
              <Card.Description>{value.label}</Card.Description>
              <Card.Title>{value.value ?? ''}</Card.Title>
            </Card.Header>
            <Card.Icon>{Icon && <Icon size={18} />}</Card.Icon>
          </Card>
        )
      })}
    </div>
  )
}

export default CardInfo

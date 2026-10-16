import { configureStore } from '@reduxjs/toolkit'
import themeSlice from '../features/theme/slice/theme-slice'
import dashboardSlice from '../features/dashboard/slice/dashboard-slice'
import customersSlice from '../features/customers/slice/customers-slice'
import settingsSlice from '../features/settings/slice/settings-slice'
import ordersSlice from '../features/orders/slice/orders-slice'

export const store = configureStore({
  reducer: {
    themeConfig: themeSlice,
    dashboard: dashboardSlice,
    customers: customersSlice,
    settings: settingsSlice,
    orders: ordersSlice,
  },
})

// Infer the types from the store
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

import { configureStore } from '@reduxjs/toolkit'
import themeSlice from '../features/theme/slice/theme-slice'
import dashboardSlice from '../features/dashboard/slice/dashboard-slice'
import customersSlice from '../features/customers/slice/customers-slice'

export const store = configureStore({
  reducer: {
    themeConfig: themeSlice,
    dashboard: dashboardSlice,
    customers: customersSlice,
  },
})

// Infer the types from the store
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

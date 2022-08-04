import { configureStore, ThunkAction, Action } from '@reduxjs/toolkit'
import { authencicatedApi } from './rtkQuery/api'
import { authSlice, initUser } from './slices/auth'

export const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
    [authencicatedApi.reducerPath]: authencicatedApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(authencicatedApi.middleware),
})

export type AppDispatch = typeof store.dispatch
export type RootState = ReturnType<typeof store.getState>
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>

store.dispatch(initUser())

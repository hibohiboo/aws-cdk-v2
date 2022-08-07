import { configureStore, ThunkAction, Action } from '@reduxjs/toolkit'
import { authencicatedApi, unauthencicatedApi } from './rtkQuery/api'
import { authSlice, initUser } from './slices/auth'

export const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
    [authencicatedApi.reducerPath]: authencicatedApi.reducer,
    [unauthencicatedApi.reducerPath]: unauthencicatedApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(authencicatedApi.middleware)
      .concat(unauthencicatedApi.middleware),
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

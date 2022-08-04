import {
  createAsyncThunk,
  createSlice,
  SerializedError,
} from '@reduxjs/toolkit'
import { Auth } from 'aws-amplify'

interface AuthState {
  username?: string
  authenticated: boolean
  error?: SerializedError
}

const initialState: AuthState = {
  username: undefined,
  authenticated: false,
  error: undefined,
}


export const initUser = createAsyncThunk<AuthState>(
  'initUser',
  async (req, thunkAPI) => {
    try {
      const result = await Auth.currentAuthenticatedUser()
      return { username: result.username, authenticated: true }
    } catch (error: any) {
      return thunkAPI.rejectWithValue({ error: error.message })
    }
  },
)

export const signIn = createAsyncThunk<AuthState, { username: string, password: string }>(
  'signIn',
  async ({ username, password }, thunkAPI) => {
    try {
      const result = await Auth.signIn(username, password)
      return { username: result.username, authenticated: true }
    } catch (error: any) {
      return thunkAPI.rejectWithValue({ error: error.message })
    }
  },
)

export const signOut = createAsyncThunk('logout', async (_, thunkAPI) => {
  try {
    await Auth.signOut()
  } catch (error: any) {
    return thunkAPI.rejectWithValue({ error: error.message })
  }
})

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(signIn.fulfilled, (state, action) => {
      state.username = action.payload.username
      state.authenticated = true
    })
    builder.addCase(signIn.rejected, (state, action) => {
      state.error = action.error
      state.authenticated = false
      state.username = initialState.username
    })
    builder.addCase(signOut.fulfilled, (state) => {
      state.authenticated = false
      state.username = initialState.username
    })
    builder.addCase(signOut.rejected, (state, action) => {
      state.error = action.error
      state.authenticated = false
      state.username = initialState.username
    })
    builder.addCase(initUser.fulfilled, (state, action) => {
      state.authenticated = true
      state.username = action.payload.username
    })
  }
})

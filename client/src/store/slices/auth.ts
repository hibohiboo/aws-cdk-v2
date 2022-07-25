import {
  createAsyncThunk,
  createSlice,
  SerializedError,
} from '@reduxjs/toolkit'

const signInAnonymously = () => ({ user: { uid: 'test' } })
interface AuthState {
  uid?: string
  authenticated?: boolean
  error?: SerializedError
}

const initialState: AuthState = {
  uid: undefined,
  authenticated: undefined,
  error: undefined,
}

interface PayLoad {
  uid?: string
}

export const login = createAsyncThunk<AuthState, PayLoad>(
  'login',
  async (req, thunkAPI) => {
    try {
      if (req.uid == null) {
        const response = await signInAnonymously()
        const uid = response.user?.uid
        return { uid }
      }
      const uid = req.uid
      return { uid }
    } catch (error: any) {
      return thunkAPI.rejectWithValue({ error: error.message })
    }
  },
)

export const logout = createAsyncThunk('logout', async (_, thunkAPI) => {
  try {
    // await auth.signOut()
  } catch (error: any) {
    return thunkAPI.rejectWithValue({ error: error.message })
  }
})

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(login.fulfilled, (state, action) => {
      state.uid = action.payload.uid
      state.authenticated = true
    })
    builder.addCase(login.rejected, (state, action) => {
      state.error = action.error
    })
    builder.addCase(logout.fulfilled, (state) => {
      state.authenticated = false
      state.uid = initialState.uid
    })
    builder.addCase(logout.rejected, (state, action) => {
      state.error = action.error
    })
  },
})

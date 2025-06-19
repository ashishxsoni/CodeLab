import { createSlice } from "@reduxjs/toolkit";
import axios from "axios";

const initialState = {
  isAuth: false,
  userData: null,
  isLoading: true, // New state to track authentication loading
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    login: (state, action) => {
      state.isAuth = true;
      state.userData = action.payload;
      state.isLoading = false;
    },
    logout: (state) => {
      state.isAuth = false;
      state.userData = null;
      state.isLoading = false;
    },
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
  },
});

export const { login, logout, setLoading } = authSlice.actions;
export default authSlice.reducer;

// Async action to check user authentication on page reload
// export const checkAuth = () => async (dispatch) => {
//   dispatch(setLoading(true)); // Start loading
//   try {
//     const response = await axios.get("http://localhost:5000/user/current-user", {
//       withCredentials: true,
//     });
//     if (response.data.success) {
//       dispatch(login(response.data.user));
//     } else {
//       dispatch(logout());
//     }
//   } catch (error) {
//     console.log("No user Logged In:");
//     dispatch(logout());
//   }
// };
export const checkAuth = () => async (dispatch) => {
  dispatch(setLoading(true)); // Start loading
  try {
    // const response = await axios.get("http://localhost:5000/user/current-user", {
    const response = await axios.get(`${String(import.meta.env.VITE_API_URL)}/user/current-user`, {
      withCredentials: true,
    });

    if (response.data.success) {
      dispatch(login(response.data.user));
     
    } else {
      console.log("No user Logged In: Wanrning Auth Starting");

      dispatch(logout());
    }
  } catch (error) {
    console.log("No user Logged In:");
    // dispatch(logout());
  } finally {
    dispatch(setLoading(false)); // ✅ Ensure loading stops even if there's an error
  }
};


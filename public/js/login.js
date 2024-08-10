import axios from 'axios';
import { showAlert } from './alerts';

// axios package for http requests, returns promise
export const login = async (email, password) => {
  // console.log(`email: ${email}, password: ${password}`);
  try {
    const res = await axios({
      method: 'POST',
      url: 'http://127.0.0.1:3000/api/v1/users/login',
      data: {
        email,
        password,
      },
    });

    // console.log(res);
    if (res.data.status === 'success') {
      showAlert('success', 'Logged in successfully!');
      // After 1.5s redirect to homepage
      window.setTimeout(() => {
        location.assign('/');
      }, 750);
    }
  } catch (err) {
    // per axios documentation, error logging
    showAlert('error', err.response.data.message);
  }
};

export const logout = async () => {
  try {
    const res = await axios({
      method: 'GET',
      url: 'http://127.0.0.1:3000/api/v1/users/logout',
    });
    // Reload the page client-side, if logged-out successfully
    if (res.data.status === 'success') window.location.replace("/");
  } catch (err) {
    console.log(err.response);
    showAlert('error', 'Error logging out');
  }
};

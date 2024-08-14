/* eslint-disable */
import axios from 'axios';
import { showAlert } from './alerts';

// axios package for http requests, returns promise
export const login = async (email, password) => {
  try {
    const res = await axios({
      method: 'POST',
      url: 'http://localhost:8000/api/v1/users/login',
      data: {
        email,
        password,
      },
    });

    if (res.data.status === 'success') {
      showAlert('success', 'Logged in!');
      window.setTimeout(() => {
        location.assign('/');
      }, 750);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};

export const logOut = async (req, res) => {
  try {
    const res = await axios({
      method: 'GET',
      url: 'http://localhost:8000/api/v1/users/logout',
    });
    // Reload the page client-side, if logged-out successfully
    if (res.data.status === 'success') {
      window.location.replace("/");
    }
  } catch (err) {
    console.log(err.response);
    showAlert('error', 'Error logging out');
  }
};

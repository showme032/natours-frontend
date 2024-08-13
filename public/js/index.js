/*eslint-disable */
import '@babel/polyfill';
import { displayMap } from './mapbox';
import { logOut, login } from './login';
import { updateSettings } from './updateSettings';
import { bookTour } from './stripe';
// TODO: enable signup
import { signUp } from './signUp';

const mapBox = document.getElementById('map');
// const mapBox = document.querySelector('#mapbox');
const loginForm = document.querySelector('.form--login');
const singupForm = document.querySelector('.form--signup');
const logOutBtn = document.querySelector('.nav__el--logout');
const userDataForm = document.querySelector('.form-user-data');
const userPasswordForm = document.querySelector('.form-user-password');
const bookBtn = document.getElementById('book-tour');

// Delegation
if (mapBox) {
  const locations = JSON.parse(mapBox.dataset.locations);
  displayMap(locations);
}

// Submit login form
if (loginForm) {
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    login(email, password);
  });
}

if (logOutBtn) logOutBtn.addEventListener('click', e => {
  logOut();
});

// Update user data
if (userDataForm) {
  userDataForm.addEventListener('submit', e => {
    e.preventDefault();

    const form = new FormData();
    form.append('name', document.getElementById('name').value);
    form.append('email', document.getElementById('email').value);
    form.append('photo', document.getElementById('photo').files[0]);
    console.log(form);


    updateSettings(form, 'data');
  });
}

// Update user password
if (userPasswordForm)
  userPasswordForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btnPass = document.getElementById('btn-pass-update');
    btnPass.textContent = 'Updating...';
    const passwordCurrent = document.getElementById('password-current').value;
    const password = document.getElementById('password').value;
    const passwordConfirm = document.getElementById('password-confirm').value;

    await updateSettings(
      { passwordCurrent, password, passwordConfirm },
      'password',
    );

    // clear values, but i like page reloading better
    // document.getElementById('password-current').value = ''
    // document.getElementById('password').value = ''
    // document.getElementById('password-confirm').value = ''
  });

if (bookBtn) {
  bookBtn.addEventListener('click', e => {
    // const tourId = e.target.dataset.tourId;
    e.target.textContent = 'Processing...';
    const { tourId } = e.target.dataset;

    bookTour(tourId);
  });
}

// TODO: signup implementation
if (singupForm) {
  console.log('signup form found')
  document.querySelector('.form--signup').addEventListener('submit', e => {
    e.preventDefault();
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const passwordConfirm = document.getElementById('passwordConfirm').value;
    console.log(name, email, password, passwordConfirm);
    signUp(name, email, password, passwordConfirm);
  });
}

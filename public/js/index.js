// import 'core-js/stable';
import { displayMap } from './mapbox';
import { login, logout } from './login';
import { updateSettings } from './updateSettings';
import { bookTour } from './stripe';


// DOM Elements
const mapBox = document.getElementById('map');
const form = document.querySelector('.form--login');
const logOutBtn = document.querySelector('.nav__el--logout');
const userDataForm = document.querySelector('.form-user-data');
const userPasswordForm = document.querySelector('.form-user-password');
const bookBtn = document.getElementById('book-tour');

// Values, delegated to submitting the form in the end

// Delegation
if (mapBox) {
  const locations = JSON.parse(mapBox.dataset.locations);
  displayMap(locations);
}

// Submit login form
if (form) {
  form.addEventListener('submit', e => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    login(email, password);
  });
}

// Logout
if (logOutBtn) {
  logOutBtn.addEventListener('click', e => {
    logout();
  });
}

// Update user data
if (userDataForm) {
  userDataForm.addEventListener('submit', e => {
    e.preventDefault();

    const form = new FormData(form);
    form.append('name', document.getElementById('name').value);
    form.append('email', document.getElementById('email').value);
    form.append('photo', document.getElementById('photo').files[0]);
    console.log(form);

    // const name = document.getElementById('name').value;
    // const email = document.getElementById('email').value;

    updateSettings(form, 'data');
  });
}

// Update user password
if (userPasswordForm) {
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
}

if (bookBtn) {
  bookBtn.addEventListener('click', e => {
    // const tourId = e.target.dataset.tourId;
    e.target.textContent = 'Processing...';
    const { tourId } = e.target.dataset;

    bookTour(tourId);
  });
}
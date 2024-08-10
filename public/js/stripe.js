import axios from 'axios';
import { showAlert } from './alerts';

const stripe = Stripe(
  'pk_test_51Pd4wZCm0C0PZJ72CqyWpCypI6t2W8RXSWkCRRYYd7AhJYO8ciLzOXt6hxTBkBS7ORMueIs3Gu9ozcdux5S3JzFF00kDSUGnbi');

export const bookTour = async tourId => {
  try {
//   1. Get session from the api
    const session = await axios(`http://127.0.0.1:3000/api/v1/bookings/checkout-session/${tourId}`);
    console.log(session);
//   2. User stripe object to create checkout form + charge the credit-card
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id,
    });
  } catch (err) {
    console.log(err);
    showAlert('error', err);
  }
};
const FormData = require("form-data");
const { default: axios } = require("axios");
const { yyyymmdd } = require("./utils");
const { ROLLING_HOURS, UTC_OFFSET, LOGIN } = require("./constants");

async function bookableWorkouts(clubId) {
  // Creating today's date and the time range for the next 72 hours.
  const today = yyyymmdd(Date.now());
  const start = new Date();
  const end = new Date();
  end.setHours(end.getHours() + ROLLING_HOURS);
  // The url for getting all workouts for the next 7 days.
  const url = `https://www.goodlifefitness.com/content/goodlife/en/book-workout/jcr:content/root/responsivegrid/workoutbooking.GetWorkoutSlots.${clubId}.${today}.json`;
  // Sending a GET request for getting all workouts then returning the bookable once only.
  const response = await axios.get(url);
  // All workouts for the next 7 days.
  const workouts = response.data.map.response.reduce((acc, day) => {
    if (Array.isArray(day.workouts) && day.workouts.length > 0) {
      return [...acc, ...day.workouts];
    }
    return acc;
  }, []);
  // Grab all bookable workouts within the time range.
  let startMarker = workouts.findIndex(
    ({ startAt }) => start < new Date(startAt + UTC_OFFSET)
  );
  let endMarker = workouts.findIndex(
    ({ startAt }) => end < new Date(startAt + UTC_OFFSET)
  );
  if (startMarker === -1) return [];
  else if (endMarker === -1) return workouts.slice(startMarker);
  else return workouts.slice(startMarker, endMarker);
}

async function newestBookableWorkout(clubId) {
  // Creating today's date and the timing after 72 hours.
  const today = yyyymmdd(Date.now());
  const timing = new Date();
  timing.setHours(timing.getHours() + ROLLING_HOURS);
  // The url for getting all workouts for the next 7 days.
  const url = `https://www.goodlifefitness.com/content/goodlife/en/book-workout/jcr:content/root/responsivegrid/workoutbooking.GetWorkoutSlots.${clubId}.${today}.json`;
  // Sending a GET request for getting all workouts then returning the newest bookable workout.
  const response = await axios.get(url);
  // All workouts for the next 7 days.
  const workouts = response.data.map.response.reduce((acc, day) => {
    if (Array.isArray(day.workouts) && day.workouts.length > 0) {
      return [...acc, ...day.workouts];
    }
    return acc;
  }, []);
  // Find the newest bookable workout.
  const marker = workouts.findIndex(
    ({ startAt }) => timing < new Date(startAt + UTC_OFFSET)
  );
  if (marker === -1) return workouts.pop();
  else {
    if (marker === 0) return undefined;
    else return workouts[marker - 1];
  }
}

async function nextWorkoutToBeBooked(clubId) {
  // Creating today's date and the timing after 72 hours.
  const today = yyyymmdd(Date.now());
  const timing = new Date();
  timing.setHours(timing.getHours() + ROLLING_HOURS);
  // The url for getting all workouts for the next 7 days.
  const url = `https://www.goodlifefitness.com/content/goodlife/en/book-workout/jcr:content/root/responsivegrid/workoutbooking.GetWorkoutSlots.${clubId}.${today}.json`;
  // Sending a GET request for getting all workouts then returning the next workout to be booked.
  const response = await axios.get(url);
  // All workouts for the next 7 days.
  const workouts = response.data.map.response.reduce((acc, day) => {
    if (Array.isArray(day.workouts) && day.workouts.length > 0) {
      return [...acc, ...day.workouts];
    }
    return acc;
  }, []);
  // Find the next workout to be booked.
  const marker = workouts.findIndex(
    ({ startAt }) => timing < new Date(startAt + UTC_OFFSET)
  );
  if (marker === -1) return undefined;
  else return workouts[marker];
}

async function nextWorkoutsToBeBooked(clubIds) {
  const workouts = [];
  for (let i = 0; i < clubIds.length; i++) {
    workouts.push(await nextWorkoutToBeBooked(clubIds[i]));
  }
  return workouts;
}

async function nearbyClubs(latitude, longitude) {
  // Creating today's date and coordinate strings.
  const today = yyyymmdd(Date.now());
  const latStr = latitude.toString().replace(".", "_");
  const longStr = longitude.toString().replace(".", "_");
  // The url for getting all nearby clubs.
  const url = `https://www.goodlifefitness.com/content/goodlife/en/clubs/jcr:content/root/responsivegrid/responsivegrid_1015243366/findaclub.ClubByMapBounds.${latStr}.${longStr}...${today}.json`;
  // Sending a GET request for getting all nearby clubs.
  const response = await axios.get(url);
  return response.data.map.response;
}

async function authenticateMember(password, token) {
  // Creating the form data.
  const formData = new FormData();
  formData.append("login", LOGIN);
  formData.append("passwordParameter", password);
  if (typeof token !== "undefined") formData.append("captchaToken", token);
  // The url for member authentication.
  const url = `https://www.goodlifefitness.com/content/experience-fragments/goodlife/header/master/jcr:content/root/responsivegrid/header.AuthenticateMember.json`;
  // Sending a POST request for member authentication and returning cookies.
  const response = await axios.post(url, formData, {
    headers: formData.getHeaders(),
  });
  return response.headers["set-cookie"];
}

async function updateLastLogin(cookies) {
  // The url for updating last login.
  const url = `https://www.goodlifefitness.com/content/experience-fragments/goodlife/header/master/jcr:content/root/responsivegrid/header.Update_Last_Login.json`;
  // Sending a POST request for updating last login and returning a message.
  const response = await axios.post(url, {}, { headers: { cookie: cookies } });
  return response.data.map.response;
}

async function logoutMember(cookies) {
  // The url for member logout.
  const url = `https://www.goodlifefitness.com/content/experience-fragments/goodlife/header/master/jcr:content/root/responsivegrid/header.LogoutMember.json`;
  // Sending a POST request for member logout and returning cookies.
  const response = await axios.post(url, {}, { headers: { cookie: cookies } });
  return response.headers["set-cookie"];
}

async function memberBookings(cookies) {
  // Creating today's date.
  const today = yyyymmdd(Date.now());
  // The url for getting all member bookings.
  const url = `https://www.goodlifefitness.com/content/goodlife/en/book-workout/jcr:content/root/responsivegrid/workoutbooking.GetMemberWorkoutBookings.${today}.json`;
  // Sending a GET request for getting all member bookings.
  const response = await axios.get(url, { headers: { cookie: cookies } });
  return Object.values(response.data.map.response);
}

async function bookWorkout(clubId, timeSlotId, cookies, token) {
  // Creating the form data.
  const formData = new FormData();
  formData.append("clubId", clubId);
  formData.append("timeSlotId", timeSlotId);
  if (typeof token !== "undefined") formData.append("captchaToken", token);
  // The url for booking a workout.
  const url = `https://www.goodlifefitness.com/content/goodlife/en/book-workout/jcr:content/root/responsivegrid/workoutbooking.CreateWorkoutBooking.json`;
  // Sending a POST request for booking a workout then returning the booking
  // details for the workout.
  const response = await axios.post(url, formData, {
    headers: { ...formData.getHeaders(), cookie: cookies },
  });
  return response.data.map.response;
}

async function cancelWorkout(clubId, bookingId, cookies) {
  // The url for cancelling a workout.
  const url = `https://www.goodlifefitness.com/content/goodlife/en/book-workout/jcr:content/root/responsivegrid/workoutbooking.CancelWorkoutBooking.json?clubId=${clubId}&bookingId=${bookingId}`;
  // Sending a DELETE request for cancelling a workout then returning booking details.
  const response = await axios.delete(url, {
    headers: { cookie: cookies },
  });
  return response.data.map.response;
}

module.exports = {
  bookableWorkouts,
  newestBookableWorkout,
  nextWorkoutToBeBooked,
  nextWorkoutsToBeBooked,
  nearbyClubs,
  authenticateMember,
  updateLastLogin,
  logoutMember,
  memberBookings,
  bookWorkout,
  cancelWorkout,
};

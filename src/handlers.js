const requests = require("./requests");
const logger = require("./logger");

function nextWorkoutToBeBooked(
  clubId,
  onfulfilled = (workout) => {},
  onrejected = (error) => {}
) {
  requests
    .nextWorkoutToBeBooked(clubId)
    .then((workout) => {
      logger.nextWorkoutToBeBooked.fulfilled(workout);
      onfulfilled(workout);
    })
    .catch((error) => {
      logger.nextWorkoutToBeBooked.rejected(error);
      onrejected(error);
    });
}

function nextWorkoutsToBeBooked(
  clubIds,
  onfulfilled = (workouts) => {},
  onrejected = (error) => {}
) {
  requests
    .nextWorkoutsToBeBooked(clubIds)
    .then((workouts) => {
      logger.nextWorkoutsToBeBooked.fulfilled(workouts);
      onfulfilled(workouts);
    })
    .catch((error) => {
      logger.nextWorkoutsToBeBooked.rejected(error);
      onrejected(error);
    });
}

function login(
  password,
  token,
  onfulfilled = (cookies) => {},
  onrejected = (error) => {}
) {
  requests
    .authenticateMember(password, token)
    .then((cookies) => {
      logger.authenticateMember.fulfilled();
      requests
        .updateLastLogin(cookies)
        .then((message) => {
          logger.updateLastLogin.fulfilled();
          onfulfilled(cookies);
        })
        .catch((error) => {
          logger.updateLastLogin.rejected(error);
          onrejected(error);
        });
    })
    .catch((error) => {
      logger.authenticateMember.rejected(error);
      onrejected(error);
    });
}

function memberBookings(
  cookies,
  onfulfilled = (bookings) => {},
  onrejected = (error) => {}
) {
  logger.memberBookings.before();
  requests
    .memberBookings(cookies)
    .then((bookings) => {
      logger.memberBookings.fulfilled(bookings);
      onfulfilled(bookings);
    })
    .catch((error) => {
      logger.memberBookings.rejected(error);
      onrejected(error);
    });
}

function bookWorkout(
  clubId,
  timeSlotId,
  cookies,
  token,
  onfulfilled = (booking) => {},
  onrejected = (error) => {}
) {
  logger.bookWorkout.before(clubId);
  requests
    .bookWorkout(clubId, timeSlotId, cookies, token)
    .then((booking) => {
      logger.bookWorkout.fulfilled(clubId, booking);
      onfulfilled(booking);
    })
    .catch((error) => {
      logger.bookWorkout.rejected(clubId, error);
      onrejected(error);
    });
}

module.exports = {
  nextWorkoutToBeBooked,
  nextWorkoutsToBeBooked,
  login,
  memberBookings,
  bookWorkout,
};

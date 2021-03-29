const { UTC_OFFSET, LOGIN } = require("./constants");
const { startAt, bookableAt, roundToTenths } = require("./utils");

const nextWorkoutToBeBooked = {
  fulfilled: (workout) => {
    console.log(
      `[AUTO BOOKING]\tNext workout to be booked at club ${
        workout.clubId
      }, starts at: ${startAt(workout).toLocaleString()}`
    );
    console.log(
      `[AUTO BOOKING]\tNext workout at club ${
        workout.clubId
      }, is bookable in: ${roundToTenths(
        (bookableAt(workout).getTime() - Date.now()) / (60 * 1000)
      )} minutes`
    );
  },
  rejected: (error) => {
    if (error.response) {
      let errorDescription = error.response.data.map.message;
      if (errorDescription === "API Failure Response") {
        switch (
          JSON.parse(error.response.data.map.response.message).errorCode
        ) {
          case "CLUB_NOT_FOUND":
            errorDescription = "club ID could not be found";
            break;
        }
      }
      console.log(
        `[AUTO BOOKING]\tError occured while getting next workout to be booked at one of your chosen clubs, ${errorDescription}`
      );
    } else if (error.request) {
      console.log(
        "[AUTO BOOKING]\tError occured because there is no internet connection or www.goodlifefitness.com is not reachable"
      );
    } else {
      console.log(
        `"[AUTO BOOKING]\tError occured with message: ${error.message}`
      );
    }
  },
};

const nextWorkoutsToBeBooked = {
  fulfilled: (workouts) => {
    workouts.forEach(nextWorkoutToBeBooked.fulfilled);
  },
  rejected: nextWorkoutToBeBooked.rejected,
};

const authenticateMember = {
  fulfilled: () => {
    console.log(`[LOGGING IN]\tSuccessfully logged in with ${LOGIN}`);
  },
  rejected: (error) => {
    if (error.response) {
      console.log(
        `[LOGGING IN]\tError occured while logging in with ${LOGIN} (${error.response.data.map.message})`
      );
    } else if (error.request) {
      console.log(
        "[LOGGING IN]\tError occured because there is no internet connection or www.goodlifefitness.com is not reachable"
      );
    } else {
      console.log(
        `"[LOGGING IN]\tError occured with message: ${error.message}`
      );
    }
  },
};

const updateLastLogin = {
  fulfilled: () => {
    console.log(`[LOGGING IN]\tLast login for ${LOGIN} updated`);
  },
  rejected: (error) => {
    if (error.response) {
      console.log(
        `[LOGGING IN]\tError occured while updating last login for ${LOGIN} (${error.response.data.map.message})`
      );
    } else if (error.request) {
      console.log(
        "[LOGGING IN]\tError occured because there is no internet connection or www.goodlifefitness.com is not reachable"
      );
    } else {
      console.log(
        `"[LOGGING IN]\tError occured with message: ${error.message}`
      );
    }
  },
};

const memberBookings = {
  before: () => {
    console.log(
      `[AUTO BOOKING]\tAttempting to get all member bookings (current time: ${new Date().toLocaleTimeString()})`
    );
  },
  fulfilled: (bookings) => {
    bookings.forEach(
      ({ ClubId, clubName, startAt, isOnWaitList, waitListPosition }) => {
        console.log(
          `[AUTO BOOKING]\t${
            isOnWaitList
              ? `${waitListPosition} spot${
                  waitListPosition > 1 && "s"
                } behind on waitlist`
              : "Booked in"
          } for a workout at club ${ClubId} (${clubName}) at ${new Date(
            startAt + UTC_OFFSET
          ).toLocaleString()}`
        );
      }
    );
  },
  rejected: (error) => {
    if (error.response) {
      console.log(
        `[AUTO BOOKING]\tError occured while getting all bookings (${error.response.data.map.message})`
      );
    } else if (error.request) {
      console.log(
        "[LOGGING IN]\tError occured because there is no internet connection or www.goodlifefitness.com is not reachable"
      );
    } else {
      console.log(
        `"[LOGGING IN]\tError occured with message: ${error.message}`
      );
    }
  },
};

const bookWorkout = {
  before: (clubId) => {
    console.log(
      `[AUTO BOOKING]\tAttempting to book workout at club ${clubId} (current time: ${new Date().toLocaleTimeString()})`
    );
  },
  fulfilled: (clubId, booking) => {
    console.log(
      booking.waitListPosition > 0
        ? `[AUTO BOOKING]\tBooked in waitlist for workout at club ${clubId}, you are ${
            booking.waitListPosition
          } spot${booking.waitListPosition > 1 && "s"} behind :(`
        : `[AUTO BOOKING]\tWorkout is successfully booked at club ${clubId}, YOU ARE IN!`
    );
  },
  rejected: (clubId, error) => {
    if (error.response) {
      let errorDescription = error.response.data.map.message;
      if (errorDescription === "API Failure Response") {
        switch (
          JSON.parse(error.response.data.map.response.message).errorCode
        ) {
          case "TOO_LATE":
            errorDescription =
              "too late to book workout! booking must be made before workout starts";
            break;
          case "PERSON_BUSY":
            errorDescription =
              "you already booked a workout during this time slot";
            break;
          case "ENTITY_NOT_FOUND":
            errorDescription =
              "no such time slot found! Please use the proper time slot ID";
            break;
          case "ILLEGAL_ARGUMENT":
            errorDescription = "unrecognized values for club and time slot IDs";
            break;
        }
      }
      console.log(
        `[AUTO BOOKING]\tError occured while booking workout at club ${clubId}, ${errorDescription}`
      );
    } else if (error.request) {
      console.log(
        "[LOGGING IN]\tError occured because there is no internet connection or www.goodlifefitness.com is not reachable"
      );
    } else {
      console.log(
        `"[LOGGING IN]\tError occured with message: ${error.message}`
      );
    }
  },
};

module.exports = {
  nextWorkoutToBeBooked,
  nextWorkoutsToBeBooked,
  authenticateMember,
  updateLastLogin,
  memberBookings,
  bookWorkout,
};

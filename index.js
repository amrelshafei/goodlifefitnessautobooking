const fs = require("fs");
const handlers = require("./src/handlers");
const {
  readJson,
  writeJson,
  cleanCookies,
  readLastCaptchaToken,
  bookableAt,
} = require("./src/utils");

var password = undefined;
var clubIds = [109, 276];
var checkupInterval = 10 * 60 * 1000;
var captchaInterval = 5 * 1000;

function scheduleNextBooking(clubId, cookies, callback = (booking) => {}) {
  handlers.nextWorkoutToBeBooked(
    clubId,
    (workout) => {
      if (fs.existsSync("./www.goodlifefitness.com.har")) {
        console.log(
          "[CAPTCHA]\tLast Captcha token in HAR file has been used (file will be deleted)"
        );
        setTimeout(function () {
          console.log(
            `[CAPTCHA]\tPlease download HAR file in working directory within the next ${Math.round(
              (bookableAt(workout).getTime() - Date.now()) / 1000
            )} seconds`
          );
          waitCaptcha();
        }, bookableAt(workout).getTime() - Date.now() - 120 * 1000);
      }
      setTimeout(function () {
        const token = fs.existsSync("./www.goodlifefitness.com.har")
          ? readLastCaptchaToken("./www.goodlifefitness.com.har")
          : undefined;
        if (fs.existsSync("./www.goodlifefitness.com.har")) {
          fs.unlinkSync("./www.goodlifefitness.com.har");
        }
        handlers.bookWorkout(
          clubId,
          workout.identifier,
          cookies,
          token,
          (booking) => {
            callback(booking);
          }
        );
      }, bookableAt(workout).getTime() - Date.now());
      console.log(
        `[SCHEDULING]\tScheduled booking for next workout at club ${clubId}`
      );
    },
    (error) => {
      console.log(
        `[SCHEDULING]\tAn error occured while scheduling next workout at club ${clubId} for booking`
      );
    }
  );
}

function waitCaptcha(callback = () => {}) {
  if (fs.existsSync("./www.goodlifefitness.com.har")) {
    console.log(`[CAPTCHA]\tFound a HAR file in working directory`);
    callback();
  } else {
    process.stdout.write("\x07");
    setTimeout(waitCaptcha, captchaInterval, callback);
  }
}

function runLogin(callback = (cookies) => {}) {
  const token = fs.existsSync("./www.goodlifefitness.com.har")
    ? readLastCaptchaToken("./www.goodlifefitness.com.har")
    : undefined;
  if (fs.existsSync("./www.goodlifefitness.com.har")) {
    fs.unlinkSync("./www.goodlifefitness.com.har");
  }
  handlers.login(password, token, callback, (error) => {
    if (
      error.response &&
      error.response.data.map.message === "Failed Google Captcha Validation"
    ) {
      if (typeof token === "undefined") {
        console.log("[CAPTCHA]\tCaptcha token required for login validation");
      } else {
        console.log(
          "[CAPTCHA]\tLast Captcha token in HAR file has expired, new token required!"
        );
      }
      console.log(`[CAPTCHA]\tPlease download HAR file in working directory`);
      waitCaptcha(() => {
        runLogin(callback);
      });
    }
  });
}

function runCheckup(clubIds, cookies) {
  console.log();
  console.log(
    `[AUTO BOOKING]\tRunning a checkup (current time: ${new Date().toLocaleTimeString()})`
  );
  const timestamp = Date.now();
  setTimeout(runCheckup, checkupInterval, clubIds, cookies);
  handlers.nextWorkoutsToBeBooked(clubIds, (workouts) => {
    const shouldSchedule = workouts.some(
      (workout) => bookableAt(workout).getTime() - timestamp < checkupInterval
    );
    if (shouldSchedule) {
      workouts.forEach(({ clubId }) => scheduleNextBooking(clubId, cookies));
    }
  });
}

function init() {
  // Overriding program parameters from params.json file.
  if (fs.existsSync("./params.json")) {
    const params = readJson("./params.json");
    password =
      typeof params.password === "undefined" ? password : params.password;
    clubIds = typeof params.clubIds === "undefined" ? clubIds : params.clubIds;
    checkupInterval =
      typeof params.checkupInterval === "undefined"
        ? checkupInterval
        : params.checkupInterval * 60 * 1000;
    captchaInterval =
      typeof params.captchaInterval === "undefined"
        ? captchaInterval
        : params.captchaInterval * 1000;
  }
  // Overriding program parameters from passed arguments.
  if (process.argv.slice(2).length > 0) {
    const params = process.argv.slice(2);
    password = params.find((v) => v.startsWith("PASSWORD="))
      ? params.find((v) => v.startsWith("PASSWORD=")).split("=")[1]
      : password;
    clubIds =
      params.filter((v) => !isNaN(parseInt(v))).length > 0
        ? params.filter((v) => !isNaN(parseInt(v)))
        : clubIds;
    checkupInterval = params.find((v) => v.startsWith("CHECKUP_INTERVAL="))
      ? params.find((v) => v.startsWith("CHECKUP_INTERVAL=")).split("=")[1] *
        60 *
        1000
      : checkupInterval;
    captchaInterval = params.find((v) => v.startsWith("CAPTCHA_INTERVAL="))
      ? params.find((v) => v.startsWith("CAPTCHA_INTERVAL=")).split("=")[1] *
        1000
      : captchaInterval;
  }
  // Clean stored cookies by removing expired ones.
  if (fs.existsSync("./cookies.json")) {
    cleanCookies("./cookies.json");
  } else {
    writeJson({ cookies: [] }, "./cookies.json");
  }
}

function main() {
  init();
  const cookies = readJson("./cookies.json").cookies;
  if (cookies.length > 0) {
    console.log("[AUTO BOOKING]\tStored login cookies found in cookies.json");
    runCheckup(clubIds, cookies);
  } else {
    if (typeof password === "undefined") {
      console.log(
        "[AUTO BOOKING]\tYour password is not provided (end of program)"
      );
    } else {
      runLogin((cookies) => {
        writeJson({ cookies }, "./cookies.json");
        runCheckup(clubIds, cookies);
      });
    }
  }
}

main();

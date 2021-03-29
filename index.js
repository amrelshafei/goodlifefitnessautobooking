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
var captchaRequired = false;
var captchaInterval = 5 * 1000;

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
    captchaRequired =
      typeof params.captchaRequired === "undefined"
        ? captchaRequired
        : params.captchaRequired;
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
    captchaRequired = params.find((v) => v.startsWith("CAPTCHA_REQUIRED="))
      ? params.find((v) => v.startsWith("CAPTCHA_REQUIRED=")).split("=")[1]
      : captchaRequired;
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

function waitCaptcha(callback = () => {}) {
  if (fs.existsSync("./www.goodlifefitness.com.har")) {
    console.log(`[CAPTCHA]\tFound a HAR file in working directory`);
    callback();
  } else {
    process.stdout.write("\x07");
    setTimeout(waitCaptcha, captchaInterval, callback);
  }
}

function scheduleBooking(workout, cookies, callback = (booking) => {}) {
  setTimeout(function () {
    const token =
      captchaRequired && fs.existsSync("./www.goodlifefitness.com.har")
        ? readLastCaptchaToken("./www.goodlifefitness.com.har")
        : undefined;
    if (fs.existsSync("./www.goodlifefitness.com.har")) {
      fs.unlinkSync("./www.goodlifefitness.com.har");
    }
    handlers.bookWorkout(
      workout.clubId,
      workout.identifier,
      cookies,
      token,
      (booking) => {
        callback(booking);
      },
      (error) => {
        if (
          error.response &&
          error.response.data.map.message ===
            "Failed Google Captcha Validation" &&
          !captchaRequired
        ) {
          captchaRequired = true;
          console.log(
            "[CAPTCHA]\tYou will be asked to download a Captcha token in advance before your next booking"
          );
          console.log(
            "[CAPTCHA]\tPlease set the CAPTCHA_REQUIRED parameter to true, the next time your run the program"
          );
        }
      }
    );
  }, bookableAt(workout).getTime() - Date.now());
  console.log(
    `[SCHEDULING]\tScheduled booking for next workout at club ${workout.clubId}`
  );
  if (captchaRequired) {
    setTimeout(function () {
      console.log(
        `[CAPTCHA]\tPlease download HAR file in working directory within the next ${Math.round(
          (bookableAt(workout).getTime() - Date.now()) / 1000
        )} seconds`
      );
      waitCaptcha();
    }, bookableAt(workout).getTime() - Date.now() - 120 * 1000);
  }
}

function runLogin(callback = (cookies) => {}) {
  const token =
    captchaRequired && fs.existsSync("./www.goodlifefitness.com.har")
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
      if (!captchaRequired) {
        captchaRequired = true;
        console.log(
          "[CAPTCHA]\tYou will be asked to download a Captcha token in order to login"
        );
        console.log(
          "[CAPTCHA]\tPlease set the CAPTCHA_REQUIRED parameter to true, the next time your run the program"
        );
      }
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
      workouts.forEach((workout) => scheduleBooking(workout, cookies));
    }
  });
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
    } else if (clubIds.length === 0) {
      console.log(
        "[AUTO BOOKING]\tYou must provide atleast one club ID for booking a workout (end of program)"
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

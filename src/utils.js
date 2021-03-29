const { ROLLING_HOURS, UTC_OFFSET } = require("./constants");
const fs = require("fs");

function yyyymmdd(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  let month = "" + (d.getMonth() + 1);
  let day = "" + d.getDate();
  if (month.length < 2) month = "0" + month;
  if (day.length < 2) day = "0" + day;
  return [year, month, day].join("-");
}

function roundToTenths(number) {
  return Math.round(10 * number) / 10;
}

function parseCookie(str) {
  return str
    .split(";")
    .map((pairStr) => {
      let [name, value] = pairStr.split("=");
      return [
        decodeURIComponent(name.trim()),
        typeof value === "undefined" ? true : decodeURIComponent(value.trim()),
      ];
    })
    .reduce((cookie, [name, value]) => {
      cookie[name] = value;
      return cookie;
    }, {});
}

function readJson(jsonFilepath) {
  const data = fs.readFileSync(jsonFilepath);
  return JSON.parse(data);
}

function writeJson(data, jsonFilepath) {
  fs.writeFileSync(jsonFilepath, JSON.stringify(data, null, 2), "utf8");
}

function cleanCookies(cookiesFilePath) {
  const cookies = readJson(cookiesFilePath).cookies.filter(
    (str) => new Date(parseCookie(str).Expires).getTime() > Date.now()
  );
  writeJson({ cookies }, cookiesFilePath);
  return cookies;
}

function readLastCaptchaToken(harFilePath) {
  const entries = readJson(harFilePath).log.entries.filter(
    ({ request }) =>
      request.url ===
      "https://www.google.com/recaptcha/api2/userverify?k=6Lfz3I8aAAAAACbq6gVz0yzf9__GZcUmqqdp8WHt"
  );
  if (entries.length > 0) {
    const text = entries.map(({ response }) => response.content.text).pop();
    if (text) return JSON.parse(text.slice(4))[1];
    else return undefined;
  } else return undefined;
}

function startAt(workout) {
  return new Date(workout.startAt + UTC_OFFSET);
}

function bookableAt(workout) {
  return new Date(startAt(workout).getTime() - ROLLING_HOURS * 60 * 60 * 1000);
}

module.exports = {
  yyyymmdd,
  roundToTenths,
  parseCookie,
  readJson,
  writeJson,
  cleanCookies,
  readLastCaptchaToken,
  startAt,
  bookableAt,
};

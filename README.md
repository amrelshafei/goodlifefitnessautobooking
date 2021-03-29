# **GoodLife Fitness Auto-Booking**

An auto-booking *program* for **Goodlife Fitness** *members*. Using this *program* will guarantee that your workout is booked within the first milliseconds after a workout booking is opened. This project runs on **Node JavaScript**.

Users can choose the *clubs* they would like to book workouts in and the *program* attempts to book all the workouts that will start after 72 hours. Choosing multiple *clubs* increases the user's chance of booking a workout, 72 hours in advance. If stored login *cookies* are expired or there are no stored *cookies* in the first place, the *program* will first login and store *cookies* in **cookies.json**.

## **Installation Guide**

1. Download and install **Node** [14.4.0](https://nodejs.org/download/release/v14.4.0/) for your machine.
2. Download project from **Github**.
3. From your terminal, change current working directory to the project's working directory containing **package.json**. Run the command `$ cd PROJECT_DIRECTORY`.
4. Install all project packages by running `$ npm install`.
5. Install PKG globally by running `$ npm i pkg -g` for packaging the project into an executable.
6. Turn to executable by running `$ pkg .` which will create three (**Linux**, **MacOS**, and **Windows**) executables in the project directory.
7. Close your terminal.

## **Program Parameters**

When executing the *program* either with **npm start** or by running one of the executables for your machine, you need to consider the *program* parameters that dectate your auto-booking experience:
 - **Member login password**: Must be passed only when the stored login *cookies* are expired or when there are no stored *cookies* in the first place.
 - **Clubs**: Default club IDs are hardcoded inside the *program*. The chosen *clubs* can be changed by passing their IDs as integer values. *program* must at least have one club ID.
 - **Checkup interval**: Default checkup interval time is hardcoded inside the *program*. Checkups are executed 10 minutes (default) and a schedule is set for booking a workout if it's bookable during the checkup. 
 - **Captcha-required flag**: Default value is hardcoded inside the *program*. If the *program* requires a Captcha too execute API actions, you need to pass this parameter as true (default is false). 
 - **Captcha wait interval**: Default Captcha wait interval time is hardcoded inside the *program*. If the *program* requires a Captcha too execute API actions, the *program* waits and checks if the Captcha token has been downloaded every 5 seconds (default). 

Sample commands for executing the *program*:
 - `$ npm start PASSWORD=abc123 CHECKUP_INTERVAL=8` runs *program* with **npm start**, sets checkup interval to 8 minutes, and provides password if required.
 - `$ goodlifefitnessautobooking-win.exe 109 276 CAPTCHA_INTERVAL=8` runs *program* with Windows executable, sets Captcha wait interval to 8 seconds, and provides club IDs 109 and 276.

All these parameters can also be provided to the *program* with **params.json** but will be overriden if still provided as passed *program* parameters:
```javascript
{
  "password": "abc123",
  "clubIds": [109, 276],
  "checkupInterval": 8,
  "captchaRequired": true,
  "captchaInterval": 8
}
``` 

## **How to Auto-Book?**

 - Follow the installation guide up to **step 4** to set up the project. Finish the remaining steps if you intend to run the *program* with an executable.
 - If you followed upto **step 4** then the *program*'s working directory is the one with **package.json** file and if you have an executable then the the *program*'s working directory is the director of the executable.
 - In the working directory, create your **params.json** file with your password and atleast one club ID.
 - Run the program either with **npm start** or by running one of the executables for your machine.

## **How to get a Captcha?**
 - Go to https://www.goodlifefitness.com/home.html from Chrome.
 - Right click inside the browser and choose inspect.
 - Go to network.
 - Keep DevTools open on network and pass the Google reCaptcha test.  
 - Export **HAR** file and save it to *program* directory as **www.goodlifefitness.com.har**.

## **Tips**
 - Make sure your PC is not sleep while this *program* is running, otherwise code may not execute properly.
 - Delete **cookies.json** and HAR file if same errors keeps occuring.
 - Don't set Captcha wait interval to less the 4 seconds or you will risk the *program* accessing the **HAR** file before it fully downloads.
 - Don't execute the porgram in a way where it will end up attempting to book a workout at the beginning of a checkup.

import { buildDOM, loadData } from "../main.js";

const STUDENTS_API_URL = 'https://itp.nyu.edu/NocoAPI/?action=list-students';
const ADVISORS_API_URL = 'https://itp.nyu.edu/NocoAPI/?action=list-advisors';

async function saveJSON() {
  const saveResponse = await fetch("https://itp.nyu.edu/NocoAPI/?action=save-json?");
  console.log(saveResponse);
}

/* ===============================
   BUILD DOM
================================ */

document.body.set({
  onscroll: () => _scheduleViewed.value = window.scrollY > 100,
  header: {
    position: "relative",
    h1: "Admin Page",
    button: {
      fontSize: '1.2em',
      position: "absolute",
      right: "1rem",
      padding: "0.25em 0.5em",
      text: "Publish Schedule",
      zIndex: 100,
      onclick: () => saveJSON(),
    }
  },
});

buildDOM();

loadData(STUDENTS_API_URL, ADVISORS_API_URL);
import { buildDOM, loadData } from "./main.js";

const TAG = Math.round(1000*Math.random());
const STUDENTS_API_URL = 'https://itp.nyu.edu/NocoAPI/students.json?' + TAG;
const ADVISORS_API_URL = 'https://itp.nyu.edu/NocoAPI/advisors.json?' + TAG;

buildDOM();

loadData(STUDENTS_API_URL, ADVISORS_API_URL);
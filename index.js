import { buildDOM, loadData } from "./main.js";

const STUDENTS_API_URL = 'https://itp.nyu.edu/NocoAPI/students.json';
const ADVISORS_API_URL = 'https://itp.nyu.edu/NocoAPI/advisors.json';

buildDOM();

loadData(STUDENTS_API_URL, ADVISORS_API_URL);
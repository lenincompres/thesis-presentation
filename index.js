import { buildDOM, loadData } from "./main.js";

const STUDENTS_API_URL = 'students.json';
const ADVISORS_API_URL = 'advisors.json';

buildDOM();

loadData(STUDENTS_API_URL, ADVISORS_API_URL);
import {
  _advisors,
  buildDOM,
  loadData
} from "../main.js";

const STUDENTS_API_URL = 'https://itp.nyu.edu/NocoAPI/?action=list-students';
const ADVISORS_API_URL = 'https://itp.nyu.edu/NocoAPI/?action=list-advisors';

async function saveJSON() {
  const saveResponse = await fetch("https://itp.nyu.edu/NocoAPI/?action=save-json", {
    method: "POST",
  });
  console.log(saveResponse);
  location.reload();
}

/*
fetch('data.json')
  .then(res => {
    console.log(res.headers.get('Last-Modified'));
    return res.json();
  })
  .then(data => console.log(data));
*/

/* ===============================
   BUILD DOM
================================ */

const _conflicts = new Binder(0);

document.body.set({
  onscroll: () => _scheduleViewed.value = window.scrollY > 100,
  header: {
    position: "relative",
    h1: "Admin Page",
    aside_warnings: {
      //display: _advisors.as(v => !v.length ? "block" : "none"),
      h2: "Warnings",
      section: {
        ul: _advisors.as(advisors => advisors.map(a => {
          const unassignedStudents = a.students.length - a.assigned.length;
          const conflictingSlots = a.slots.filter(s => s.clash).length;
          _conflicts.value += conflictingSlots;
          return {
            li: !unassignedStudents ? undefined : `${a.Name} has ${unassignedStudents} unassigned students.`,
            li_error: !conflictingSlots ? undefined : `${a.Name} has ${conflictingSlots} conflicting time slots.`,
          }
        })),
      },
      button: {
        filter: _conflicts.as(v => !v ? undefined : "blur(2px)"),
        pointerEvents: _conflicts.as("none", "default"),
        fontSize: '1.2em',
        padding: "0.25em 0.5em",
        marginTop: "0.5em",
        text: "Publish Schedule",
        onclick: () => !_conflicts.value && saveJSON(),
      },
    },
  },
});

buildDOM();

loadData(STUDENTS_API_URL, ADVISORS_API_URL);
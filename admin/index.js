import {
  _advisors,
  buildDOM,
  loadData
} from "../main.js";

const STUDENTS_API_URL = 'https://itp.nyu.edu/NocoAPI/?action=list-students';
const ADVISORS_API_URL = 'https://itp.nyu.edu/NocoAPI/?action=list-advisors';

async function saveJSON() {
  console.log('Save JSON called');
  if(!!_conflicts.value) return;
  const saveResponse = await fetch("https://itp.nyu.edu/NocoAPI/?action=save-json", {
    method: "POST",
  });
  console.log(saveResponse);
  location.reload();
}

const _lastPublished = new Binder('');
fetch('https://itp.nyu.edu/NocoAPI/students.json')
  .then(res => {
    const lastModified = res.headers.get('Last-Modified');
    const nyTime = new Date(lastModified).toLocaleString('en-US', {
      timeZone: 'America/New_York',
      dateStyle: 'medium',
      timeStyle: 'short'
    });
    _lastPublished.value = nyTime;
  });


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
      h2: "Warnings",
      section: {
        ul: _advisors.as(advisors => advisors.map(a => {
          const unassignedStudents = a.slots.filter(s => !!s).length - a.assigned.length;
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
        fontSize: '1.2em',
        padding: "0.25em 0.5em",
        marginTop: "1em",
        text: "Publish Schedule",
        onclick: () => saveJSON(),
      },
      p: {
        text: 'Last published update: ',
        b: _lastPublished,
      },
      a: {
        text: 'Week Schedule Google Sheet',
        href: 'https://docs.google.com/spreadsheets/d/1pCGKLSd606XAUUSCkeEeuOmh3iuOldi0soO-WNKqPGU/edit?gid=549770974',
        target: '_blank',
      }
    },
  },
});

buildDOM();

loadData(STUDENTS_API_URL, ADVISORS_API_URL);
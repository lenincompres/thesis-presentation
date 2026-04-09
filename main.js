import getColor, {
  assignColorsToAdvisors,
  formatTime,
} from "./Aux.js";

const _advisors = new Binder([]);
const _students = new Binder([]);
const _days = new Binder([]);
const _activeDay = new Binder();
const _scheduleViewed = new Binder(false);
const _legend = new Binder();

//const API_URL = 'https://internal.itp.nyu.edu/nocodb-api.php';
//const API_URL = 'https://internal.itp.nyu.edu/nocodb/api/v2/tables/m1umtpyvxehcyqb/records';
const STUDENTS_API_URL = 'students.json';
const ADVISORS_API_URL = 'advisors.json';

/* ===============================
   LOAD DATA
================================ */

async function loadData() {
  const [studentsRes, advisorsRes] = await Promise.all([
    fetch(STUDENTS_API_URL),
    fetch(ADVISORS_API_URL)
  ]);

  const advisorData = await advisorsRes.json();
  const advisors = advisorData.list;

  const studentData = await studentsRes.json();
  const students = studentData.list;
  students.forEach(student => {
    student.advisor = advisors.find(a => student.Advisor && a.Id == student.Advisor.Id);
    student.label = student.advisor ? `${student.advisor.Program} | ${student.Name}` : `${student.Name}`;
  });

  const days = [];
  const dayMap = new Map();
  advisors.forEach(advisor => {
    const assigned = students.filter(s => s.Block && s.Block.Id === advisor.Id);
    assigned.forEach((s, i) => s.order = s.Order ? parseInt(s.Order) : i + 1);
    const maxOrder = Math.max(...assigned.map(s => s.order));
    advisor.slots = Array(maxOrder).fill(false);
    assigned.forEach(s => advisor.slots[parseInt(s.order) - 1] = s);
    advisor.label = `${advisor.Program} | ${advisor.Name}`;
    advisor.students = students.filter(s => s.Advisor && s.Advisor.Id === advisor.Id);
    advisor.date = new Date(advisor["Block Time"].replace(" ", "T"));
    const dayKey = advisor.date.toLocaleDateString("en-NY");
    if (!dayMap.has(dayKey)) {
      const dayObj = {
        key: dayKey,
        date: new Date(dayKey),
        advisors: [],
      };
      dayObj.label = dayObj.date.toLocaleDateString("en-US", {
        weekday: "long",
        month: "short",
        day: "numeric"
      });
      dayMap.set(dayKey, dayObj);
      days.push(dayObj);
    }
    const day = dayMap.get(dayKey);
    advisor.day = day;
    day.advisors.push(advisor);
  });

  assignColorsToAdvisors(advisors);

  _advisors.value = advisors.sort((a, b) => a.label.localeCompare(b.label));
  _students.value = students.sort((a, b) => a.label.localeCompare(b.label));
  days.sort((a, b) => a.date - b.date);
  _days.value = days;
  _activeDay.value = _days.value[0];
}
loadData();

function scrollToTop() {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
};

function scrollToSchedule() {
  scheduleElement.scrollIntoView({
    behavior: 'smooth'
  });
}

function scrollToSection(advisor)  {
  if (advisor.advisor) advisor = advisor.advisor;
  _legend.value = null;
  _activeDay.value = advisor.day ? advisor.day : _activeDay.value;
  if (advisor && advisor.element) {
    advisor.element.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    });
  }
}

/* ===============================
   BUILD DOM
================================ */

document.body.set({
  onclick: () => _scheduleViewed.value && scrollToTop(),
  onscroll: () => _scheduleViewed.value = window.scrollY > 100,
  div: {
    class: {
      'site-banner': true,
      blurred: _scheduleViewed.as(),
    },
    opacity: '1',
    position: 'fixed',
    height: '100vh',
    width: '100vw',
    img: {
      src: 'assets/banner.png',
      alt: 'IMA/ITP Thesis Capstone Banner',
      button: {
        id: 'viewScheduleBtn',
        class: 'scroll-down-button',
        text: 'View Schedule',
      }
    },
    button: {
      id: 'viewScheduleBtn',
      class: 'scroll-down-button',
      text: 'View Schedule',
      onclick: () => scrollToSchedule(),
    }
  },
  main: {
    onclick: e => e.stopPropagation(),
    id: 'scheduleElement',
    class: 'layout-wrapper',
    div: [{
      display: _scheduleViewed.as('block', 'none'),
      class: 'left-column',
      nav: {
        class: 'site-nav',
        a: [{
            class: 'livestresn-link',
            href: '#',
            text: 'Livestream',
          },
          {
            class: 'thesis-archive-link',
            href: 'https://itp.nyu.edu/thesis/archive/2026/',
            target: '_blank',
            text: 'Thesis Archive',
          }, {
            text: 'Advisors',
            onclick: () => _legend.value = 'advisors',
          }, {
            text: 'Students',
            onclick: () => _legend.value = 'students',
          }
        ],
        aside: [{
          display: _legend.as(l => l === 'advisors' ? 'flex' : 'none'),
          class: 'legend',
          a_link: _advisors.as(advisors => advisors.map(advisor => ({
            class: 'legend-item',
            backgroundColor: advisor.bgColor,
            color: advisor.fgColor,
            text: advisor.label,
            onclick: () => scrollToSection(advisor),
          }))),
        }, {
          display: _legend.as(l => l === 'students' ? 'flex' : 'none'),
          class: 'legend',
          a_link: _students.as(students => students.map(student => ({
            class: 'legend-item',
            backgroundColor: student.advisor ?
              student.advisor.bgColor : '#ccc',
            color: student.advisor ?
              student.advisor.fgColor : '#333',
            text: student.label,
            onclick: () => scrollToSection(student),
          }))),
        }]
      },
    }, {
      class: 'right-column',
      button: {
        display: _scheduleViewed.as('none', 'block'),
        id: 'menu-toggle',
        ariaLabel: 'Open Menu',
        text: '☰',
        onclick: () => scrollToTop(),
      },
      div_container: {
        img: {
          borderRadius: '20px',
          marginBottom: '1rem',
          width: '100%',
          src: 'assets/banner.png',
          alt: 'IMA/ITP Thesis Capstone Banner',
        },
        menu_tabs: {
          button_tab: _days.as(days => days.map(day => ({
            class: {
              'tab-button': true,
              'active': _activeDay.as(d => d === day),
            },
            dataDay: day.label.split(',')[0].toLowerCase(),
            role: 'tab',
            text: day.label,
            onclick: () => _activeDay.value = day,
          }))),
        },
        section_schedule: _days.as(days => days.map(day => ({
          id: day.label.split(',')[0].toLowerCase(),
          class: {
            'visible': _activeDay.as(d => d === day),
          },
          role: 'tabpanel',
          h2: day.label,
          div_timeline: {
            div: day.advisors.map(advisor => ({
              class: {
                'schedule-section': true,
                'expanded': true,
              },
              backgroundColor: advisor.bgColor,
              color: advisor.fgColor,
              div: {
                backgroundColor: advisor.bgColor,
                color: advisor.fgColor,
                class: 'section-department-tab',
                text: advisor.label,
                ondone: el => advisor.element = el,
              },
              section: {
                class: 'section-content',
                div: advisor.slots.map((student, i) => ({
                  class: {
                    'time-slot': true,
                    'student-slot': !!student,
                    'break-slot': !student,
                  },
                  div: [{
                      class: 'time',
                      text: formatTime(advisor.date, i * 12),
                    },
                    {
                      class: 'slot-content',
                      div: [{
                          class: 'slot-number',
                          text: i + 1,
                        },
                        {
                          class: 'student-name',
                          text: !!student ? student.Name : 'BREAK',
                        }
                      ],
                      ondone: el => student.element = el,
                    }
                  ]
                })),
              }
            })),
          },
        }))),
      }
    }]
  }
});
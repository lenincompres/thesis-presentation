import {
  assignColorsToAdvisors,
  formatTime,
} from "./Aux.js";

export const _advisors = new Binder([]);
const _students = new Binder([]);
const _days = new Binder([]);
const _activeDay = new Binder();
const _scheduleViewed = new Binder(false);
const _legend = new Binder();

/* ===============================
   LOAD DATA
================================ */

export async function loadData(STUDENTS_API_URL, ADVISORS_API_URL) {
  const [studentsRes, advisorsRes] = await Promise.all([
    fetch(STUDENTS_API_URL),
    fetch(ADVISORS_API_URL)
  ]);

  const advisorData = await advisorsRes.json();
  const advisors = advisorData.list ? advisorData.list : advisorData;

  const studentData = await studentsRes.json();
  const students = studentData.list ? studentData.list : studentData;
  students.forEach(student => {
    student.advisor = advisors.find(a => student.Advisor && a.Id == student.Advisor.Id);
    student.label = student.advisor ? `${student.advisor.Program} | ${student.Name}` : `${student.Name}`;
  });

  const days = [];
  const dayMap = new Map();
  advisors.forEach(advisor => {
    advisor.assigned = students.filter(s => s.Order && s.Block && s.Block.Id === advisor.Id);
    advisor.assigned.forEach(s => s.order = parseInt(s.Order));
    advisor.assigned.sort((a, b) => a.order - b.order);
    advisor.assigned.forEach((s, i) => {
      if(i <= 0) return;
      let prev = advisor.assigned[i - 1];
      if(s.order === prev.order){
        s.Name += ` & ${prev.Name}`;
        prev.clash = s.clash = true;
      }
    });
    const maxOrder = Math.max(...advisor.assigned.map(s => s.order), 0);
    advisor.slots = [];
    if(maxOrder) advisor.slots = Array(maxOrder).fill(false);
    advisor.assigned.forEach(s => advisor.slots[parseInt(s.order) - 1] = s);

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
  days.forEach(d => d.advisors = d.advisors.sort((a,b) => a.date - b.date));
  days.sort((a, b) => a.date - b.date);
  _days.value = days;
  _activeDay.value = _days.value[0];
}

function scrollToSchedule() {
  scheduleElement.scrollIntoView({
    behavior: 'smooth'
  });
}

function scrollToSection(advisor) {
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

function visitProject(student) {
  if (student.advisor.Program !== 'ITP') return;
  window.open('https://itp.nyu.edu/thesis/archive/2026/?s=' + student.Name, '_blank');
}

const _isPortrait = new Binder(false);
function checkWindowSize(){
  _isPortrait.value = window.innerWidth < 0.7 * window.innerHeight;
}
window.addEventListener('resize', () => checkWindowSize());
checkWindowSize();

/* ===============================
   BUILD DOM
================================ */

export function buildDOM() {
  document.body.set({
    onclick: () => _scheduleViewed.value && window.scrollTo({
      top: 0,
      behavior: 'smooth'
    }),
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
        src: _isPortrait.as('assets/hero-banner.png','assets/hero-banner-mobile.png'),
        alt: 'IMA/ITP Thesis Capstone Banner',
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
              class: {
                selected: _legend.as(l => l === 'advisors'),
              },
              onclick: () => {
                if (_legend.value === 'advisors') return _legend.value = null;
                _legend.value = 'advisors';
              },
            }, {
              tag: 'menu',
              display: _legend.as(l => l === 'advisors' ? 'flex' : 'none'),
              class: 'legend',
              content: _advisors.as(advisors => ({
                a: advisors.map(advisor => ({
                  class: 'legend-item',
                  backgroundColor: advisor.bgColor,
                  color: advisor.fgColor,
                  text: advisor.label,
                  onclick: () => scrollToSection(advisor),
                }))
              })),
            }, {
              text: 'Students',
              class: {
                selected: _legend.as(l => l === 'students'),
              },
              onclick: () => {
                if (_legend.value === 'students') return _legend.value = null;
                _legend.value = 'students';
              },
            }, {
              tag: 'menu',
              display: _legend.as(l => l === 'students' ? 'flex' : 'none'),
              class: 'legend',
              content: _students.as(students => ({
                a: students.map(student => ({
                  class: 'legend-item',
                  backgroundColor: student.advisor ?
                    student.advisor.bgColor : '#ccc',
                  color: student.advisor ?
                    student.advisor.fgColor : '#333',
                  text: student.label,
                  onclick: () => scrollToSection(student),
                }))
              })),
            }
          ],
        },
      }, {
        class: 'right-column',
        button: {
          display: _scheduleViewed.as('none', 'block'),
          id: 'menu-toggle',
          ariaLabel: 'Open Menu',
          text: '☰',
          onclick: () => window.scrollTo({
            top: 0,
            behavior: 'smooth'
          }),
        },
        div_container: {
          img: {
            borderRadius: '4px',
            marginBottom: '1rem',
            width: '100%',
            src: 'assets/top-banner.png',
            alt: 'IMA/ITP Thesis Capstone Banner',
          },
          menu_tabs: {
            role: 'tablist',
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
                      'error-slot': !!student && student.clash,
                    },
                    div: [{
                        class: 'time',
                        text: formatTime(advisor.date, i * 12),
                      },
                      {
                        class: 'slot-content',
                        div: [
                          /*{
                            class: 'slot-number',
                            text: i + 1,
                          },*/
                          {
                            class: 'student-name',
                            text: !!student ? student.Name : 'BREAK',
                          }
                        ],
                        ondone: el => !!student && (student.element = el),
                      }
                    ],
                    onclick: () => visitProject(student),
                  })),
                }
              })),
            },
          }))),
        }
      }]
    }
  });
}
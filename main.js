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
const _showLivestream = new Binder(false);

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
    advisor.assigned = students.filter(s => s.Block && s.Block.Id === advisor.Id);
    advisor.ordered = advisor.assigned.filter(s => !!s.Order);
    advisor.ordered.forEach(s => s.order = parseInt(s.Order));
    advisor.ordered.sort((a, b) => a.order - b.order);
    advisor.ordered.forEach((s, i) => {
      if (i <= 0) return;
      let prev = advisor.ordered[i - 1];
      if (s.order === prev.order) {
        s.Name += ` & ${prev.Name}`;
        prev.clash = s.clash = true;
      }
    });
    const maxOrder = Math.max(...advisor.ordered.map(s => s.order), 0);
    advisor.slots = [];
    if (maxOrder) advisor.slots = Array(maxOrder).fill(false);
    advisor.ordered.forEach(s => advisor.slots[parseInt(s.order) - 1] = s);

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
  days.forEach(d => d.advisors = d.advisors.sort((a, b) => a.date - b.date));
  days.sort((a, b) => a.date - b.date);
  _days.value = days;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  _activeDay.value =
    _days.value.find(d => {
      const dDate = new Date(d.date);
      dDate.setHours(0, 0, 0, 0);
      return dDate >= today;
    }) || _days.value[_days.value.length - 1];
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

function checkWindowSize() {
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
      top: 0,
      height: '100vh',
      width: '100vw',
      img: {
        src: _isPortrait.as('assets/hero-banner.png', 'assets/hero-banner-mobile.png'),
        alt: 'IMA/ITP Thesis Capstone Banner',
      },
      iframe: {
        class: 'livestream-frame',
        border: 'none',
        display: _showLivestream.as('none', 'block'),
        zIndex: 1,
        src: _showLivestream.as('', "livestream.html"),
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
        display: _scheduleViewed.with(_showLivestream).as((s, l) => s || l ? 'none' : 'block'),
        class: 'left-column',
        nav: {
          class: 'site-nav',
          a: [{
              class: 'livestresn-link',
              href: '#',
              text: 'Livestream',
              onclick: () => _showLivestream.value = !_showLivestream.value,
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
                a: students.filter(s => !!s.order).map(student => ({
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
          display: _scheduleViewed.with(_showLivestream).as((s, l) => s || l ? 'block' : 'none'),
          id: 'menu-toggle',
          ariaLabel: 'Open Menu',
          text: '☰',
          onclick: () => {
            _showLivestream.value = false;
            window.scrollTo({
              top: 0,
              behavior: 'smooth'
            });
          },
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
          main: {
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
                      backgroundColor: student.advisor && student.advisor !== advisor ? student.advisor.bgColor : undefined,
                      color: student.advisor && student.advisor !== advisor ? student.advisor.fgColor : undefined,
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
                            },
                            ...(!!student && advisor.Program === 'ITP' ? [{
                              class: 'thesis-archive-slot',
                              button: {
                                class: 'thesis-archive-button',
                                text: 'thesis archive',
                                ariaLabel: 'View thesis archive',
                                onclick: e => {
                                  e.stopPropagation();
                                  visitProject(student);
                                },
                                img: {
                                  src: 'assets/diagonal-arrow.svg',
                                  class: 'thesis-archive-arrow',
                                  alt: 'diagonal arrow'
                                }
                              },
                            }] : []),
                          ],
                          ondone: el => !!student && (student.element = el),
                        }
                      ],
                    })),
                  }
                })),
              },
            }))),
          },
        }
      }]
    }
  });
}
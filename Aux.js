export const advisorsColorMap = {};

// Dark palette → ITP (white text)
// Light palette → IMA (black text)
const itpPalette = [];
const imaPalette = [];

export function setPallettes(numColors = 7) {
  let num = numColors,
    h = 0,
    s = 45,
    l = 85,
    d = 180 / num;
  for (let i = 0; i < num; i++) {
    itpPalette.push(`hsl(${h}, ${s}%, ${l}%)`); // dark
    imaPalette.push(`hsl(${(d/2+h)%360}, ${1*s}%, 85%)`); // light
    h += d;
  }
}

export function getColor(id, program, numColors = 20) {
  if (itpPalette.length === 0 || imaPalette.length === 0) {
    setPallettes(numColors);
  }
  if (!advisorsColorMap[id]) {
    const isITP = program === 'ITP';
    const i = Object.values(advisorsColorMap)
      .filter(a => a.program === program).length;

    advisorsColorMap[id] = {
      bg: isITP ? itpPalette[i % itpPalette.length] : imaPalette[i % imaPalette.length],
      fg: isITP ? '#555555' : '#555555',
      program
    };
  }
  return advisorsColorMap[id];
}

export function assignColorsToAdvisors(advisors) {
  let num = advisors.filter(a => 'ITP' === a.Program).length;
  advisors.forEach(advisor => {
    const colorInfo = getColor(advisor.Id, advisor.Program, num);
    advisor.bgColor = colorInfo.bg;
    advisor.fgColor = colorInfo.fg;
  });
}

export function formatTime(dateInput, addMinutes = 0) {
  // Ensure we have a Date object
  const date = new Date(dateInput);

  // Add minutes if provided
  if (addMinutes) {
    date.setMinutes(date.getMinutes() + addMinutes);
  }

  // Extract time parts
  const h = date.getHours();
  const m = date.getMinutes();

  // Convert to 12-hour format
  const hour12 = h % 12 || 12;
  const minute = m.toString().padStart(2, "0");
  const ampm = h >= 12 ? "PM" : "AM";

  return `${hour12}:${minute} ${ampm}`;
}

export default getColor;
export const advisorsColorMap = {};

// Dark palette → ITP (white text)
// Light palette → IMA (black text)
let itpPalette = [15, 30]; // saturation, lightness
let imaPalette = [42, 87]; // saturation, lightness
let textColor = ['#eee', '#333']; // itp, ima

export function getColorArray(num, s = 50, l = 50, h = 0){
  let d = 360 / num;
  let arr = [];
  for (let i = 0; i < num; i++) {
    arr.push(`hsl(${h%360}, ${s}%, ${l}%)`);
    h += d;
  }
  return arr;
}

export function getColor(id, program, advisors) {
  if (itpPalette.length < 3 && imaPalette.length < 3) {
    let itpCount = advisors.filter(a => 'ITP' === a.Program).length;
    itpPalette = getColorArray(itpCount, ...itpPalette);
    imaPalette = getColorArray(advisors.length - itpCount, ...imaPalette);
  }
  if (!advisorsColorMap[id]) {
    const isITP = program === 'ITP';
    const i = Object.values(advisorsColorMap)
      .filter(a => a.program === program).length;
    advisorsColorMap[id] = {
      bg: isITP  ? itpPalette[i % itpPalette.length] : imaPalette[i % imaPalette.length],
      fg: isITP ? textColor[0] : textColor[1],
      program: program,
    };
  }
  return advisorsColorMap[id];
}

export function assignColorsToAdvisors(advisors) {
  let num = advisors.filter(a => 'ITP' === a.Program).length;
  advisors.forEach(advisor => {
    const colorInfo = getColor(advisor.Id, advisor.Program, advisors);
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
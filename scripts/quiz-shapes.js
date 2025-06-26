import { loadData, raDecToXY } from './utils.js';
import { fadeTransition } from './animate-stars.js';

let data = [];
let current = null;
let allStars = [];
let showLines = true;

const svg = document.getElementById("constellation");
const answerInput = document.getElementById("answer");
const feedback = document.getElementById("feedback");
const submitBtn = document.getElementById("submit-button");
const nextBtn = document.getElementById("next-button");
const toggleBtn = document.getElementById("toggle-lines");

function coordsKey(ra, dec) { //적경 좌표와 적위 좌표 소수점 네자리에서 끊기.
  return `${ra.toFixed(4)}:${dec.toFixed(4)}`;
}

function drawConstellation({ shape, major_stars }) { // 별자리 그리기
  svg.innerHTML = "";
  allStars = [];

  const majorSet = new Set(major_stars.map(s => coordsKey(s.ra, s.dec)));

  shape.forEach(([ra, dec]) => {
    const isMajor = majorSet.has(coordsKey(ra, dec));
    const [x, y] = raDecToXY(ra, dec);
    const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    dot.setAttribute("cx", x);
    dot.setAttribute("cy", y);
    dot.setAttribute("r", 1.5);
    dot.setAttribute("fill", "white");
    svg.appendChild(dot);
    allStars.push({ ra, dec, isMajor });
  });

  if (showLines) { // '별자리 선 보기' 옵션이 켜져있을 경우
    for (let i = 0; i < shape.length - 1; i++) {
      const [ra1, dec1] = shape[i];
      const [ra2, dec2] = shape[i + 1];
      const [x1, y1] = raDecToXY(ra1, dec1);
      const [x2, y2] = raDecToXY(ra2, dec2);
      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("x1", x1);
      line.setAttribute("y1", y1);
      line.setAttribute("x2", x2);
      line.setAttribute("y2", y2);
      line.setAttribute("stroke", "white");
      line.setAttribute("stroke-opacity", "0.4");
      svg.appendChild(line);
    }
  }
}

function checkAnswer() {
  const guess = answerInput.value.trim().toLowerCase();
  const ko = current.name_ko.trim().toLowerCase();
  const en = current.name_en.trim().toLowerCase();
  const abbr = current.abbr.trim().toLowerCase();

  if (guess === ko || guess === en || guess === abbr) {
    feedback.textContent = "✅ 정답입니다!";
    feedback.style.color = "lightgreen";
  } else {
    feedback.textContent = `❌ 오답! 정답: ${current.name_ko}`;
    feedback.style.color = "tomato";
  }
}

function loadNext() {
  feedback.textContent = '';
  answerInput.value = '';
  const next = data[Math.floor(Math.random() * data.length)];
  const nextStars = next.shape.map(([ra, dec]) => ({ ra, dec }));

  fadeTransition(svg, allStars, nextStars, 400, () => {
    drawConstellation(next);
    current = next;
  });
}

toggleBtn.onclick = () => {
  showLines = !showLines;
  toggleBtn.textContent = showLines ? "선 끄기" : "선 켜기";
  drawConstellation(current);
};

submitBtn.onclick = checkAnswer;
nextBtn.onclick = loadNext;

(async function init() {
  data = await loadData('../assets/data/constellations.json');
  loadNext();
})();

import { loadData, raDecToXY } from './utils.js';
import { fadeTransition } from './animate-stars.js';
import { computeProjectionBounds } from './utils.js';


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
function drawConstellation({ shape, major_stars, lines, ra_range, dec_range, center}) {
  svg.innerHTML = "";
  allStars = [];
  let ra_0 = center[0]
  let dec_0 = center[1]
  const bounds = computeProjectionBounds(shape, ra_0, dec_0);
  const majorSet = new Set(major_stars.map(s => coordsKey(s.ra, s.dec)));

  shape.forEach(([ra, dec]) => {
    const isMajor = majorSet.has(coordsKey(ra, dec));
    const [x, y] = raDecToXY(ra, dec, ra_0, dec_0, bounds);
    const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    dot.setAttribute("cx", x);
    dot.setAttribute("cy", y);
    dot.setAttribute("r", 1);
    dot.setAttribute("fill", "white");
    svg.appendChild(dot);
    allStars.push({ ra, dec, isMajor });
  });

  if (showLines && Array.isArray(lines)) {
    lines.forEach(([i, j]) => {
      const [ra1, dec1] = shape[i];
      const [ra2, dec2] = shape[j];
      const [x1, y1] = raDecToXY(ra1, dec1, ra_0, dec_0, bounds);
      const [x2, y2] = raDecToXY(ra2, dec2, ra_0, dec_0, bounds);
      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("x1", x1);
      line.setAttribute("y1", y1);
      line.setAttribute("x2", x2);
      line.setAttribute("y2", y2);
      line.setAttribute("stroke", "white");
      line.setAttribute("stroke-opacity", "0.4");
      svg.appendChild(line);
    });
  }
}//

function checkAnswer() {
  const guess = answerInput.value.trim().toLowerCase();
  const ko = current.name_ko.trim().toLowerCase();
  const en = current.name_en.trim().toLowerCase();
  const abbr = current.abbr.trim().toLowerCase();

  if (guess === ko || guess === en || guess === abbr || guess === ko.slice(0,-2)) {
    feedback.textContent = "✅ 정답입니다!";
    feedback.style.color = "lightgreen";
  } else {
    feedback.textContent = `❌ 오답! 정답: ${current.name_ko}, ${current.name_en}, ${current.abbr}`;
    feedback.style.color = "tomato";
  }
}

function loadNext() {
  feedback.textContent = '';
  answerInput.value = '';
  const next = data[Math.floor(Math.random() * data.length)];
  const nextStars = next.shape.map(([ra, dec]) => ({ ra, dec }));

  // 수정된 부분: current를 아직 바꾸지 않음
  const [ra_0, dec_0] = next.center;
  const toBounds = computeProjectionBounds(next.shape, ra_0, dec_0);
  const fromBounds = computeProjectionBounds(current?.shape ?? next.shape, ra_0, dec_0);

  fadeTransition(svg, allStars, nextStars, 700,
    ra_0, dec_0,
    toBounds, fromBounds,
    () => {
      drawConstellation(next);
      current = next;
    }
  );
}


toggleBtn.onclick = () => {
  showLines = !showLines;
  toggleBtn.textContent = showLines ? "선 끄기" : "선 켜기";
  drawConstellation(current);
};
submitBtn.onclick = checkAnswer;
nextBtn.onclick = loadNext;
answerInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    checkAnswer();
  }
});
// 엔터 제출 + 쉬프트+엔터 다음 문제
answerInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && e.shiftKey) {
    loadNext();         // Shift+Enter → 다음 문제
  } else if (e.key === "Enter") {
    checkAnswer();      // Enter → 정답 제출
  }
});

// 슬래시 누르면 입력창 포커스
document.addEventListener("keydown", (e) => {
  if (e.key === "/" && document.activeElement !== answerInput) {
    e.preventDefault();            // 입력창 외에서 슬래시 눌렀을 때만
    answerInput.focus();           // 포커스 이동
  }
});

(async function init() {
  data = await loadData('../assets/data/constellations.json');
  loadNext();
})();

import { loadData, raDecToXY } from './utils.js';
import { fadeTransition } from './animate-stars.js';
import { computeProjectionBounds } from './utils.js';


let data = [];
let current = null;
let allStars = [];
let showLines = true;
let index = 0;
let wrongList = [];
let isRetryMode = false;
let retryList = [];
let retrySet = new Set();
let currentList = [];
let nextWrongList = [];
let nextWrongSet = new Set(); // ✅ retryMode 오답 추적용
let answered = false; // ✅ 현재 문제에 대해 채점했는지 여부


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

function shuffle(array) {
  array.sort(() => Math.random() - 0.5);
}

function updateProgress() {
  const total = currentList.length;
  const wrong = isRetryMode ? nextWrongSet.size : wrongList.length;

  document.getElementById("progress").textContent =
    `진행: ${index}/${total} | 오답 누적: ${wrong}`;
}

function checkAnswer() {
  if (answered || index >= currentList.length) return;  // ✅ 이미 제출했으면 무시
  answered = true; // ✅ 더 이상 이 문제에 대해 checkAnswer 못 하게 잠금

  if (index >= currentList.length) return; // 더 이상 문제 없으면 무시

  const guess = answerInput.value.trim().toLowerCase();
  const ko = current.name_ko.trim().toLowerCase();
  const en = current.name_en.trim().toLowerCase();
  const abbr = current.abbr.trim().toLowerCase();

  const isCorrect =
    guess === ko || guess === en || guess === abbr || guess === ko.slice(0, -2);

  if (isCorrect) {
    feedback.textContent = "✅ 정답입니다!";
    feedback.style.color = "lightgreen";
  } else {
    feedback.textContent = `❌ 오답! 정답: ${current.name_ko}, ${current.name_en}, ${current.abbr}`;
    feedback.style.color = "tomato";

    if (!isRetryMode) {
      wrongList.push(current);
    } else {
      const key = current.name_en;
      if (!nextWrongSet.has(key)) {
        nextWrongSet.add(key);
        nextWrongList.push(current);
      }
    }
  }

  index++;  // ✅ 반드시 checkAnswer에서 증가
  updateProgress();
}

function loadNext() {
  if (index >= currentList.length) {
    if (isRetryMode) {
      if (nextWrongList.length === 0) {
        feedback.textContent = "🎉 오답 복습 완료!";
        isRetryMode = false;
        wrongList = [];
        nextWrongList = [];
        nextWrongSet = new Set();
        currentList = [];
        return;
      } else {
        currentList = [...nextWrongList];
        shuffle(currentList);
        nextWrongList = [];
        nextWrongSet = new Set();
        index = 0;
        feedback.textContent = "🔁 다시 오답 복습을 이어갑니다!";
        setTimeout(() => loadNext(), 300);
        return;
      }
    } else {
      feedback.textContent = "✅ 모든 별자리를 풀었습니다.";
      return;
    }
  }

  current = currentList[index];

  const nextStars = current.shape.map(([ra, dec]) => ({ ra, dec }));
  const [ra_0, dec_0] = current.center;
  const toBounds = computeProjectionBounds(current.shape, ra_0, dec_0);
  const fromBounds = computeProjectionBounds(current?.shape ?? current.shape, ra_0, dec_0);
  current = currentList[index];
  answered = false;  // ✅ 새 문제 시작할 때 초기화

  fadeTransition(svg, allStars, nextStars, 300,
    ra_0, dec_0,
    toBounds, fromBounds,
    () => {
      drawConstellation(current);
      updateProgress();
    }
  );
}




document.getElementById("retry-button").onclick = () => {
  if (wrongList.length === 0) {
    feedback.textContent = "❗ 오답 목록이 없습니다.";
    return;
  }

  isRetryMode = true;
  currentList = [...wrongList];
  nextWrongList = [];
  nextWrongSet = new Set(); // ✅ 세트도 초기화
  index = 0;
  shuffle(currentList);
  feedback.textContent = "🔁 오답 복습을 시작합니다!";
  loadNext();
};



toggleBtn.onclick = () => {
  showLines = !showLines;
  toggleBtn.textContent = showLines ? "선 끄기" : "선 켜기";
  drawConstellation(current);
};
submitBtn.onclick = checkAnswer;
nextBtn.onclick = () => {
  checkAnswer();                 // 정답 평가 + index 증가
  setTimeout(() => loadNext(), 300);  // 다음 문제 보여주기
};

// 엔터 제출 + 쉬프트+엔터 다음 문제
answerInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && e.shiftKey) {
    checkAnswer();                 // 정답 평가 + index 증가
    setTimeout(() => loadNext(), 300);  // 다음 문제 보여주기
  } else if (e.key === "Enter") {
    checkAnswer();                 // 정답만 평가
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
  shuffle(data);
  currentList = data;
  loadNext();
})();


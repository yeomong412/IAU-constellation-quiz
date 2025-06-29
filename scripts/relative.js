import { loadData, raDecToXY, computeProjectionBounds } from './utils.js';

let allData = [];
let contextList = [];
let targetConst = null;

let currentCenter = null;
let currentBounds = null;

const svg = document.getElementById("sky-map");
const answerInput = document.getElementById("nameInput");
const feedback = document.getElementById("feedback");
const toggleBtn = document.getElementById("toggle-grid");

document.getElementById("submit").onclick = checkAnswer;
document.getElementById("next").onclick = startQuiz;
toggleBtn.onclick = toggleGrid;

init();

async function init() {
  allData = await loadData('../assets/data/constellations.json');
  startQuiz();
}

function startQuiz() {
  svg.innerHTML = '';
  answerInput.value = '';
  feedback.textContent = '';
  feedback.style.color = 'white';

  // 문제 중심 별자리 선택
  targetConst = allData[Math.floor(Math.random() * allData.length)];
  const [ra0, dec0] = targetConst.center;
  currentCenter = [ra0, dec0];

  // 주변 별자리 추출 (±30도 박스 내)
  contextList = allData.filter(c => {
    if (c.name_en === targetConst.name_en) return false;
    const [ra, dec] = c.center;
    const dRa = Math.abs(ra - ra0);
    const dDec = Math.abs(dec - dec0);
    return dRa < 30 && dDec < 30;
  });

  // 투영 범위 계산 (context만 기준으로 확대비 조절)
  currentBounds = computeProjectionBounds(
    contextList.flatMap(c => c.shape),
    ra0, dec0
  );

  // 그리드 먼저
  if (showGrid) drawGrid(svg, currentCenter, currentBounds);

  // 주변 별자리 그리기
  contextList.forEach(c => drawOutline(c, false, currentCenter, currentBounds));

  // 빈칸 자리 강조
  drawEmptyPlaceholder(targetConst, currentCenter, currentBounds);
}

function checkAnswer() {
  const input = answerInput.value.trim().toLowerCase();
  const ko = targetConst.name_ko.toLowerCase();
  const en = targetConst.name_en.toLowerCase();
  const abbr = targetConst.abbr.toLowerCase();

  const isCorrect = input === ko || input === en || input === abbr || input === ko.slice(0, -2);

  feedback.textContent = isCorrect
    ? "✅ 정답입니다!"
    : `❌ 오답! 정답: ${targetConst.name_ko} (${targetConst.name_en})`;
  feedback.style.color = isCorrect ? "lightgreen" : "tomato";

  drawOutline(targetConst, true, currentCenter, currentBounds);
}

function drawOutline(constellation, highlight, center, bounds) {
  for (const [ra, dec] of constellation.shape) {
    const [x, y] = raDecToXY(ra, dec, ...center, bounds);
    const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    dot.setAttribute("cx", x);
    dot.setAttribute("cy", y);
    dot.setAttribute("r", 0.6);
    dot.setAttribute("fill", "white");
    svg.appendChild(dot);
  }

  for (const [i, j] of constellation.lines || []) {
    const [ra1, dec1] = constellation.shape[i];
    const [ra2, dec2] = constellation.shape[j];
    const [x1, y1] = raDecToXY(ra1, dec1, ...center, bounds);
    const [x2, y2] = raDecToXY(ra2, dec2, ...center, bounds);

    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", x1);
    line.setAttribute("y1", y1);
    line.setAttribute("x2", x2);
    line.setAttribute("y2", y2);
    line.setAttribute("stroke", highlight ? "yellow" : "white");
    line.setAttribute("stroke-width", highlight ? "1.5" : "1");
    line.setAttribute("stroke-opacity", highlight ? "1" : "0.4");
    svg.appendChild(line);
  }
}

function drawEmptyPlaceholder(constellation, center, bounds) {
  const [cx, cy] = raDecToXY(...constellation.center, ...center, bounds);

  const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  circle.setAttribute("cx", cx);
  circle.setAttribute("cy", cy);
  circle.setAttribute("r", 4);
  circle.setAttribute("stroke", "gray");
  circle.setAttribute("fill", "none");
  circle.setAttribute("stroke-dasharray", "2,2");
  svg.appendChild(circle);

  const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
  text.setAttribute("x", cx);
  text.setAttribute("y", cy + 4);
  text.setAttribute("text-anchor", "middle");
  text.setAttribute("font-size", "4");
  text.setAttribute("fill", "gray");
  text.textContent = "?";
  svg.appendChild(text);
}

// ────────────────────────
// 그리드 관련
let showGrid = true;

function toggleGrid() {
  const gridLayer = document.getElementById("grid-layer");
  if (gridLayer) {
    gridLayer.remove();
    toggleBtn.textContent = "그리드 켜기";
  } else {
    drawGrid(svg, currentCenter, currentBounds);
    toggleBtn.textContent = "그리드 끄기";
  }
}


function drawGrid(svg, center, bounds) {
  const grid = document.createElementNS("http://www.w3.org/2000/svg", "g");
  grid.id = "grid-layer";

  // RA선 (적경 고정, 적위 변화)
  for (let ra = 0; ra < 360; ra += 30) {
  // RA 선 (Dec -90 ~ 90)
  let path = "";
  for (let dec = -90; dec <= 90; dec += 5) {
    const [x, y] = raDecToXY(ra, dec, ...center, bounds);
    path += `${x},${y} `;
  }
  const polyline = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
  polyline.setAttribute("points", path.trim());
  polyline.setAttribute("stroke", "#444");
  polyline.setAttribute("stroke-width", "0.3");
  polyline.setAttribute("fill", "none");
  grid.appendChild(polyline);

  // ✅ RA 라벨: 상단 (Dec = +85 지점)
  const [x, y] = raDecToXY(ra, 85, ...center, bounds);
  const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
  label.setAttribute("x", x);
  label.setAttribute("y", y - 1.5);
  label.setAttribute("text-anchor", "middle");
  label.setAttribute("font-size", "2");
  label.setAttribute("fill", "#666");
  label.textContent = `${ra}°`;
  grid.appendChild(label);
}

  // Dec선 (적위 고정, 적경 변화)
  for (let dec = -60; dec <= 60; dec += 30) {
    let path = "";
    for (let ra = 0; ra <= 360; ra += 5) {
      const [x, y] = raDecToXY(ra, dec, ...center, bounds);
      path += `${x},${y} `;
    }
    const polyline = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
    polyline.setAttribute("points", path.trim());
    polyline.setAttribute("stroke", "#444");
    polyline.setAttribute("stroke-width", "0.3");
    polyline.setAttribute("fill", "none");
    grid.appendChild(polyline);

    // 라벨
    const [x, y] = raDecToXY(180, dec, ...center, bounds);
    const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
    label.setAttribute("x", x + 1.5);
    label.setAttribute("y", y + 1);
    label.setAttribute("font-size", "2");
    label.setAttribute("fill", "#666");
    label.textContent = `${dec}°`;
    grid.appendChild(label);
  }

  svg.appendChild(grid);
}


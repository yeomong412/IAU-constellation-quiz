import { loadData, raDecToXY } from './utils.js';
let stars = [];        // 사용자가 찍은 점
let lines = [];        // 연결된 선
let currentConst = null;
let selectedIndex = null;

const drawArea = document.getElementById("draw-area");
const answerArea = document.getElementById("answer-area");
const scoreElem = document.getElementById("score");
const feedback = document.getElementById("feedback");
document.getElementById("next").onclick = loadNext;
isReady = false;
function loadNext() {
  isReady = false;
  stars = [];
  lines = [];
  selectedIndex = null;
  drawArea.innerHTML = '';
  answerArea.innerHTML = '';
  scoreElem.textContent = '';
  feedback.textContent = '';

  fetch("../assets/data/constellations.json")
  .then((res) => res.json())
  .then((data) => {
    currentConst = data[0];
    document.getElementById("quiz-question").textContent =
      currentConst.name_ko + " (" + currentConst.name_en + ")";

    drawArea.addEventListener("click", handleClick);
    document.getElementById("submit").onclick = checkAnswer;
    document.getElementById("reset").onclick = resetAll;
    document.getElementById("next").onclick = loadNext;  // 여기에 넣는 게 안전
  });
}

fetch("../assets/data/constellations.json")
  .then((res) => res.json())
  .then((data) => {
    currentConst = data[0];
    document.getElementById("quiz-question").textContent =
    currentConst.name_ko + " (" + currentConst.name_en + ")";
    drawArea.addEventListener("click", handleClick);
    document.getElementById("submit").onclick = checkAnswer;
    document.getElementById("reset").onclick = resetAll;
  });

function handleClick(e) {
  const rect = drawArea.getBoundingClientRect();
  const x = ((e.clientX - rect.left) / rect.width) * 100;
  const y = ((e.clientY - rect.top) / rect.height) * 100;

  const near = stars.findIndex(p => Math.hypot(p.x - x, p.y - y) < 3);

  if (selectedIndex === null && near !== -1) {
    selectedIndex = near;
  } else if (selectedIndex !== null && near !== -1 && selectedIndex !== near) {
    lines.push([selectedIndex, near]);
    selectedIndex = null;
  } else {
    stars.push({ x, y });
  }

  render();
}

function render() {
  drawArea.innerHTML = '';
  stars.forEach(p => {
    const c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    c.setAttribute("cx", p.x);
    c.setAttribute("cy", p.y);
    c.setAttribute("r", 1.5);
    c.setAttribute("fill", "white");
    drawArea.appendChild(c);
  });

  lines.forEach(([a, b]) => {
    const l = document.createElementNS("http://www.w3.org/2000/svg", "line");
    l.setAttribute("x1", stars[a].x);
    l.setAttribute("y1", stars[a].y);
    l.setAttribute("x2", stars[b].x);
    l.setAttribute("y2", stars[b].y);
    l.setAttribute("stroke", "skyblue");
    drawArea.appendChild(l);
  });
}

function resetAll() {
  stars = [];
  lines = [];
  selectedIndex = null;
  drawArea.innerHTML = '';
  answerArea.innerHTML = '';
  scoreElem.textContent = '';
}


function checkAnswer() {
  answerArea.innerHTML = '';

  // (1) 먼저 ra_range, dec_range 계산
  const ra_list = currentConst.shape.map(([ra, _]) => ra);
  const dec_list = currentConst.shape.map(([_, dec]) => dec);
  const ra_min = Math.min(...ra_list), ra_max = Math.max(...ra_list);
  const dec_min = Math.min(...dec_list), dec_max = Math.max(...dec_list);

  const ra_range = [ra_min, ra_max];
  const dec_range = [dec_min, dec_max];

  // (2) 좌표 변환 (정답용)
  const pts = currentConst.shape.map(([ra, dec]) => {
    const [x, y] = raDecToXY(ra, dec, ra_range, dec_range);
    return { x, y };
  });

  // (3) 정답 도형 시각화
  pts.forEach(p => {
    const c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    c.setAttribute("cx", p.x);
    c.setAttribute("cy", p.y);
    c.setAttribute("r", 1.5);
    c.setAttribute("fill", "white");
    answerArea.appendChild(c);
  });

  currentConst.lines.forEach(([a, b]) => {
    const l = document.createElementNS("http://www.w3.org/2000/svg", "line");
    l.setAttribute("x1", pts[a].x);
    l.setAttribute("y1", pts[a].y);
    l.setAttribute("x2", pts[b].x);
    l.setAttribute("y2", pts[b].y);
    l.setAttribute("stroke", "yellow");
    answerArea.appendChild(l);
  });

  // (4) 일치도 평가
  const positionScore = calcBestMatchingScore(pts, stars);
  const edgeScore = calcEdgeScore(currentConst.lines, lines);
  const final = (0.6 * positionScore + 0.4 * edgeScore) * 100;

  scoreElem.textContent = `일치도: ${final.toFixed(1)}%`;
  if (final>=80){
    feedback.textContent = "✅ 정답일 확률이 높습니다!";
    feedback.style.color = "lightgreen";
  }else{
    feedback.textContent = `❌ 오답일 확률이 높습니다!`;
    feedback.style.color = "tomato";
  }
}

function calcPositionScore(real, user) {
  if (user.length === 0 || real.length === 0) return 0;
  const min = Math.min(real.length, user.length);
  let total = 0;

  for (let i = 0; i < min; i++) {
    total += Math.hypot(real[i].x - user[i].x, real[i].y - user[i].y);
  }

  const avgDist = total / min;

  return 1 / (1 + avgDist / 1000); // exp보다 완만한 감쇠
}


function calcEdgeScore(realEdges, userEdges) {
  if (userEdges.length === 0 || realEdges.length === 0) return 0;

  let match = 0;

  for (const [a1, b1] of userEdges) {
    const p1 = stars[a1];
    const p2 = stars[b1];

    for (const [a2, b2] of realEdges) {
      const q1 = stars[a2];
      const q2 = stars[b2];

      const d1 = Math.hypot(p1.x - q1.x, p1.y - q1.y) + Math.hypot(p2.x - q2.x, p2.y - q2.y);
      const d2 = Math.hypot(p1.x - q2.x, p1.y - q2.y) + Math.hypot(p2.x - q1.x, p2.y - q1.y);

      if (Math.min(d1, d2) < 15) {
        match++;
        break;
      }
    }
  }

  return match / realEdges.length;
}

function normalize(points) {
  const cx = points.reduce((sum, p) => sum + p.x, 0) / points.length;
  const cy = points.reduce((sum, p) => sum + p.y, 0) / points.length;
  const centered = points.map(p => ({ x: p.x - cx, y: p.y - cy }));

  const scale = Math.sqrt(centered.reduce((sum, p) => sum + p.x ** 2 + p.y ** 2, 0) / points.length);
  return centered.map(p => ({ x: p.x / scale, y: p.y / scale }));
}

function rotate(points, angle) {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return points.map(p => ({
    x: p.x * cos - p.y * sin,
    y: p.x * sin + p.y * cos
  }));
}

function calcBestMatchingScore(real, user) {
  const A = normalize(real);
  const B = normalize(user);

  let best = 0;

  for (let angle = 0; angle < 2 * Math.PI; angle += Math.PI / 30) {
    const B_rot = rotate(B, angle);
    const used = new Set();
    let totalDist = 0;

    for (let a of A) {
      let minDist = Infinity;
      let minIdx = -1;

      for (let i = 0; i < B_rot.length; i++) {
        if (used.has(i)) continue;
        const b = B_rot[i];
        const dist = Math.hypot(a.x - b.x, a.y - b.y);
        if (dist < minDist) {
          minDist = dist;
          minIdx = i;
        }
      }

      if (minIdx !== -1) used.add(minIdx);
      totalDist += minDist;
    }

    const avgDist = totalDist / A.length;
    const score = 1 / (1 + avgDist);
    best = Math.max(best, score);
  }

  return best;
}

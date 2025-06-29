import { loadData, raDecToXY } from './utils.js';
import { computeProjectionBounds } from './utils.js';

let stars = [];        // 사용자가 찍은 점
let lines = [];        // 연결된 선
let currentConst = null;
let selectedIndex = null;
let allData = []; // 전체 데이터 저장용
let previewLine = null;
let hoveredIndex = null;


const drawArea = document.getElementById("draw-area");
const answerArea = document.getElementById("answer-area");
const scoreElem = document.getElementById("score");
const feedback = document.getElementById("feedback");
document.getElementById("next").onclick = loadNext;

fetch("../assets/data/constellations.json")
  .then((res) => res.json())
  .then((data) => {
    allData = data;
    currentConst = allData[Math.floor(Math.random() * allData.length)];
    document.getElementById("quiz-question").textContent =
      currentConst.name_ko + " (" + currentConst.name_en + ")";
    drawArea.addEventListener("click", handleClick);
    document.getElementById("submit").onclick = checkAnswer;
    document.getElementById("reset").onclick = resetAll;
    document.getElementById("next").onclick = loadNext;
  });


function loadNext() {
  stars = [];
  lines = [];
  selectedIndex = null;
  drawArea.innerHTML = '';
  answerArea.innerHTML = '';
  scoreElem.textContent = '';
  feedback.textContent = '';

  const next = allData[Math.floor(Math.random() * allData.length)];
  currentConst = next;
  // drawConstellation(currentConst); // 문제 화면 바로 출력

  document.getElementById("quiz-question").textContent =
    currentConst.name_ko + " (" + currentConst.name_en + ")";
  
}

let pathStartIndex = null;  // 이어지는 선의 시작점 인덱스

function handleClick(e) {
  const rect =  drawArea.getBoundingClientRect();
  const x = ((e.clientX - rect.left) / rect.width) * 100;
  const y = ((e.clientY - rect.top) / rect.height) * 100;

  const index = stars.findIndex(p => Math.hypot(p.x - x, p.y - y) < 3);

  if (index !== -1) {
    // 같은 점 다시 클릭 → 시작점 설정 or 삭제
    if (pathStartIndex === null) {
      pathStartIndex = index;
    } else if (index !== pathStartIndex) {
      lines.push([pathStartIndex, index]);
      pathStartIndex = index;
    } else {
      // 같은 점 다시 누르면 삭제
      stars.splice(index, 1);
      lines = lines.filter(([a, b]) => a !== index && b !== index);
      lines = lines.map(([a, b]) => [
        a > index ? a - 1 : a,
        b > index ? b - 1 : b
      ]);
      pathStartIndex = null;
    }
  } else {
    // 새 점
    const newIndex = stars.length;
    stars.push({ x, y });

    if (pathStartIndex !== null) {
      lines.push([pathStartIndex, newIndex]);
    }
    pathStartIndex = newIndex;
  }

  render();
}


function render() {
  drawArea.innerHTML = "";

  for (const [i, { x, y }] of stars.entries()) {
    const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    dot.setAttribute("cx", x);
    dot.setAttribute("cy", y);
    dot.setAttribute("r", i === pathStartIndex ? 3 : 2);
    dot.setAttribute("fill", i === pathStartIndex ? "yellow" : "white");
    drawArea.appendChild(dot);
  }

  for (const [i, j] of lines) {
    const { x: x1, y: y1 } = stars[i];
    const { x: x2, y: y2 } = stars[j];
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", x1);
    line.setAttribute("y1", y1);
    line.setAttribute("x2", x2);
    line.setAttribute("y2", y2);
    line.setAttribute("stroke", "white");
    drawArea.appendChild(line);
  }

  if (previewLine) drawArea.appendChild(previewLine);
}

drawArea.addEventListener("mousemove", e => {
  if (pathStartIndex === null) {
    previewLine = null;
    return render();
  }

  const rect = drawArea.getBoundingClientRect();
  const x = ((e.clientX - rect.left) / rect.width) * 100;
  const y = ((e.clientY - rect.top) / rect.height) * 100;

  const { x: x1, y: y1 } = stars[pathStartIndex];
  previewLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
  previewLine.setAttribute("x1", x1);
  previewLine.setAttribute("y1", y1);
  previewLine.setAttribute("x2", x);
  previewLine.setAttribute("y2", y);
  previewLine.setAttribute("stroke", "gray");
  previewLine.setAttribute("stroke-dasharray", "2,2");

  render();
});

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

  const [ra_0, dec_0] = currentConst.center;
  const bounds = computeProjectionBounds(currentConst.shape, ra_0, dec_0);

  const pts = currentConst.shape.map(([ra, dec]) => {
    const [x, y] = raDecToXY(ra, dec, ra_0, dec_0, bounds);
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
  if (final>=70){
    feedback.textContent = "✅ 정답일 확률이 높습니다!";
    feedback.style.color = "lightgreen";
  }else{
    feedback.textContent = `❌ 오답일 확률이 높습니다!`;
    feedback.style.color = "tomato";
  }
}

document.addEventListener("keydown", e => {
  if (e.key === "Escape") {
    pathStartIndex = null;
    previewLine = null;
    render();
  }
});


// 모바일 터치 대응
//answerArea = document.getElementById("answer-area");
drawArea.addEventListener("touchstart", e => {
  const touch = e.touches[0];
  handleClick({
    clientX: touch.clientX,
    clientY: touch.clientY
  });
}, { passive: false });

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
drawArea.addEventListener("click", handleClick);

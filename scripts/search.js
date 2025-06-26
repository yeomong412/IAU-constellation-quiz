import { loadData, raDecToXY } from './utils.js';

let allData = [];
let showLines = true;
let current = null; // 선택된 별자리 저장

const input = document.getElementById("search-input");
const resultList = document.getElementById("search-results");
const svg = document.getElementById("constellation");
const infoBox = document.getElementById("info-box");
const toggleBtn = document.getElementById("toggle-lines");

function coordsKey(ra, dec) {
  return `${ra.toFixed(4)}:${dec.toFixed(4)}`;
}

function drawConstellation({ shape, major_stars, lines, ra_range, dec_range, name_ko, name_en, abbr }) {
  svg.innerHTML = "";
  current = { shape, major_stars, lines, ra_range, dec_range, name_ko, name_en, abbr }; // 현재 선택 저장

  const majorSet = new Set(major_stars.map(s => coordsKey(s.ra, s.dec)));

  shape.forEach(([ra, dec]) => {
    const key = coordsKey(ra, dec);
    const isMajor = majorSet.has(key);
    const [x, y] = raDecToXY(ra, dec, ra_range, dec_range);
    const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    dot.setAttribute("cx", x);
    dot.setAttribute("cy", y);
    dot.setAttribute("r", isMajor ? 2 : 1);
    dot.setAttribute("fill", "white");
    svg.appendChild(dot);
  });

  if (showLines && Array.isArray(lines)) {
    lines.forEach(([i, j]) => {
      const [ra1, dec1] = shape[i];
      const [ra2, dec2] = shape[j];
      const [x1, y1] = raDecToXY(ra1, dec1, ra_range, dec_range);
      const [x2, y2] = raDecToXY(ra2, dec2, ra_range, dec_range);
      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("x1", x1);
      line.setAttribute("y1", y1);
      line.setAttribute("x2", x2);
      line.setAttribute("y2", y2);
      line.setAttribute("stroke", "white");
      line.setAttribute("stroke-opacity", "0.3");
      svg.appendChild(line);
    });
  }

  infoBox.innerHTML = `
    <p><strong>${name_ko}</strong> (${name_en}, ${abbr})</p>
    <p>RA: ${ra_range[0]}h ~ ${ra_range[1]}h</p>
    <p>Dec: ${dec_range[0]}° ~ ${dec_range[1]}°</p>
    <p>별 개수: ${shape.length} / 주요 별: ${major_stars.length}</p>
  `;
}

function renderResults(matches) {
  resultList.innerHTML = "";

  matches.forEach(item => {
    const li = document.createElement("li");
    li.textContent = `${item.name_ko} (${item.name_en}, ${item.abbr})`;
    li.style.cursor = "pointer";
    li.onclick = () => drawConstellation(item);
    resultList.appendChild(li);
  });
}

input.oninput = () => {
  const keyword = input.value.trim().toLowerCase();
  if (keyword === "") {
    resultList.innerHTML = "";
    svg.innerHTML = "";
    infoBox.innerHTML = "";
    current = null;
    return;
  }

  const filtered = allData.filter(c =>
    c.name_ko.toLowerCase().includes(keyword) ||
    c.name_en.toLowerCase().includes(keyword) ||
    c.abbr.toLowerCase().includes(keyword)
  );

  renderResults(filtered);
};

toggleBtn.onclick = () => {
  showLines = !showLines;
  toggleBtn.textContent = showLines ? "선 끄기" : "선 켜기";
  if (current) drawConstellation(current);
};

(async function init() {
  allData = await loadData("../assets/data/constellations.json");
})();

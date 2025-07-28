let allData = [];
let currentConst = null;

const nameDisplay = document.getElementById("constellation-name");
const input = document.getElementById("nameInput");
const submitBtn = document.getElementById("submit");
const feedback = document.getElementById("feedback");
const nextBtn = document.getElementById("next");

function pickRandomConstellation() {
  const random = allData[Math.floor(Math.random() * allData.length)];
  currentConst = random;
  nameDisplay.innerHTML = `<text x="50" y="55" text-anchor="middle" dominant-baseline="middle" font-size="10" fill="white">${random.name_ko}</text>`;
  input.value = "";
  feedback.textContent = "";
  input.focus();
}

function checkAnswer() {
  const userInput = input.value.trim().toLowerCase();
  const correct = currentConst.name_en.toLowerCase();
  const correctAbbr = currentConst.abbr.toLowerCase();

  if (userInput === correct || userInput === correctAbbr) {
    feedback.textContent = "✅ 정답입니다!";
    feedback.style.color = "limegreen";
  } else {
    feedback.textContent = `❌ 오답입니다. 정답: ${currentConst.name_en} (${currentConst.abbr})`;
    feedback.style.color = "red";
  }
}

submitBtn.onclick = checkAnswer;
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") checkAnswer();
});
nextBtn.onclick = pickRandomConstellation;

fetch("../assets/data/constellations.json")
  .then((res) => res.json())
  .then((data) => {
    allData = data;
    pickRandomConstellation();
  })
  .catch((err) => {
    console.error("별자리 데이터를 불러오는 데 실패했습니다:", err);
    nameDisplay.innerHTML = `<text x="50" y="55" text-anchor="middle" dominant-baseline="middle" font-size="6" fill="red">데이터 오류</text>`;
  });

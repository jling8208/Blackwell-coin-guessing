const canvas = document.getElementById("strategyCanvas");
const ctx = canvas.getContext("2d");

const opponentInput = document.getElementById("opponentInput");
const submitButton = document.getElementById("submitButton");
const resetButton = document.getElementById("resetButton");
const choiceButtons = document.querySelectorAll(".choice-button");

const roundBadge = document.getElementById("roundBadge");
const message = document.getElementById("message");
const probabilityText = document.getElementById("probabilityText");
const winRateText = document.getElementById("winRateText");
const omegaText = document.getElementById("omegaText");
const cTildeText = document.getElementById("cTildeText");
const historyBody = document.getElementById("historyBody");
const recordCount = document.getElementById("recordCount");

const state = {
  opponents: [],
  guesses: [],
  probabilities: [],
  expectedCorrect: [],
  omegaHistory: [],
  cTildeHistory: [],
  wins: 0,
  losses: 0
};

function omegaBar() {
  if (state.opponents.length === 0) return 0.5;
  return state.opponents.filter((value) => value === "正面").length / state.opponents.length;
}

function cTildeBar() {
  if (state.expectedCorrect.length === 0) return 0.5;
  return state.expectedCorrect.reduce((sum, value) => sum + value, 0) / state.expectedCorrect.length;
}

function probabilityGuessHead() {
  if (state.opponents.length === 0) return 0.5;

  const omega = omegaBar();
  const cTilde = cTildeBar();

  if (omega <= 0.5 && cTilde >= omega) return 0;
  if (omega > 0.5 && cTilde >= 1 - omega) return 1;

  const denominator = 1 - 2 * cTilde;
  if (Math.abs(denominator) < 1e-12) return 0.5;

  return clamp((omega - cTilde) / denominator, 0, 1);
}

function normalizeInput(value) {
  const text = value.trim().replace(/\s+/g, "").toLowerCase();
  if (["正面", "正", "1", "h", "head", "heads"].includes(text)) return "正面";
  if (["反面", "反", "0", "t", "tail", "tails"].includes(text)) return "反面";
  return null;
}

function recordRound(opponent) {
  const probability = probabilityGuessHead();
  const guess = Math.random() < probability ? "正面" : "反面";
  const correct = guess === opponent;
  const expected = opponent === "正面" ? probability : 1 - probability;

  state.opponents.push(opponent);
  state.guesses.push(guess);
  state.probabilities.push(probability);
  state.expectedCorrect.push(expected);
  state.wins += correct ? 1 : 0;
  state.losses += correct ? 0 : 1;
  state.omegaHistory.push(omegaBar());
  state.cTildeHistory.push(cTildeBar());

  return { probability, guess, correct, expected };
}

function submitRound() {
  const opponent = normalizeInput(opponentInput.value);
  if (!opponent) {
    setMessage("請輸入「正面」或「反面」。", "error");
    return;
  }

  const result = recordRound(opponent);
  opponentInput.value = "";
  setMessage(
    `已記錄：對手 ${opponent}，猜正面機率 ${formatPercent(result.probability)}，我的猜測 ${result.guess}，${result.correct ? "正確" : "錯誤"}。`,
    "success"
  );
  render();
}

function resetState() {
  state.opponents = [];
  state.guesses = [];
  state.probabilities = [];
  state.expectedCorrect = [];
  state.omegaHistory = [];
  state.cTildeHistory = [];
  state.wins = 0;
  state.losses = 0;
  setMessage("已重置狀態。", "");
  render();
}

function render() {
  renderCanvas();
  renderStats();
  renderHistory();
}

function renderStats() {
  const round = state.opponents.length;
  const winRate = round === 0 ? 0 : state.wins / round;

  roundBadge.textContent = `第 ${round} 回合`;
  probabilityText.textContent = formatPercent(probabilityGuessHead());
  winRateText.textContent = formatPercent(winRate);
  omegaText.textContent = omegaBar().toFixed(2);
  cTildeText.textContent = cTildeBar().toFixed(2);
  recordCount.textContent = `${round} 筆`;
}

function renderHistory() {
  if (state.opponents.length === 0) {
    historyBody.innerHTML = '<tr class="empty-row"><td colspan="5">尚無紀錄</td></tr>';
    return;
  }

  historyBody.innerHTML = state.opponents
    .map((opponent, index) => {
      const correct = state.opponents[index] === state.guesses[index];
      return `
        <tr>
          <td>${index + 1}</td>
          <td>${opponent}</td>
          <td>${state.guesses[index]}</td>
          <td>${state.probabilities[index].toFixed(2)}</td>
          <td class="${correct ? "win" : "lose"}">${correct ? "正確" : "錯誤"}</td>
        </tr>
      `;
    })
    .join("");
}

function renderCanvas() {
  const ratio = window.devicePixelRatio || 1;
  const cssSize = canvas.getBoundingClientRect().width || 720;
  const pixelSize = Math.round(cssSize * ratio);
  if (canvas.width !== pixelSize || canvas.height !== pixelSize) {
    canvas.width = pixelSize;
    canvas.height = pixelSize;
  }

  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  ctx.clearRect(0, 0, cssSize, cssSize);

  const margin = Math.max(54, cssSize * 0.1);
  const plotSize = cssSize - margin * 2;
  const left = margin;
  const top = margin;
  const bottom = top + plotSize;

  function px(x) {
    return left + x * plotSize;
  }

  function py(y) {
    return bottom - y * plotSize;
  }

  drawBackground(left, top, plotSize, px, py);
  drawTrajectory(px, py);
  drawLabels(cssSize, left, top, bottom, plotSize);
}

function drawBackground(left, top, plotSize, px, py) {
  ctx.save();
  ctx.lineWidth = 1;
  ctx.strokeStyle = "#d8dee3";
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(left, top, plotSize, plotSize);
  ctx.strokeRect(left, top, plotSize, plotSize);

  ctx.beginPath();
  ctx.moveTo(px(0), py(1));
  ctx.lineTo(px(1), py(1));
  ctx.lineTo(px(0.5), py(0.5));
  ctx.closePath();
  ctx.fillStyle = "#d1d5db";
  ctx.fill();

  ctx.strokeStyle = "#edf0f2";
  for (let i = 1; i < 10; i += 1) {
    const value = i / 10;
    line(px(value), py(0), px(value), py(1));
    line(px(0), py(value), px(1), py(value));
  }

  ctx.setLineDash([7, 6]);
  ctx.strokeStyle = "#7b8790";
  ctx.lineWidth = 1.3;
  line(px(0), py(0), px(1), py(1));

  ctx.setLineDash([2, 6]);
  line(px(0), py(1), px(1), py(0));
  ctx.setLineDash([]);

  ctx.fillStyle = "#5b6871";
  ctx.font = "13px Microsoft JhengHei, Noto Sans TC, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  for (let i = 0; i <= 10; i += 1) {
    const value = i / 10;
    ctx.fillText(value.toFixed(1), px(value), py(0) + 10);
  }

  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  for (let i = 0; i <= 10; i += 1) {
    const value = i / 10;
    ctx.fillText(value.toFixed(1), px(0) - 10, py(value));
  }
  ctx.restore();
}

function drawTrajectory(px, py) {
  const xs = state.omegaHistory;
  const ys = state.cTildeHistory;
  if (xs.length === 0) return;

  ctx.save();
  ctx.strokeStyle = "#2563eb";
  ctx.lineWidth = 2;
  ctx.beginPath();
  xs.forEach((x, index) => {
    const y = ys[index];
    if (index === 0) ctx.moveTo(px(x), py(y));
    else ctx.lineTo(px(x), py(y));
  });
  ctx.stroke();

  xs.forEach((x, index) => {
    const y = ys[index];
    ctx.fillStyle = index === xs.length - 1 ? "#dc2626" : "#2563eb";
    ctx.beginPath();
    ctx.arc(px(x), py(y), index === xs.length - 1 ? 6 : 4, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();
}

function drawLabels(cssSize, left, top, bottom, plotSize) {
  ctx.save();
  ctx.fillStyle = "#182026";
  ctx.strokeStyle = "#182026";
  ctx.lineWidth = 1.5;
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";
  drawOmegaBarLabel(left + plotSize / 2, cssSize - 10);

  ctx.translate(17, top + plotSize / 2);
  ctx.rotate(-Math.PI / 2);
  drawCTildeLabel(0, 0);
  ctx.restore();
}

function drawOmegaBarLabel(x, y) {
  ctx.save();
  ctx.font = "700 16px Microsoft JhengHei, Noto Sans TC, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";
  ctx.fillText("ω", x - 4, y);
  line(x - 11, y - 19, x + 3, y - 19);

  ctx.font = "700 11px Microsoft JhengHei, Noto Sans TC, sans-serif";
  ctx.textBaseline = "alphabetic";
  ctx.fillText("t", x + 8, y + 1);
  ctx.restore();
}

function drawCTildeLabel(x, y) {
  ctx.save();
  ctx.font = "700 16px Microsoft JhengHei, Noto Sans TC, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";
  ctx.fillText("c̃", x - 3, y);

  ctx.font = "700 11px Microsoft JhengHei, Noto Sans TC, sans-serif";
  ctx.textBaseline = "alphabetic";
  ctx.fillText("t", x + 8, y + 1);
  ctx.restore();
}

function line(x1, y1, x2, y2) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

function formatPercent(value) {
  return `${(value * 100).toFixed(2)}%`;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function setMessage(text, type) {
  message.textContent = text;
  message.className = `message ${type}`.trim();
}

submitButton.addEventListener("click", submitRound);
resetButton.addEventListener("click", resetState);
opponentInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") submitRound();
});
choiceButtons.forEach((button) => {
  button.addEventListener("click", () => {
    opponentInput.value = button.dataset.choice;
    submitRound();
  });
});
window.addEventListener("resize", renderCanvas);

render();

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// 🎵 Музыка
const bgMusic = new Audio("music.mp3");
bgMusic.loop = true;
bgMusic.volume = 0.3;
window.addEventListener("click", () => {
  if (bgMusic.paused) {
    bgMusic.play();
  }
});


// 🧍 Кейіпкер
const playerImg = new Image();
playerImg.src = "aura.png";

const player = {
  x: canvas.width / 4,
  y: canvas.height / 2,
  width: 100,
  height: 100,
  lane: 1,
  isMagnet: false,
  magnetTimer: 0
};

// Толқын жолақтары
const lanesY = [
  canvas.height / 4 - 50,
  canvas.height / 2 - 50,
  (3 * canvas.height) / 4 - 50
];

let score = 0;
let level = 1;
let auraInterval = 600;
let auraTimer = 0;
let auraStorm = false;
let auraStormTimer = 0;

const auras = [];
const particles = [];
const waveOffsets = [0, 0, 0];
const waveSpeeds = [0.3, 0.6, 1.2];

// Фон түсі
function getBackgroundColor(score) {
  if (score >= 10000) return "#ffe0f0";
  if (score >= 5000) return "#c5f5ff";
  if (score >= 2000) return "#b0ffcc";
  return "#a0d8ef";
}

// 🌀 Aura шығару
function spawnAura() {
  const isRed = Math.random() < 0.1;
  const isMagnet = Math.random() < 0.05;
  const size = Math.random() * 30 + 20;
  const color = isRed ? "#ff0000" : (isMagnet ? "#ffff00" : `hsl(${Math.random() * 360}, 100%, 60%)`);
  const lane = Math.floor(Math.random() * 3);

  auras.push({
    x: canvas.width + size,
    y: lanesY[lane] + 30,
    radius: size,
    color,
    speed: Math.random() * 2 + 1,
    isRed,
    isMagnet
  });
}

// 🧪 Particles
function drawParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.dx;
    p.y += p.dy;
    p.alpha -= 0.02;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fillStyle = `${p.color}${Math.floor(p.alpha * 255).toString(16)}`;
    ctx.fill();
    if (p.alpha <= 0) particles.splice(i, 1);
  }
}

// 🌊 Толқындар
function drawWaves() {
  ctx.strokeStyle = "#ffffff88";
  for (let lane = 0; lane < lanesY.length; lane++) {
    waveOffsets[lane] += waveSpeeds[lane];
    for (let i = 0; i < canvas.width; i += 40) {
      ctx.beginPath();
      const x = (i + waveOffsets[lane]) % canvas.width;
      ctx.arc(x, lanesY[lane] + 70, 20, 0, Math.PI);
      ctx.stroke();
    }
  }
}

// 🎯 Басқару
canvas.addEventListener("mousemove", (e) => {
  player.x = e.clientX - player.width / 2;
  const y = e.clientY;
  if (y < canvas.height / 3) player.lane = 0;
  else if (y < (2 * canvas.height) / 3) player.lane = 1;
  else player.lane = 2;
  player.y = lanesY[player.lane];
});

// 🧲 Магнит тарту
function attractAuras() {
  auras.forEach(aura => {
    if (!aura.isRed && !aura.isMagnet) {
      const dx = (player.x + player.width / 2) - aura.x;
      const dy = (player.y + player.height / 2) - aura.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 200) {
        aura.x += dx * 0.05;
        aura.y += dy * 0.05;
      }
    }
  });
}

// 🌀 Aura Storm
function maybeStartAuraStorm() {
  if (!auraStorm && Math.random() < 0.005) {
    auraStorm = true;
    auraStormTimer = 300;
  }
}

// 🕹️ Game Loop
function gameLoop() {
  ctx.fillStyle = getBackgroundColor(score);
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  drawWaves();
  ctx.drawImage(playerImg, player.x, player.y, player.width, player.height);

  // Aura шығару
  auraTimer++;
  if (auraTimer >= auraInterval || (auraStorm && auraTimer >= 50)) {
    spawnAura();
    auraTimer = 0;
  }

  maybeStartAuraStorm();
  if (auraStorm) {
    auraStormTimer--;
    if (auraStormTimer <= 0) auraStorm = false;
  }

  // Магнит
  if (player.isMagnet) {
    attractAuras();
    player.magnetTimer--;
    if (player.magnetTimer <= 0) player.isMagnet = false;
  }

  for (let i = auras.length - 1; i >= 0; i--) {
    const aura = auras[i];
    aura.x -= aura.speed;

    ctx.beginPath();
    ctx.arc(aura.x, aura.y, aura.radius, 0, Math.PI * 2);
    ctx.fillStyle = aura.color;
    ctx.fill();

    const dx = aura.x - (player.x + player.width / 2);
    const dy = aura.y - (player.y + player.height / 2);
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance < aura.radius + Math.min(player.width, player.height) / 2) {
      if (aura.isRed) {
        score = Math.max(0, score - 50);
        ctx.fillStyle = "red";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        setTimeout(() => {}, 500);
      } else if (aura.isMagnet) {
        player.isMagnet = true;
        player.magnetTimer = 200;
      } else {
        score += Math.floor(aura.radius);
      }

      for (let j = 0; j < 10; j++) {
        particles.push({
          x: aura.x,
          y: aura.y,
          radius: Math.random() * 4 + 1,
          alpha: 1,
          dx: (Math.random() - 0.5) * 2,
          dy: (Math.random() - 0.5) * 2,
          color: aura.color
        });
      }

      auras.splice(i, 1);
    } else if (aura.x + aura.radius < 0) {
      auras.splice(i, 1);
    }
  }

  drawParticles();

  // Level
  level = 1 + Math.floor(score / 200);
  if (level > 1 && level % 5 === 0) auraInterval = Math.max(150, 600 - level * 15);

  // Текст
  ctx.fillStyle = "#fff";
  ctx.font = "36px Arial";
  ctx.fillText(`Aura farming +${score}`, canvas.width / 2 - 150, 60);
  ctx.fillText(`Level ${level}`, canvas.width - 200, 60);

  requestAnimationFrame(gameLoop);
}

gameLoop();

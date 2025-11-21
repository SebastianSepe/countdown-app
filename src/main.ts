const timezoneElem = document.getElementById('timezone')!;
const daysElem = document.getElementById('days')!;
const hoursElem = document.getElementById('hours')!;
const minutesElem = document.getElementById('minutes')!;
const secondsElem = document.getElementById('seconds')!;

// Display detected timezone
const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
timezoneElem.textContent = `Detected time zone: ${timezone}`;

// Pad single digits with leading zero
function pad(n: number): string {
	return n.toString().padStart(2, '0');
}

// Flip animation for countdown numbers
function flipNumber(card: HTMLElement, newNumber: string) {
	const top = card.querySelector('.top') as HTMLElement;
	const bottom = card.querySelector('.bottom') as HTMLElement;
	if (top.textContent === newNumber) return;

	top.textContent = newNumber;
	bottom.textContent = newNumber;

	card.classList.add('flip');

	setTimeout(() => {
		top.textContent = newNumber;
		bottom.textContent = newNumber;
		card.classList.remove('flip');
	}, 500); // matches CSS transition
}

// Update countdown to next year
function updateCountdown() {
	const now = new Date();
	const targetYear = now.getFullYear() + 1;
	const endOfYear = new Date(`${targetYear}-01-01T00:00:00`);
	const diff = endOfYear.getTime() - now.getTime();

	if (diff <= 0) {
		flipNumber(daysElem, '00');
		flipNumber(hoursElem, '00');
		flipNumber(minutesElem, '00');
		flipNumber(secondsElem, '00');
		return;
	}

	const d = Math.floor(diff / (1000 * 60 * 60 * 24));
	const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
	const m = Math.floor((diff / (1000 * 60)) % 60);
	const s = Math.floor((diff / 1000) % 60);

	flipNumber(daysElem, pad(d));
	flipNumber(hoursElem, pad(h));
	flipNumber(minutesElem, pad(m));
	flipNumber(secondsElem, pad(s));
}

// Initial countdown
updateCountdown();
setInterval(updateCountdown, 1000);

// --- MINIGAME ---
const minigameContainer = document.getElementById('minigame-container')!;
const scoreElement = document.getElementById('score') as HTMLSpanElement;
const startBtn = document.getElementById('start-btn') as HTMLButtonElement;
const pauseBtn = document.getElementById('pause-btn') as HTMLButtonElement;
const restartBtn = document.getElementById('restart-btn') as HTMLButtonElement;

const celebrationEmojis = ['🎉', '🍾', '✨', '🥂', '🎆', '🥳'];
let score = 0;
const BUBBLE_LIFESPAN = 2000;
let gameInterval: ReturnType<typeof setInterval> | undefined;
let gameState: 'stopped' | 'running' | 'paused' = 'stopped';

// Update button states based on game state
function updateButtonState() {
	startBtn.disabled = gameState === 'running';
	pauseBtn.disabled = gameState !== 'running';
	restartBtn.disabled = gameState === 'stopped';
}

// Start the minigame
function startGame() {
	if (gameState === 'running') return;
	gameState = 'running';
	updateButtonState();
	if (gameInterval) clearInterval(gameInterval);
	gameInterval = setInterval(createBubble, 750);
}

// Pause the minigame
function pauseGame() {
	if (gameState !== 'running') return;
	gameState = 'paused';
	updateButtonState();
	if (gameInterval) {
		clearInterval(gameInterval);
		gameInterval = undefined;
	}
}

// Restart the minigame
function restartGame() {
	if (gameInterval) clearInterval(gameInterval);
	gameInterval = undefined;

	minigameContainer
		.querySelectorAll('.celebration-bubble')
		.forEach((b) => b.remove());
	score = 0;
	scoreElement.textContent = score.toString();

	gameState = 'stopped';
	updateButtonState();
}

// Button listeners
startBtn.addEventListener('click', startGame);
pauseBtn.addEventListener('click', pauseGame);
restartBtn.addEventListener('click', restartGame);

// Create a celebration bubble
function createBubble() {
	if (gameState !== 'running') return;

	const emoji =
		celebrationEmojis[Math.floor(Math.random() * celebrationEmojis.length)];
	const bubble = document.createElement('div');
	bubble.className = 'celebration-bubble';
	bubble.textContent = emoji;

	bubble.style.left = `${Math.random() * 95}%`;
	bubble.style.top = `${Math.random() * 95}%`;

	bubble.addEventListener('click', () => {
		score++;
		scoreElement.textContent = score.toString();
		bubble.remove();
	});

	minigameContainer.appendChild(bubble);

	setTimeout(() => {
		if (bubble.parentElement) bubble.remove();
	}, BUBBLE_LIFESPAN);
}

// Initialize game buttons
updateButtonState();

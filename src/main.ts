import { Fireworks } from 'fireworks-js';

const titleElem = document.querySelector('h1') as HTMLElement | null;
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

// --- Fireworks & Celebration ---
let fireworksInstance: Fireworks | null = null;
let fireworksTimeout: number | null = null;
let celebrationOverlay: HTMLElement | null = null;
let audioElem: HTMLAudioElement | null = null;
let prevTitleDisplay: string | null = null;
let fireworksBtnElem: HTMLButtonElement | null = null;
let floatingFireworksBtn: HTMLButtonElement | null = null;
let manualFireworksInstance: Fireworks | null = null;
let manualFireworksCanvas: HTMLCanvasElement | null = null;

// Shared options for celebration and manual shots
const CELEBRATION_FIREWORKS_OPTIONS = {
	hue: { min: 0, max: 360 },
	delay: { min: 15, max: 30 },
	rocketsPoint: { min: 0, max: 100 },
	acceleration: 1.05,
	friction: 0.97,
	gravity: 1.5,
	particles: 80,
	explosion: 5,
	autoresize: true,
	brightness: { min: 50, max: 80 },
	decay: { min: 0.015, max: 0.03 }
};

let countdownElem: HTMLElement | null = null;
let prevCountdownDisplay: string | null = null;
let prevTimezoneDisplay: string | null = null;
let minigameElem: HTMLElement | null = null;
let prevMinigameDisplay: string | null = null;
let controlsElem: HTMLElement | null = null;
let prevControlsDisplay: string | null = null;

let targetDate: Date;
// Production mode: real countdown to next year and 2 hours celebration
const TEST_MODE = false;
const TEST_INITIAL_DELAY = 3 * 1000; // unused when TEST_MODE = false
const TEST_FIREWORKS_DURATION = 20 * 1000; // unused when TEST_MODE = false

function setTargetToNextYear() {
	const now = new Date();
	const nextYear = now.getFullYear() + 1;
	if (TEST_MODE) {
		targetDate = new Date(Date.now() + TEST_INITIAL_DELAY);
	} else {
		targetDate = new Date(`${nextYear}-01-01T00:00:00`);
	}
}

setTargetToNextYear();

function startFireworks() {
	if (fireworksInstance) return;

	// use the target year (the year we counted down to) so it stays correct
	const celebratoryYear = targetDate.getFullYear();
	if (titleElem) titleElem.textContent = `Happy New Year ${celebratoryYear}`;
	// hide countdown and timezone during celebration
	countdownElem = document.getElementById('countdown');
	if (countdownElem) {
		prevCountdownDisplay = countdownElem.style.display || null;
		countdownElem.style.display = 'none';
	}
	if (timezoneElem) {
		prevTimezoneDisplay = timezoneElem.style.display || null;
		timezoneElem.style.display = 'none';
	}
	const canvas = document.createElement('canvas');
	canvas.id = 'fireworks-canvas';
	canvas.style.position = 'fixed';
	canvas.style.top = '0';
	canvas.style.left = '0';
	canvas.style.width = '100vw';
	canvas.style.height = '100vh';
	canvas.style.zIndex = '9999';
	canvas.style.pointerEvents = 'none';
	document.body.appendChild(canvas);

	// overlay: full-screen semi-transparent background + centered message
	celebrationOverlay = document.createElement('div');
	celebrationOverlay.id = 'celebration-overlay';
	celebrationOverlay.style.position = 'fixed';
	celebrationOverlay.style.inset = '0';
	celebrationOverlay.style.zIndex = '10000';
	celebrationOverlay.style.display = 'flex';
	celebrationOverlay.style.alignItems = 'center';
	celebrationOverlay.style.justifyContent = 'center';
	// no background so page background color stays unchanged
	celebrationOverlay.style.background = 'transparent';
	celebrationOverlay.style.pointerEvents = 'none';

	const message = document.createElement('div');
	message.style.color = 'white';
	//message.style.textShadow = '0 2px 12px rgba(0,0,0,0.8)';
	message.style.fontFamily = 'Inter, system-ui, sans-serif';
	message.style.fontSize = '6vw';
	message.style.fontWeight = '800';
	message.style.letterSpacing = '0.02em';
	const messageYear = targetDate.getFullYear();
	message.textContent = `🎉 Happy New Year ${messageYear} ! 🎉`;

	celebrationOverlay.appendChild(message);
	document.body.appendChild(celebrationOverlay);

	// hide the page title (original h1) while overlay is visible
	if (titleElem) {
		prevTitleDisplay = titleElem.style.display || null;
		titleElem.style.display = 'none';
	}

	// hide minigame while celebrating
	minigameElem = document.getElementById('minigame-container');
	if (minigameElem) {
		prevMinigameDisplay = minigameElem.style.display || null;
		minigameElem.style.display = 'none';
	}

	// hide game controls while celebrating
	controlsElem = document.getElementById('game-controls-container');
	if (controlsElem) {
		prevControlsDisplay = controlsElem.style.display || null;
		controlsElem.style.display = 'none';
	}

		fireworksInstance = new Fireworks(canvas, Object.assign({}, CELEBRATION_FIREWORKS_OPTIONS, { mouse: { click: false, move: false, max: 0 } }));
	fireworksInstance.start();


	// duration depending on test mode (2 hours production, 5s in test)
	const duration = TEST_MODE ? TEST_FIREWORKS_DURATION : 2 * 60 * 60 * 1000;
	fireworksTimeout = window.setTimeout(() => stopFireworks(true), duration);
}

function stopFireworks(restartCountdown = false) {
	if (fireworksInstance) {
		fireworksInstance.stop();
		fireworksInstance = null;
	}
	const canvas = document.getElementById('fireworks-canvas');
	if (canvas) canvas.remove();
	if (celebrationOverlay) {
		celebrationOverlay.remove();
		celebrationOverlay = null;
	}
	if (audioElem) {
		audioElem.pause();
		audioElem.currentTime = 0;
		audioElem = null;
	}
	if (fireworksTimeout) {
		clearTimeout(fireworksTimeout);
		fireworksTimeout = null;
	}

	if (restartCountdown) {
		// set next target to the following year and update title
		setTargetToNextYear();
		updateCountdown();
		// restore countdown and timezone visibility
		if (countdownElem) countdownElem.style.display = prevCountdownDisplay || '';
		if (timezoneElem) timezoneElem.style.display = prevTimezoneDisplay || '';
		// restore title visibility
		if (titleElem) titleElem.style.display = prevTitleDisplay || '';
		// restore minigame visibility
		if (minigameElem) minigameElem.style.display = prevMinigameDisplay || '';
		// restore game controls visibility
		if (controlsElem) controlsElem.style.display = prevControlsDisplay || '';
		// leave floating fireworks button enabled so user can fire during celebration
	}
}

function updateCountdown() {
	const now = new Date();
	const diff = targetDate.getTime() - now.getTime();

	if (diff <= 0) {
		flipNumber(daysElem, '00');
		flipNumber(hoursElem, '00');
		flipNumber(minutesElem, '00');
		flipNumber(secondsElem, '00');
		startFireworks();
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

// wire floating fireworks button from HTML
floatingFireworksBtn = document.getElementById('fireworks-floating-btn') as HTMLButtonElement | null;
if (floatingFireworksBtn) {
	floatingFireworksBtn.addEventListener('click', () => shootSingleFirework());
}

// Shoot a single firework (independent simple canvas animation)
function shootSingleFirework() {
	// Fire a single rocket using the same fireworks-js visuals as the celebration.
	const w = window.innerWidth;
	const h = window.innerHeight;
	// pick explosion coords inside viewport
	const explosionX = Math.max(40, Math.min(w - 40, Math.random() * w * 0.8 + w * 0.1));
	const highChance = 0.6;
	const explosionY = Math.random() < highChance ? Math.max(60, Math.min(h - 60, h * (0.10 + Math.random() * 0.35))) : Math.max(60, Math.min(h - 60, h * (0.45 + Math.random() * 0.35)));

	if (!manualFireworksCanvas) {
		manualFireworksCanvas = document.createElement('canvas');
		manualFireworksCanvas.style.position = 'fixed';
		manualFireworksCanvas.style.left = '0';
		manualFireworksCanvas.style.top = '0';
		manualFireworksCanvas.width = w;
		manualFireworksCanvas.height = h;
		manualFireworksCanvas.style.pointerEvents = 'none';
		manualFireworksCanvas.style.zIndex = '11000';
		manualFireworksCanvas.id = 'manual-fireworks-canvas';
		document.body.appendChild(manualFireworksCanvas);
	} else {
		manualFireworksCanvas.width = w;
		manualFireworksCanvas.height = h;
	}

	// manual options: reuse celebration visuals but disable automatic launches by setting a huge delay
	const manualOptions = Object.assign({}, CELEBRATION_FIREWORKS_OPTIONS, { delay: { min: 9999999, max: 9999999 }, mouse: { click: true, move: false, max: 0 } });
	if (!manualFireworksInstance) {
		manualFireworksInstance = new Fireworks(manualFireworksCanvas, manualOptions);
		manualFireworksInstance.start();
		// wait a frame to ensure internal listeners are attached
		requestAnimationFrame(() => {
			try {
				const rect = manualFireworksCanvas!.getBoundingClientRect();
				const clientX = Math.round(rect.left + explosionX);
				const clientY = Math.round(rect.top + explosionY);
				try {
					const inst: any = manualFireworksInstance;
					// call internal pointerDown + createTrace to force a single rocket at coords
					if (inst && inst.mouse && typeof inst.createTrace === 'function') {
						inst.mouse.pointerDown({ pageX: clientX, pageY: clientY });
						inst.createTrace();
						inst.mouse.pointerUp({ pageX: clientX, pageY: clientY });
						console.debug('Triggered internal createTrace (post-start)', { clientX, clientY });
					} else {
						const ev = new MouseEvent('click', { bubbles: true, cancelable: true, clientX, clientY });
						manualFireworksCanvas!.dispatchEvent(ev);
						window.dispatchEvent(ev);
						console.debug('Dispatched manual fireworks click fallback (post-start)', { clientX, clientY });
					}
				} catch (err) {
					console.error('Error triggering internal createTrace', err);
				}
			} catch (err) {
				console.error('Error dispatching post-start click', err);
			}
		});
		return;
	}

	// If instance already exists, dispatch immediately
	try {
		const rect = manualFireworksCanvas.getBoundingClientRect();
		const clientX = Math.round(rect.left + explosionX);
		const clientY = Math.round(rect.top + explosionY);
		try {
			const inst: any = manualFireworksInstance;
			if (inst && inst.mouse && typeof inst.createTrace === 'function') {
				inst.mouse.pointerDown({ pageX: clientX, pageY: clientY });
				inst.createTrace();
				inst.mouse.pointerUp({ pageX: clientX, pageY: clientY });
				console.debug('Triggered internal createTrace', { clientX, clientY });
			} else {
				const ev = new MouseEvent('click', { bubbles: true, cancelable: true, clientX, clientY });
				manualFireworksCanvas.dispatchEvent(ev);
				window.dispatchEvent(ev);
				console.debug('Dispatched manual fireworks click fallback', { clientX, clientY });
			}
		} catch (err) {
			console.error('Error triggering internal createTrace', err);
		}
	} catch (err) {
		console.error('Error dispatching manual fireworks click', err);
	}
}

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

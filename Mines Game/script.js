// Game State
let balance = 1000;
let currentBet = 0;
let gameActive = false;
let mines = [];
let revealedCells = 0;
let totalCells = 25;
let mineCount = 5;
let multiplier = 1;
let currentWinnings = 0;
let transactionType = 'deposit';

// DOM Elements
const balanceElement = document.getElementById('balanceValue');
const betAmountInput = document.getElementById('betAmount');
const mineCountInput = document.getElementById('mineCount');
const startGameBtn = document.getElementById('startGame');
const claimBtn = document.getElementById('claimBtn');
const claimAmountElement = document.getElementById('claimAmount');
const gameResult = document.getElementById('gameResult');
const gameGrid = document.getElementById('gameGrid');
const depositBtn = document.getElementById('depositBtn');
const withdrawBtn = document.getElementById('withdrawBtn');
const qrCodeElement = document.getElementById('qrCode');

// Modal Elements
const transactionModal = document.getElementById('transactionModal');
const amountInput = document.getElementById('amountInput');
const modalTitle = document.getElementById('modalTitle');
const confirmTransaction = document.getElementById('confirmTransaction');
const cancelTransaction = document.getElementById('cancelTransaction');

const messageModal = document.getElementById('messageModal');
const messageTitle = document.getElementById('messageTitle');
const messageText = document.getElementById('messageText');
const closeMessage = document.getElementById('closeMessage');

// Adjustment Buttons
const decreaseBet = document.getElementById('decreaseBet');
const increaseBet = document.getElementById('increaseBet');
const decreaseMines = document.getElementById('decreaseMines');
const increaseMines = document.getElementById('increaseMines');

// Initialize Game
function init() {
    updateBalance();
    setupEventListeners();
    setupTouchControls();
    renderGrid();
    generateQRCode();
}

// Setup Event Listeners
function setupEventListeners() {
    // Game Controls
    startGameBtn.addEventListener('click', startGame);
    claimBtn.addEventListener('click', claimWinnings);
    
    // Transaction Buttons
    depositBtn.addEventListener('click', () => {
        transactionType = 'deposit';
        showTransactionModal('Deposit');
    });
    withdrawBtn.addEventListener('click', () => {
        transactionType = 'withdraw';
        showTransactionModal('Withdraw');
    });
    
    // Modal Controls
    confirmTransaction.addEventListener('click', processTransaction);
    cancelTransaction.addEventListener('click', () => transactionModal.style.display = 'none');
    closeMessage.addEventListener('click', () => messageModal.style.display = 'none');
    
    // Adjustment Buttons
    decreaseBet.addEventListener('click', () => adjustValue('betAmount', -1));
    increaseBet.addEventListener('click', () => adjustValue('betAmount', 1));
    decreaseMines.addEventListener('click', () => adjustValue('mineCount', -1));
    increaseMines.addEventListener('click', () => adjustValue('mineCount', 1));
    
    // Input Validation
    betAmountInput.addEventListener('change', validateBetAmount);
    mineCountInput.addEventListener('change', validateMineCount);
}

// Setup Touch Controls
function setupTouchControls() {
    gameGrid.addEventListener('touchend', handleTouchEnd, { passive: false });
}

function handleTouchEnd(e) {
    if (!gameActive) return;
    
    const touch = e.changedTouches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    
    if (element && element.classList.contains('cell')) {
        const index = parseInt(element.dataset.index);
        handleCellClick(index);
    }
    e.preventDefault();
}

// Update Balance Display
function updateBalance() {
    balanceElement.textContent = balance.toFixed(2);
}

// Adjust Input Values
function adjustValue(inputId, change) {
    const input = document.getElementById(inputId);
    let value = parseInt(input.value) || 0;
    value += change;
    
    if (inputId === 'betAmount' && value < 1) value = 1;
    if (inputId === 'mineCount') {
        if (value < 1) value = 1;
        if (value > 24) value = 24;
    }
    
    input.value = value;
}

// Validate Inputs
function validateBetAmount() {
    let value = parseInt(betAmountInput.value);
    if (isNaN(value) || value < 1) {
        betAmountInput.value = 1;
    }
}

function validateMineCount() {
    let value = parseInt(mineCountInput.value);
    if (isNaN(value) || value < 1) {
        mineCountInput.value = 1;
    } else if (value > 24) {
        mineCountInput.value = 24;
    }
}

// Generate QR Code
function generateQRCode() {
    if (!gameActive || mines.length === 0) {
        qrCodeElement.innerHTML = '<p class="qr-placeholder">Start a game to see QR code</p>';
        return;
    }

    const positions = mines.map(index => {
        const row = Math.floor(index / 5) + 1;
        const col = (index % 5) + 1;
        return `${row},${col}`;
    }).join('|');

    const qr = qrcode(0, 'L');
    qr.addData(positions);
    qr.make();
    qrCodeElement.innerHTML = qr.createImgTag(4);
}

// Game Control Functions
function startGame() {
    const betAmount = parseInt(betAmountInput.value);
    mineCount = parseInt(mineCountInput.value);
    
    if (isNaN(betAmount)) {
        showGameError('Invalid bet amount');
        return;
    }
    
    if (betAmount > balance) {
        showGameError('Insufficient balance');
        return;
    }
    
    if (isNaN(mineCount) || mineCount < 1 || mineCount > 24) {
        showGameError('Mines must be 1-24');
        return;
    }
    
    // Reset game state
    balance -= betAmount;
    currentBet = betAmount;
    gameActive = true;
    revealedCells = 0;
    mines = [];
    currentWinnings = 0;
    multiplier = 1;
    
    // Update UI
    updateBalance();
    gameResult.textContent = 'Game started! Tap cells to reveal';
    gameResult.className = 'result-message';
    claimBtn.disabled = true;
    claimAmountElement.textContent = '0.00';
    gameGrid.classList.remove('game-ended');
    
    // Setup game
    generateMines();
    renderGrid();
    generateQRCode();
}

function renderGrid() {
    gameGrid.innerHTML = '';
    
    for (let i = 0; i < totalCells; i++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.dataset.index = i;
        gameGrid.appendChild(cell);
    }
    
    // Use event delegation
    gameGrid.onclick = (e) => {
        const cell = e.target.closest('.cell');
        if (cell && gameActive) {
            const index = parseInt(cell.dataset.index);
            handleCellClick(index);
        }
    };
}

function generateMines() {
    mines = [];
    const positions = Array.from({length: totalCells}, (_, i) => i);
    
    // Fisher-Yates shuffle
    for (let i = positions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [positions[i], positions[j]] = [positions[j], positions[i]];
    }
    
    mines = positions.slice(0, mineCount);
}

function handleCellClick(index) {
    if (!gameActive) return;
    
    const cell = document.querySelector(`.cell[data-index="${index}"]`);
    if (!cell || cell.classList.contains('revealed')) return;
    
    cell.classList.add('revealed');
    
    if (mines.includes(index)) {
        cell.classList.add('mine');
        endGame(false);
        return;
    }
    
    // Safe cell logic
    cell.classList.add('gem');
    revealedCells++;
    
    const safeCells = totalCells - mineCount;
    const riskFactor = revealedCells / safeCells;
    multiplier = 1 + (riskFactor * (mineCount / safeCells) * 10);
    currentWinnings = currentBet * multiplier;
    
    // Update UI
    claimBtn.disabled = false;
    claimAmountElement.textContent = currentWinnings.toFixed(2);
    gameResult.textContent = `Multiplier: ${multiplier.toFixed(2)}x | Potential: $${currentWinnings.toFixed(2)}`;
    gameResult.className = 'result-message win';
    
    // Check for win
    if (revealedCells === safeCells) {
        endGame(true);
    }
}

function endGame(win) {
    gameActive = false;
    gameGrid.classList.add('game-ended');
    
    if (win) {
        balance += currentWinnings;
        updateBalance();
        gameResult.textContent = `You won $${currentWinnings.toFixed(2)}! (${multiplier.toFixed(2)}x)`;
        gameResult.className = 'result-message win';
    } else {
        gameResult.textContent = `You lost $${currentBet.toFixed(2)}!`;
        gameResult.className = 'result-message lose';
    }
    
    revealAllMines();
    claimBtn.disabled = true;
}

function revealAllMines() {
    mines.forEach(index => {
        const cell = document.querySelector(`.cell[data-index="${index}"]`);
        if (cell && !cell.classList.contains('revealed')) {
            cell.classList.add('revealed', 'mine');
        }
    });
    generateQRCode();
}

function claimWinnings() {
    if (!gameActive || currentWinnings <= 0) return;
    endGame(true);
}

// Modal Functions
function showTransactionModal(type) {
    modalTitle.innerHTML = `<i class="fas fa-${type === 'Deposit' ? 'arrow-down' : 'arrow-up'}"></i> ${type}`;
    amountInput.value = '';
    transactionModal.style.display = 'flex';
}

function processTransaction() {
    const amount = parseFloat(amountInput.value);
    
    if (isNaN(amount) || amount <= 0) {
        showMessage('Error', 'Please enter a valid amount');
        return;
    }
    
    if (transactionType === 'withdraw' && amount > balance) {
        showMessage('Error', 'Insufficient balance');
        return;
    }
    
    if (transactionType === 'deposit') {
        balance += amount;
        showMessage('Success', `$${amount.toFixed(2)} deposited to your balance`);
    } else {
        balance -= amount;
        showMessage('Success', `$${amount.toFixed(2)} withdrawn from your balance`);
    }
    
    updateBalance();
    transactionModal.style.display = 'none';
}

function showMessage(title, text) {
    messageTitle.textContent = title;
    messageText.textContent = text;
    messageModal.style.display = 'flex';
}

function showGameError(message) {
    gameResult.textContent = message;
    gameResult.className = 'result-message lose';
}

// Initialize the game
document.addEventListener('DOMContentLoaded', init);

// Service Worker for PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
            .then(registration => console.log('ServiceWorker registered'))
            .catch(err => console.log('ServiceWorker registration failed: ', err));
    });
}
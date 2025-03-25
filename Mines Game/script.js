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
let lastRenderTime = 0;
const fps = 30;

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
    renderGrid();
    generateQRCode();
    setupTouchControls();
    requestAnimationFrame(gameLoop);
}

// Setup PWA features
function setupApp() {
    document.addEventListener('gesturestart', function(e) {
        e.preventDefault();
    });
}

// Game Loop
function gameLoop(timestamp) {
    if (timestamp - lastRenderTime < 1000/fps) {
        requestAnimationFrame(gameLoop);
        return;
    }
    lastRenderTime = timestamp;
    
    // Update game state if needed
    requestAnimationFrame(gameLoop);
}

// Setup Touch Controls
function setupTouchControls() {
    let touchStartTime = 0;
    let touchStartX, touchStartY;
    
    gameGrid.addEventListener('touchstart', (e) => {
        if (!gameActive) return;
        const touch = e.touches[0];
        touchStartTime = Date.now();
        touchStartX = touch.clientX;
        touchStartY = touch.clientY;
        e.preventDefault();
    }, { passive: false });
    
    gameGrid.addEventListener('touchend', (e) => {
        if (!gameActive || Date.now() - touchStartTime > 300) return;
        
        const touch = e.changedTouches[0];
        const touchEndX = touch.clientX;
        const touchEndY = touch.clientY;
        
        if (Math.abs(touchEndX - touchStartX) < 10 && Math.abs(touchEndY - touchStartY) < 10) {
            const element = document.elementFromPoint(touchEndX, touchEndY);
            if (element && element.classList.contains('cell')) {
                const index = parseInt(element.dataset.index);
                handleCellClick(index);
            }
        }
        e.preventDefault();
    }, { passive: false });
}

// Update Balance Display
function updateBalance() {
    balanceElement.textContent = balance.toFixed(2);
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

// Validate Bet Amount
function validateBetAmount() {
    let value = parseInt(betAmountInput.value);
    if (isNaN(value) || value < 1) {
        betAmountInput.value = 1;
    }
}

// Validate Mine Count
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

// Start New Game
function startGame() {
    const betAmount = parseInt(betAmountInput.value);
    mineCount = parseInt(mineCountInput.value);
    
    if (isNaN(betAmount) || betAmount < 1) {
        showGameError('Please enter a valid bet amount');
        return;
    }
    
    if (betAmount > balance) {
        showGameError('Insufficient balance');
        return;
    }
    
    if (isNaN(mineCount) || mineCount < 1 || mineCount > 24) {
        showGameError('Number of mines must be between 1-24');
        return;
    }
    
    balance -= betAmount;
    currentBet = betAmount;
    updateBalance();
    
    gameActive = true;
    revealedCells = 0;
    multiplier = 1;
    currentWinnings = 0;
    mines = [];
    
    gameResult.textContent = 'Game started! Tap cells to reveal';
    gameResult.className = 'result-message';
    claimBtn.disabled = true;
    claimAmountElement.textContent = '0.00';
    
    generateMines();
    renderGrid();
    generateQRCode();
}

// Generate Mines
function generateMines() {
    mines = [];
    const positions = Array.from({length: totalCells}, (_, i) => i);
    
    for (let i = positions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [positions[i], positions[j]] = [positions[j], positions[i]];
    }
    
    mines = positions.slice(0, mineCount);
}

// Render Game Grid
function renderGrid() {
    gameGrid.innerHTML = '';
    
    for (let i = 0; i < totalCells; i++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.dataset.index = i;
        
        if (gameActive) {
            cell.addEventListener('click', () => handleCellClick(i));
        }
        
        gameGrid.appendChild(cell);
    }
}

// Handle Cell Click
const handleCellClick = (function() {
    let lastClick = 0;
    return function(index) {
        const now = Date.now();
        if (now - lastClick < 300) return;
        lastClick = now;
        
        const cell = document.querySelector(`.cell[data-index="${index}"]`);
        if (cell.classList.contains('revealed')) return;
        
        cell.classList.add('revealed');
        
        if (mines.includes(index)) {
            cell.classList.add('mine');
            gameOver(false);
        } else {
            cell.classList.add('gem');
            revealedCells++;
            
            const safeCells = totalCells - mineCount;
            const riskFactor = revealedCells / safeCells;
            multiplier = 1 + (riskFactor * (mineCount / safeCells) * 10);
            currentWinnings = currentBet * multiplier;
            
            gameResult.textContent = `Multiplier: ${multiplier.toFixed(2)}x | Potential: $${currentWinnings.toFixed(2)}`;
            gameResult.className = 'result-message win';
            claimBtn.disabled = false;
            claimAmountElement.textContent = currentWinnings.toFixed(2);
            
            if (revealedCells === safeCells) {
                claimWinnings();
            }
        }
    };
})();

// Claim Winnings
function claimWinnings() {
    if (!gameActive || currentWinnings <= 0) return;
    
    balance += currentWinnings;
    updateBalance();
    gameActive = false;
    
    gameResult.textContent = `You won $${currentWinnings.toFixed(2)}! (${multiplier.toFixed(2)}x)`;
    gameResult.className = 'result-message win';
    claimBtn.disabled = true;
    
    revealAllMines();
}

// Game Over
function gameOver(win) {
    gameActive = false;
    claimBtn.disabled = true;
    
    revealAllMines();
    
    if (win) {
        gameResult.textContent = `You won $${currentWinnings.toFixed(2)}! (${multiplier.toFixed(2)}x)`;
        gameResult.className = 'result-message win';
    } else {
        gameResult.textContent = `You lost $${currentBet.toFixed(2)}!`;
        gameResult.className = 'result-message lose';
    }
}

// Reveal All Mines
function revealAllMines() {
    mines.forEach(index => {
        const cell = document.querySelector(`.cell[data-index="${index}"]`);
        if (cell && !cell.classList.contains('revealed')) {
            cell.classList.add('revealed', 'mine');
        }
    });
    generateQRCode();
}

// Show Game Error
function showGameError(message) {
    gameResult.textContent = message;
    gameResult.className = 'result-message lose';
}

// Show Transaction Modal
function showTransactionModal(type) {
    modalTitle.innerHTML = `<i class="fas fa-${type === 'Deposit' ? 'arrow-down' : 'arrow-up'}"></i> ${type}`;
    amountInput.value = '';
    transactionModal.style.display = 'flex';
}

// Process Transaction
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

// Show Message Modal
function showMessage(title, text) {
    messageTitle.textContent = title;
    messageText.textContent = text;
    messageModal.style.display = 'flex';
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
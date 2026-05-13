document.addEventListener('DOMContentLoaded', () => {
    /* ==============================
       WEB AUDIO API - 8-BIT SOUNDS
    ============================== */
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    function playSound(type) {
        // Resume context if suspended (browser auto-play policy)
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }

        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        const now = audioCtx.currentTime;
        
        switch(type) {
            case 'click': // UI Buttons
                osc.type = 'square';
                osc.frequency.setValueAtTime(400, now);
                osc.frequency.exponentialRampToValueAtTime(800, now + 0.05);
                gainNode.gain.setValueAtTime(0.05, now);
                gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
                osc.start(now);
                osc.stop(now + 0.05);
                break;
            case 'hover': // Card hovers
                osc.type = 'sine';
                osc.frequency.setValueAtTime(600, now);
                gainNode.gain.setValueAtTime(0.01, now);
                gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
                osc.start(now);
                osc.stop(now + 0.05);
                break;
            case 'boop': // Tic Tac Toe placing mark
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(300, now);
                gainNode.gain.setValueAtTime(0.1, now);
                gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
                osc.start(now);
                osc.stop(now + 0.1);
                break;
            case 'eat': // Snake food
                osc.type = 'square';
                osc.frequency.setValueAtTime(440, now); // A4
                osc.frequency.setValueAtTime(554, now + 0.05); // C#5
                osc.frequency.setValueAtTime(659, now + 0.1); // E5
                gainNode.gain.setValueAtTime(0.1, now);
                gainNode.gain.linearRampToValueAtTime(0, now + 0.15);
                osc.start(now);
                osc.stop(now + 0.15);
                break;
            case 'die': // Snake die
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(150, now);
                osc.frequency.exponentialRampToValueAtTime(40, now + 0.4);
                gainNode.gain.setValueAtTime(0.2, now);
                gainNode.gain.linearRampToValueAtTime(0, now + 0.4);
                osc.start(now);
                osc.stop(now + 0.4);
                break;
            case 'win': // Tic Tac Toe win
                osc.type = 'square';
                osc.frequency.setValueAtTime(400, now);
                osc.frequency.setValueAtTime(500, now + 0.1);
                osc.frequency.setValueAtTime(600, now + 0.2);
                osc.frequency.setValueAtTime(800, now + 0.3);
                gainNode.gain.setValueAtTime(0.1, now);
                gainNode.gain.linearRampToValueAtTime(0, now + 0.5);
                osc.start(now);
                osc.stop(now + 0.5);
                break;
        }
    }

    // Attach click sounds to interactive elements
    const clickables = document.querySelectorAll('.nav-link, .category-btn, .game-btn, .submit-btn');
    clickables.forEach(el => {
        el.addEventListener('click', () => playSound('click'));
    });

    /* ==============================
       NAVIGATION & SECTIONS
    ============================== */
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('.content-section');

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');

            const targetId = `section-${link.getAttribute('data-target')}`;
            sections.forEach(sec => {
                if(sec.id === targetId) {
                    sec.style.display = 'flex';
                } else {
                    sec.style.display = 'none';
                }
            });
        });
    });

    /* ==============================
       CATEGORY FILTERING
    ============================== */
    const categoryBtns = document.querySelectorAll('.category-btn');
    const skillCards = document.querySelectorAll('.skill-card');
    const activeSkillCount = document.getElementById('active-skill-count');

    categoryBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            categoryBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const filter = btn.getAttribute('data-filter');
            let count = 0;

            skillCards.forEach(card => {
                const categories = card.getAttribute('data-category').split(' ');
                if (filter === 'all' || categories.includes(filter)) {
                    card.style.display = 'flex';
                    count++;
                } else {
                    card.style.display = 'none';
                }
            });

            activeSkillCount.innerText = count;
        });
    });

    // Playful interaction + Hover Sound for skill cards & project cards
    const hoverCards = document.querySelectorAll('.skill-card, .project-card');
    hoverCards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            playSound('hover');
            card.style.transform = 'translate(-2px, -2px) rotate(-1deg)';
            card.style.boxShadow = '6px 6px 0px var(--black)';
        });
        card.addEventListener('mouseleave', () => {
            card.style.transform = '';
            card.style.boxShadow = '';
        });
    });

    /* ==============================
       SNAKE GAME
    ============================== */
    const canvas = document.getElementById('snake-game');
    const ctx = canvas.getContext('2d');
    const scoreElement = document.getElementById('snake-score');
    const startSnakeBtn = document.getElementById('start-snake');

    const gridSize = 15;
    const tileCount = canvas.width / gridSize;
    
    let snake = [];
    let food = {};
    let dx = 0;
    let dy = 0;
    let score = 0;
    let gameLoopTimeout;
    let isGameRunning = false;

    function resetSnakeGame() {
        snake = [{ x: 10, y: 10 }];
        food = { x: 5, y: 5 };
        dx = 0;
        dy = 0;
        score = 0;
        scoreElement.innerText = score;
        isGameRunning = true;
        clearTimeout(gameLoopTimeout);
        playSound('click'); // start sound
        drawSnakeGame();
    }

    function drawSnakeGame() {
        if (!isGameRunning) return;

        // Move snake
        if (dx !== 0 || dy !== 0) {
            const head = { x: snake[0].x + dx, y: snake[0].y + dy };
            
            // Wall collision wrap around
            if (head.x < 0) head.x = tileCount - 1;
            if (head.x >= tileCount) head.x = 0;
            if (head.y < 0) head.y = tileCount - 1;
            if (head.y >= tileCount) head.y = 0;

            // Self collision
            for (let i = 0; i < snake.length; i++) {
                if (snake[i].x === head.x && snake[i].y === head.y) {
                    isGameRunning = false;
                    playSound('die');
                    ctx.fillStyle = 'rgba(238, 85, 85, 0.8)';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    ctx.fillStyle = '#fff';
                    ctx.font = '24px Space Grotesk';
                    ctx.textAlign = 'center';
                    ctx.fillText('GAME OVER', canvas.width/2, canvas.height/2);
                    return;
                }
            }

            snake.unshift(head);

            // Eat food
            if (head.x === food.x && head.y === food.y) {
                score += 10;
                scoreElement.innerText = score;
                playSound('eat');
                food = {
                    x: Math.floor(Math.random() * tileCount),
                    y: Math.floor(Math.random() * tileCount)
                };
            } else {
                snake.pop();
            }
        }

        // Draw background
        ctx.fillStyle = '#222';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw food
        ctx.fillStyle = '#EE5555';
        ctx.fillRect(food.x * gridSize, food.y * gridSize, gridSize - 1, gridSize - 1);

        // Draw snake
        ctx.fillStyle = '#4CAF50';
        for (let i = 0; i < snake.length; i++) {
            ctx.fillRect(snake[i].x * gridSize, snake[i].y * gridSize, gridSize - 1, gridSize - 1);
        }

        gameLoopTimeout = setTimeout(drawSnakeGame, 100);
    }

    document.addEventListener('keydown', (e) => {
        if (!isGameRunning) return;
        if([37, 38, 39, 40].indexOf(e.keyCode) > -1) {
            e.preventDefault();
        }
        if (e.key === 'ArrowLeft' && dx !== 1) { dx = -1; dy = 0; }
        if (e.key === 'ArrowUp' && dy !== 1) { dx = 0; dy = -1; }
        if (e.key === 'ArrowRight' && dx !== -1) { dx = 1; dy = 0; }
        if (e.key === 'ArrowDown' && dy !== -1) { dx = 0; dy = 1; }
    });

    startSnakeBtn.addEventListener('click', resetSnakeGame);
    
    // Initial draw to show board
    ctx.fillStyle = '#222';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#4CAF50';
    ctx.font = '20px Space Grotesk';
    ctx.textAlign = 'center';
    ctx.fillText('CLICK START', canvas.width/2, canvas.height/2);


    /* ==============================
       TIC-TAC-TOE GAME
    ============================== */
    const tttCells = document.querySelectorAll('.ttt-cell');
    const resetTttBtn = document.getElementById('reset-ttt');
    const tttStatus = document.getElementById('ttt-status');
    let tttBoard = ['', '', '', '', '', '', '', '', ''];
    let currentPlayer = 'X';
    let tttActive = true;

    const winningConditions = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8],
        [0, 3, 6], [1, 4, 7], [2, 5, 8],
        [0, 4, 8], [2, 4, 6]
    ];

    function handleTttClick(e) {
        const cell = e.target;
        const index = parseInt(cell.getAttribute('data-index'));

        if (tttBoard[index] !== '' || !tttActive) return;

        playSound('boop');

        tttBoard[index] = currentPlayer;
        cell.innerText = currentPlayer;
        cell.style.color = currentPlayer === 'X' ? 'var(--green)' : 'var(--red)';

        checkTttWin();
    }

    function checkTttWin() {
        let roundWon = false;
        for (let i = 0; i < winningConditions.length; i++) {
            const [a, b, c] = winningConditions[i];
            if (tttBoard[a] && tttBoard[a] === tttBoard[b] && tttBoard[a] === tttBoard[c]) {
                roundWon = true;
                break;
            }
        }

        if (roundWon) {
            playSound('win');
            tttStatus.innerText = `P${currentPlayer==='X'?1:2} WINS`;
            tttStatus.style.backgroundColor = 'var(--red)';
            tttActive = false;
            return;
        }

        if (!tttBoard.includes('')) {
            playSound('die'); // A sad sound for draw
            tttStatus.innerText = 'DRAW';
            tttStatus.style.backgroundColor = '#ccc';
            tttActive = false;
            return;
        }

        currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
        tttStatus.innerText = `P${currentPlayer==='X'?1:2} TURN`;
    }

    function resetTttGame() {
        playSound('click');
        tttBoard = ['', '', '', '', '', '', '', '', ''];
        currentPlayer = 'X';
        tttActive = true;
        tttStatus.innerText = 'P1 TURN';
        tttStatus.style.backgroundColor = 'var(--yellow)';
        tttCells.forEach(cell => {
            cell.innerText = '';
        });
    }

    tttCells.forEach(cell => cell.addEventListener('click', handleTttClick));
    resetTttBtn.addEventListener('click', resetTttGame);
});

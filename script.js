// 音效和震动管理器
class SoundManager {
    constructor() {
        this.soundEnabled = true;
        this.vibrationEnabled = true;
        this.audioContext = null;
        this.sounds = {};
        
        this.init();
    }
    
    init() {
        // 检查浏览器支持
        this.vibrationSupported = 'vibrate' in navigator;
        this.audioSupported = 'AudioContext' in window || 'webkitAudioContext' in window;
        
        if (this.audioSupported) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        
        // 创建音效
        this.createSounds();
    }
    
    // 生成不同频率的音效
    createSounds() {
        this.sounds = {
            // 消除音效 - 清脆的音调
            eliminate: { frequency: 800, duration: 0.2, type: 'sine' },
            // 特殊方块音效 - 更低沉的音调
            special: { frequency: 400, duration: 0.3, type: 'sawtooth' },
            // 爆炸音效 - 噪音效果
            explosion: { frequency: 200, duration: 0.5, type: 'sawtooth' },
            // 交换音效 - 短促的音调
            swap: { frequency: 600, duration: 0.1, type: 'triangle' },
            // 失败音效 - 下降音调
            fail: { frequency: 300, duration: 0.3, type: 'square' },
            // 得分音效 - 上升音调
            score: { frequency: 1000, duration: 0.2, type: 'sine' },
            // 过关音效 - 和弦
            levelUp: { frequency: 523, duration: 0.8, type: 'sine' } // C5音符
        };
    }
    
    // 播放音效
    playSound(soundName) {
        if (!this.soundEnabled || !this.audioSupported || !this.audioContext) return;
        
        const sound = this.sounds[soundName];
        if (!sound) return;
        
        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.setValueAtTime(sound.frequency, this.audioContext.currentTime);
            oscillator.type = sound.type;
            
            // 音量包络
            gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.3, this.audioContext.currentTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + sound.duration);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + sound.duration);
        } catch (error) {
            console.log('音效播放失败:', error);
        }
    }
    
    // 播放特殊音效序列
    playSequence(soundName, count = 3) {
        if (!this.soundEnabled) return;
        
        for (let i = 0; i < count; i++) {
            setTimeout(() => {
                this.playSound(soundName);
            }, i * 100);
        }
    }
    
    // 播放上升音调
    playRiseSequence() {
        if (!this.soundEnabled) return;
        
        const frequencies = [523, 659, 784, 1047]; // C-E-G-C 和弦
        frequencies.forEach((freq, index) => {
            setTimeout(() => {
                this.playTone(freq, 0.3, 'sine');
            }, index * 200);
        });
    }
    
    // 播放自定义音调
    playTone(frequency, duration, type = 'sine') {
        if (!this.soundEnabled || !this.audioSupported || !this.audioContext) return;
        
        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
            oscillator.type = type;
            
            gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.2, this.audioContext.currentTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + duration);
        } catch (error) {
            console.log('音调播放失败:', error);
        }
    }
    
    // 震动效果
    vibrate(pattern) {
        if (!this.vibrationEnabled || !this.vibrationSupported) return;
        
        try {
            navigator.vibrate(pattern);
        } catch (error) {
            console.log('震动失败:', error);
        }
    }
    
    // 预设震动模式
    vibratePattern(type) {
        const patterns = {
            tap: [50], // 短震动
            match: [100, 50, 100], // 双震动
            explosion: [200, 100, 200, 100, 200], // 强烈震动
            fail: [300], // 长震动
            success: [50, 50, 50, 50, 50] // 连续短震动
        };
        
        this.vibrate(patterns[type] || [50]);
    }
    
    // 切换音效
    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        return this.soundEnabled;
    }
    
    // 切换震动
    toggleVibration() {
        this.vibrationEnabled = !this.vibrationEnabled;
        return this.vibrationEnabled;
    }
}

class CandyCrushGame {
    constructor() {
        this.boardSize = 6;
        this.colors = 6;
        this.board = [];
        this.score = 0;
        this.moves = 30;
        this.target = 1000;
        this.level = 1;
        this.selectedCell = null;
        this.gameRunning = false; // 初始为false，等待教程完成
        this.draggedCell = null;
        this.isProcessing = false;
        this.currentTutorialStep = 1;
        this.totalTutorialSteps = 4;
        
        // 初始化音效管理器
        this.soundManager = new SoundManager();
        
        // 魔性元素
        this.combo = 0; // 连击数
        this.maxCombo = 0; // 最大连击
        this.fever = false; // 狂热模式
        this.feverTimer = 0; // 狂热模式计时器
        this.crazyMode = false; // 疯狂模式
        this.lastMatchTime = 0; // 上次匹配时间
        
        this.init();
        this.initTutorial();
    }
    
    init() {
        this.createBoard();
        this.generateBoard();
        this.setupEventListeners();
        this.updateUI();
    }
    
    createBoard() {
        const gameBoard = document.getElementById('gameBoard');
        gameBoard.innerHTML = '';
        
        for (let i = 0; i < this.boardSize; i++) {
            this.board[i] = [];
            for (let j = 0; j < this.boardSize; j++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = i;
                cell.dataset.col = j;
                cell.addEventListener('click', (e) => this.handleCellClick(e));
                
                // 添加拖拽事件
                cell.draggable = true;
                cell.addEventListener('dragstart', (e) => this.handleDragStart(e));
                cell.addEventListener('dragover', (e) => this.handleDragOver(e));
                cell.addEventListener('dragenter', (e) => this.handleDragEnter(e));
                cell.addEventListener('dragleave', (e) => this.handleDragLeave(e));
                cell.addEventListener('drop', (e) => this.handleDrop(e));
                cell.addEventListener('dragend', (e) => this.handleDragEnd(e));
                gameBoard.appendChild(cell);
                this.board[i][j] = null;
            }
        }
    }
    
    generateBoard() {
        // 清除现有匹配，确保初始状态没有三连
        do {
            for (let i = 0; i < this.boardSize; i++) {
                for (let j = 0; j < this.boardSize; j++) {
                    this.board[i][j] = Math.floor(Math.random() * this.colors);
                }
            }
        } while (this.hasMatches());
        
        this.renderBoard();
    }
    
    renderBoard() {
        const cells = document.querySelectorAll('.cell');
        cells.forEach((cell, index) => {
            const row = Math.floor(index / this.boardSize);
            const col = index % this.boardSize;
            const value = this.board[row][col];
            
            // 保存当前的动画样式
            const currentTransform = cell.style.transform;
            const currentTransition = cell.style.transition;
            const currentOpacity = cell.style.opacity;
            
            cell.className = 'cell';
            if (value !== null) {
                if (value === 'bomb') {
                    cell.classList.add('bomb');
                } else if (value === 'rainbow') {
                    cell.classList.add('rainbow');
                } else if (typeof value === 'number') {
                    cell.classList.add(`color-${value}`);
                }
            }
            
            // 如果元素正在进行动画，保持其动画状态
            if (currentTransform) {
                cell.style.transform = currentTransform;
            }
            if (currentTransition) {
                cell.style.transition = currentTransition;
            }
            if (currentOpacity) {
                cell.style.opacity = currentOpacity;
            }
        });
    }
    
    handleCellClick(event) {
        if (!this.gameRunning || this.isProcessing) return;
        
        const row = parseInt(event.target.dataset.row);
        const col = parseInt(event.target.dataset.col);
        
        // 检查是否点击了特殊方块
        if (this.handleSpecialBlockClick(row, col)) {
            this.moves--;
            this.updateUI();
            this.checkGameEnd();
            return;
        }
        
        if (this.selectedCell === null) {
            // 选择第一个方块
            this.selectedCell = {row, col};
            event.target.classList.add('selected');
        } else {
            // 选择第二个方块
            const prevSelected = document.querySelector('.cell.selected');
            if (prevSelected) {
                prevSelected.classList.remove('selected');
            }
            
            if (this.selectedCell.row === row && this.selectedCell.col === col) {
                // 点击同一个方块，取消选择
                this.selectedCell = null;
                return;
            }
            
            // 检查是否相邻
            if (this.areAdjacent(this.selectedCell.row, this.selectedCell.col, row, col)) {
                this.swapCells(this.selectedCell.row, this.selectedCell.col, row, col);
                this.selectedCell = null;
            } else {
                // 不相邻，重新选择
                this.selectedCell = {row, col};
                event.target.classList.add('selected');
            }
        }
    }
    
    // 拖拽开始
    handleDragStart(event) {
        if (!this.gameRunning || this.isProcessing) return;
        
        const row = parseInt(event.target.dataset.row);
        const col = parseInt(event.target.dataset.col);
        this.draggedCell = {row, col, element: event.target};
        
        event.target.classList.add('dragging');
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/html', event.target.outerHTML);
    }
    
    // 拖拽经过
    handleDragOver(event) {
        if (!this.draggedCell) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }
    
    // 拖拽进入
    handleDragEnter(event) {
        if (!this.draggedCell) return;
        const row = parseInt(event.target.dataset.row);
        const col = parseInt(event.target.dataset.col);
        
        if (this.areAdjacent(this.draggedCell.row, this.draggedCell.col, row, col)) {
            event.target.classList.add('drag-over');
        }
    }
    
    // 拖拽离开
    handleDragLeave(event) {
        event.target.classList.remove('drag-over');
    }
    
    // 放置
    handleDrop(event) {
        if (!this.draggedCell) return;
        
        event.preventDefault();
        const row = parseInt(event.target.dataset.row);
        const col = parseInt(event.target.dataset.col);
        
        // 清除拖拽样式
        event.target.classList.remove('drag-over');
        
        // 检查是否是有效的放置位置（相邻）
        if (this.areAdjacent(this.draggedCell.row, this.draggedCell.col, row, col)) {
            this.swapCells(this.draggedCell.row, this.draggedCell.col, row, col);
        }
    }
    
    // 拖拽结束
    handleDragEnd(event) {
        if (this.draggedCell) {
            this.draggedCell.element.classList.remove('dragging');
            this.draggedCell = null;
        }
        
        // 清除所有拖拽相关样式
        document.querySelectorAll('.cell').forEach(cell => {
            cell.classList.remove('drag-over');
        });
    }
    
    areAdjacent(row1, col1, row2, col2) {
        const rowDiff = Math.abs(row1 - row2);
        const colDiff = Math.abs(col1 - col2);
        return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
    }
    
    swapCells(row1, col1, row2, col2) {
        // 每次交换都减少步数
        this.moves--;
        
        // 保存原始值
        const temp1 = this.board[row1][col1];
        const temp2 = this.board[row2][col2];
        
        // 交换方块
        this.board[row1][col1] = temp2;
        this.board[row2][col2] = temp1;
        
        // 添加交换动画
        this.animateSwap(row1, col1, row2, col2);
        
        // 播放交换音效
        this.soundManager.playSound('swap');
        this.soundManager.vibratePattern('tap');
        
        // 检查交换后是否有匹配
        if (this.hasMatches()) {
            setTimeout(() => {
                this.processMatches();
                this.updateUI();
            }, 300);
        } else {
            // 没有匹配，交换回来
            setTimeout(() => {
                this.board[row1][col1] = temp1;
                this.board[row2][col2] = temp2;
                this.renderBoard();
                // 添加失败反馈动画和音效
                this.animateFailedSwap(row1, col1, row2, col2);
                this.soundManager.playSound('fail');
                this.soundManager.vibratePattern('fail');
            }, 300);
        }
        
        this.renderBoard();
        this.updateUI();
        this.checkGameEnd();
    }
    
    hasMatches() {
        return this.findMatches().length > 0;
    }
    
    findMatches() {
        const matches = [];
        
        // 检查水平匹配
        for (let i = 0; i < this.boardSize; i++) {
            let count = 1;
            let currentColor = this.board[i][0];
            if (typeof currentColor !== 'number') {
                currentColor = null;
            }
            
            for (let j = 1; j < this.boardSize; j++) {
                if (this.board[i][j] === currentColor && currentColor !== null && 
                    typeof currentColor === 'number') {
                    count++;
                } else {
                    if (count >= 3) {
                        for (let k = j - count; k < j; k++) {
                            matches.push({row: i, col: k});
                        }
                    }
                    count = 1;
                    currentColor = this.board[i][j];
                    if (typeof currentColor !== 'number') {
                        currentColor = null;
                    }
                }
            }
            
            if (count >= 3) {
                for (let k = this.boardSize - count; k < this.boardSize; k++) {
                    matches.push({row: i, col: k});
                }
            }
        }
        
        // 检查垂直匹配
        for (let j = 0; j < this.boardSize; j++) {
            let count = 1;
            let currentColor = this.board[0][j];
            if (typeof currentColor !== 'number') {
                currentColor = null;
            }
            
            for (let i = 1; i < this.boardSize; i++) {
                if (this.board[i][j] === currentColor && currentColor !== null && 
                    typeof currentColor === 'number') {
                    count++;
                } else {
                    if (count >= 3) {
                        for (let k = i - count; k < i; k++) {
                            matches.push({row: k, col: j});
                        }
                    }
                    count = 1;
                    currentColor = this.board[i][j];
                    if (typeof currentColor !== 'number') {
                        currentColor = null;
                    }
                }
            }
            
            if (count >= 3) {
                for (let k = this.boardSize - count; k < this.boardSize; k++) {
                    matches.push({row: k, col: j});
                }
            }
        }
        
        return matches;
    }
    
    processMatches() {
        this.isProcessing = true;
        let matches = this.findMatches();
        
        if (matches.length > 0) {
            // 更新连击系统
            this.updateCombo(matches.length);
            
            // 随机触发彩蛋
            this.triggerRandomEasterEgg();
            
            // 检查是否需要创建特殊方块
            const specialType = this.checkForSpecialBlocks(matches);
            
            // 计算分数（狂热模式有加成）
            let baseScore = matches.length * 15;
            if (this.fever) {
                baseScore *= 2; // 狂热模式双倍分数
            }
            const sizeBonus = matches.length > 5 ? matches.length * 10 : 0;
            this.score += baseScore + sizeBonus;
            
            // 显示分数动画
            this.animateScoreUpdate(this.score);
            
            // 显示消除动画和粒子效果
            this.animateMatches(matches);
            
            // 如果创建了特殊方块，从匹配中移除该位置
            if (specialType) {
                const centerMatch = matches[Math.floor(matches.length / 2)];
                matches = matches.filter(match => 
                    !(match.row === centerMatch.row && match.col === centerMatch.col)
                );
            }
            
            // 等待动画完成后处理
            setTimeout(() => {
                // 移除匹配的方块
                matches.forEach(match => {
                    this.board[match.row][match.col] = null;
                });
                
                // 先让现有方块下落，再填补新方块
                this.animateGravity().then(() => {
                    this.fillNewBlocksFromTop().then(() => {
                        // 递归处理新的匹配
                        setTimeout(() => {
                            this.processMatches();
                        }, 200);
                    });
                });
                
            }, 300); // 进一步减少延迟
        } else {
            this.isProcessing = false;
            // 如果没有匹配，重置连击
            this.resetCombo();
        }
    }
    
    animateMatches(matches) {
        // 播放消除音效和震动
        this.soundManager.playSound('eliminate');
        this.soundManager.vibratePattern('match');
        
        matches.forEach(match => {
            const cellIndex = match.row * this.boardSize + match.col;
            const cell = document.querySelectorAll('.cell')[cellIndex];
            cell.classList.add('removing');
            
            // 添加粒子效果
            this.createParticleEffect(cell, this.board[match.row][match.col]);
        });
    }
    
    // 创建粒子效果
    createParticleEffect(cell, colorIndex) {
        const rect = cell.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        // 创建更多粒子，效果更明显
        for (let i = 0; i < 12; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle explode';
            
            // 设置粒子颜色和大小
            const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#a55eea'];
            particle.style.background = colors[colorIndex] || '#ccc';
            particle.style.width = (4 + Math.random() * 4) + 'px';
            particle.style.height = particle.style.width;
            particle.style.borderRadius = '50%';
            particle.style.boxShadow = `0 0 10px ${colors[colorIndex] || '#ccc'}`;
            
            // 随机方向和距离
            const angle = (i / 12) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
            const distance = 60 + Math.random() * 50;
            const dx = Math.cos(angle) * distance;
            const dy = Math.sin(angle) * distance;
            
            particle.style.setProperty('--dx', dx + 'px');
            particle.style.setProperty('--dy', dy + 'px');
            
            // 设置初始位置
            particle.style.left = centerX + 'px';
            particle.style.top = centerY + 'px';
            
            document.body.appendChild(particle);
            
            // 移除粒子
            setTimeout(() => {
                if (particle.parentNode) {
                    particle.parentNode.removeChild(particle);
                }
            }, 1200);
        }
    }
    
    // 交换动画
    animateSwap(row1, col1, row2, col2) {
        const cellIndex1 = row1 * this.boardSize + col1;
        const cellIndex2 = row2 * this.boardSize + col2;
        const cells = document.querySelectorAll('.cell');
        
        cells[cellIndex1].classList.add('swapping');
        cells[cellIndex2].classList.add('swapping');
        
        setTimeout(() => {
            cells[cellIndex1].classList.remove('swapping');
            cells[cellIndex2].classList.remove('swapping');
        }, 500);
    }
    
    // 失败交换动画
    animateFailedSwap(row1, col1, row2, col2) {
        const cellIndex1 = row1 * this.boardSize + col1;
        const cellIndex2 = row2 * this.boardSize + col2;
        const cells = document.querySelectorAll('.cell');
        
        // 添加摇摆动画表示失败
        cells[cellIndex1].style.animation = 'shake 0.5s ease-in-out';
        cells[cellIndex2].style.animation = 'shake 0.5s ease-in-out';
        
        setTimeout(() => {
            cells[cellIndex1].style.animation = '';
            cells[cellIndex2].style.animation = '';
        }, 500);
    }
    
    // 重力动画
    animateGravity() {
        return new Promise((resolve) => {
            // 记录下落前的状态
            const beforeState = this.board.map(row => [...row]);
            
            // 应用重力，计算移动
            const movements = this.calculateGravityMovements();
            
            if (movements.length === 0) {
                resolve();
                return;
            }
            
            // 执行移动动画
            this.animateMovements(movements).then(() => {
                // 更新棋盘状态
                this.applyGravity();
                this.renderBoard();
                resolve();
            });
        });
    }
    
    // 计算重力移动
    calculateGravityMovements() {
        const movements = [];
        
        for (let j = 0; j < this.boardSize; j++) {
            let writePos = this.boardSize - 1;
            
            // 从底部开始处理
            for (let i = this.boardSize - 1; i >= 0; i--) {
                if (this.board[i][j] !== null) {
                    if (i !== writePos) {
                        // 记录移动
                        movements.push({
                            fromRow: i,
                            toRow: writePos,
                            col: j,
                            value: this.board[i][j]
                        });
                    }
                    writePos--;
                }
            }
        }
        
        return movements;
    }
    
    // 执行移动动画 - 逐格子下落
    animateMovements(movements) {
        return new Promise((resolve) => {
            if (movements.length === 0) {
                resolve();
                return;
            }
            
            const cells = document.querySelectorAll('.cell');
            let activeAnimations = 0;
            
            movements.forEach(movement => {
                const fromIndex = movement.fromRow * this.boardSize + movement.col;
                const fromCell = cells[fromIndex];
                
                if (fromCell) {
                    activeAnimations++;
                    
                    // 创建临时动画元素
                    const fromRect = fromCell.getBoundingClientRect();
                    const animElement = fromCell.cloneNode(true);
                    animElement.style.position = 'absolute';
                    animElement.style.left = fromRect.left + 'px';
                    animElement.style.top = fromRect.top + 'px';
                    animElement.style.width = fromRect.width + 'px';
                    animElement.style.height = fromRect.height + 'px';
                    animElement.style.zIndex = '1000';
                    animElement.style.pointerEvents = 'none';
                    
                    document.body.appendChild(animElement);
                    fromCell.style.opacity = '0';
                    
                    // 逐格子下落动画
                    this.animateStepByStepFall(animElement, movement, () => {
                        // 动画完成回调
                        if (animElement.parentNode) {
                            animElement.parentNode.removeChild(animElement);
                        }
                        fromCell.style.opacity = '';
                        
                        activeAnimations--;
                        if (activeAnimations === 0) {
                            resolve();
                        }
                    });
                }
            });
        });
    }
    
    // 逐格子下落动画
    animateStepByStepFall(element, movement, callback) {
        const cellSize = this.getStandardCellSize();
        const totalSteps = movement.toRow - movement.fromRow;
        let currentStep = 0;
        
        // 获取目标位置
        const cells = document.querySelectorAll('.cell');
        const targetIndex = movement.toRow * this.boardSize + movement.col;
        const targetCell = cells[targetIndex];
        const targetRect = targetCell.getBoundingClientRect();
        const startRect = element.getBoundingClientRect();
        const finalOffsetY = targetRect.top - startRect.top;
        
        const animateNextStep = () => {
            if (currentStep >= totalSteps) {
                // 直接移动到最终精确位置
                element.style.transition = 'transform 0.15s ease-out';
                element.style.transform = `translateY(${finalOffsetY}px)`;
                
                setTimeout(() => {
                    callback();
                }, 150);
                return;
            }
            
            currentStep++;
            // 使用精确的步长计算
            const stepOffsetY = (finalOffsetY / totalSteps) * currentStep;
            
            // 每一格的下落动画
            element.style.transition = 'transform 0.15s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
            element.style.transform = `translateY(${stepOffsetY}px)`;
            
            // 递归调用下一步
            setTimeout(animateNextStep, 150);
        };
        
        // 开始第一步
        setTimeout(animateNextStep, 10);
    }
    
    // 获取标准格子尺寸
    getStandardCellSize() {
        const cells = document.querySelectorAll('.cell');
        if (cells.length > 0) {
            const sampleCell = cells[0];
            return {
                width: sampleCell.offsetWidth,
                height: sampleCell.offsetHeight,
                gap: 6 // 预设的间隙
            };
        }
        return { width: 90, height: 90, gap: 6 }; // 默认值
    }
    
    // 应用重力效果
    applyGravity() {
        for (let j = 0; j < this.boardSize; j++) {
            // 从底部开始处理每一列
            let writePos = this.boardSize - 1;
            
            for (let i = this.boardSize - 1; i >= 0; i--) {
                if (this.board[i][j] !== null) {
                    if (i !== writePos) {
                        this.board[writePos][j] = this.board[i][j];
                        this.board[i][j] = null;
                    }
                    writePos--;
                }
            }
        }
    }
    
    // 带动画的填充棋盘
    fillBoardWithAnimation() {
        return new Promise((resolve) => {
            const newCells = [];
            let maxDelay = 0;
            
            // 按列处理，每列从顶部依次填充
            for (let j = 0; j < this.boardSize; j++) {
                const emptyPositions = [];
                
                // 找到这一列的所有空位
                for (let i = 0; i < this.boardSize; i++) {
                    if (this.board[i][j] === null) {
                        emptyPositions.push(i);
                    }
                }
                
                // 为每个空位从顶部依次掉落方块
                emptyPositions.forEach((targetRow, index) => {
                    this.board[targetRow][j] = Math.floor(Math.random() * this.colors);
                    
                    const delay = index * 80; // 每个方块之间80ms延迟，加快速度
                    maxDelay = Math.max(maxDelay, delay);
                    
                    newCells.push({
                        row: targetRow,
                        col: j,
                        delay: delay,
                        fallDistance: (targetRow + 1) // 从棋盘顶端掉落的距离
                    });
                });
            }
            
            // 先更新棋盘显示
            this.renderBoard();
            
            // 为新方块添加从顶端掉落的动画
            newCells.forEach(({row, col, delay, fallDistance}) => {
                setTimeout(() => {
                    const cellIndex = row * this.boardSize + col;
                    const cell = document.querySelectorAll('.cell')[cellIndex];
                    
                    if (cell) {
                        // 计算从顶端掉落的距离
                        const dropDistance = fallDistance * (cell.offsetHeight + 6); // 6px是gap间距
                        
                        // 设置初始位置在棋盘顶端上方
                        cell.style.transform = `translateY(-${dropDistance}px)`;
                        cell.style.transition = 'none';
                        
                        // 触发掉落动画
                        requestAnimationFrame(() => {
                            cell.style.transition = 'transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
                            cell.style.transform = 'translateY(0)';
                            
                            // 添加轻微的弹跳效果
                            setTimeout(() => {
                                cell.style.transition = 'transform 0.2s ease-out';
                                cell.style.transform = 'translateY(-5px)';
                                
                                setTimeout(() => {
                                    cell.style.transition = 'transform 0.2s ease-out';
                                    cell.style.transform = 'translateY(0)';
                                    
                                    // 平滑清理样式 - 避免闪烁
                                    setTimeout(() => {
                                        cell.style.transition = 'all 0.1s ease-out';
                                        cell.style.transform = 'translateY(0)';
                                        
                                        setTimeout(() => {
                                            cell.style.transition = '';
                                            cell.style.transform = '';
                                        }, 100);
                                    }, 200);
                                }, 100);
                            }, 500);
                        });
                    }
                }, delay);
            });
            
            // 等待所有动画完成
            setTimeout(() => {
                resolve();
            }, maxDelay + 800);
        });
    }
    
    // 只为新方块添加从顶端逐格子掉落的动画
    fillNewBlocksFromTop() {
        return new Promise((resolve) => {
            const newBlocks = [];
            
            // 找到所有空缺并生成新方块
            for (let j = 0; j < this.boardSize; j++) {
                for (let i = this.boardSize - 1; i >= 0; i--) { // 从下到上检查
                    if (this.board[i][j] === null) {
                        this.board[i][j] = Math.floor(Math.random() * this.colors);
                        newBlocks.push({
                            row: i,
                            col: j,
                            priority: (this.boardSize - 1 - i) // 越下面的优先级越高
                        });
                    }
                }
            }
            
            if (newBlocks.length === 0) {
                resolve();
                return;
            }
            
            // 按优先级排序，让下面的方块先掉落
            newBlocks.sort((a, b) => b.priority - a.priority);
            
            // 更新显示
            this.renderBoard();
            
            let activeAnimations = 0;
            
            // 为新方块创建从顶端逐格子掉落的动画
            newBlocks.forEach((block, index) => {
                const delay = index * 100; // 每个新方块延迟100ms
                
                setTimeout(() => {
                    activeAnimations++;
                    const cellIndex = block.row * this.boardSize + block.col;
                    const cell = document.querySelectorAll('.cell')[cellIndex];
                    
                    if (cell) {
                        // 创建临时动画元素
                        const rect = cell.getBoundingClientRect();
                        const animElement = cell.cloneNode(true);
                        animElement.style.position = 'absolute';
                        animElement.style.left = rect.left + 'px';
                        animElement.style.top = rect.top + 'px';
                        animElement.style.width = rect.width + 'px';
                        animElement.style.height = rect.height + 'px';
                        animElement.style.zIndex = '1000';
                        animElement.style.pointerEvents = 'none';
                        
                        // 设置初始位置在顶端上方
                        const cellSize = this.getStandardCellSize();
                        const initialOffset = (block.row + 1) * (cellSize.height + cellSize.gap);
                        animElement.style.top = (rect.top - initialOffset) + 'px';
                        
                        document.body.appendChild(animElement);
                        cell.style.opacity = '0';
                        
                        // 逐格子下落到最终位置
                        this.animateNewBlockStepByStep(animElement, block.row + 1, () => {
                            // 动画完成回调
                            if (animElement.parentNode) {
                                animElement.parentNode.removeChild(animElement);
                            }
                            cell.style.opacity = '';
                            
                            activeAnimations--;
                            if (activeAnimations === 0) {
                                resolve();
                            }
                        });
                    } else {
                        activeAnimations--;
                        if (activeAnimations === 0) {
                            resolve();
                        }
                    }
                }, delay);
            });
            
            // 如果没有动画，直接完成
            if (newBlocks.length === 0 || activeAnimations === 0) {
                resolve();
            }
        });
    }
    
    // 新方块逐格子下落动画
    animateNewBlockStepByStep(element, totalSteps, callback) {
        let currentStep = 0;
        
        // 计算精确的目标位置（当前元素的初始top + 需要移动的距离）
        const initialTop = parseFloat(element.style.top);
        const cellSize = this.getStandardCellSize();
        const finalOffsetY = totalSteps * (cellSize.height + cellSize.gap);
        
        const animateNextStep = () => {
            if (currentStep >= totalSteps) {
                // 直接移动到最终精确位置，不偏移
                element.style.transition = 'transform 0.15s ease-out';
                element.style.top = (initialTop + finalOffsetY) + 'px';
                element.style.transform = 'translateY(0px)';
                
                setTimeout(() => {
                    callback();
                }, 150);
                return;
            }
            
            currentStep++;
            // 计算当前步骤应该到达的位置
            const stepY = (finalOffsetY / totalSteps) * currentStep;
            
            // 每一格的下落动画
            element.style.transition = 'transform 0.12s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
            element.style.transform = `translateY(${stepY}px)`;
            
            // 递归调用下一步
            setTimeout(animateNextStep, 120);
        };
        
        // 开始第一步
        setTimeout(animateNextStep, 10);
    }
    
    // 屏幕震动效果
    createScreenShake() {
        const gameContainer = document.querySelector('.game-container');
        gameContainer.style.animation = 'screenShake 0.5s ease-in-out';
        
        setTimeout(() => {
            gameContainer.style.animation = '';
        }, 500);
    }
    
    // 创建魔性文字效果
    createCrazyText(text, x, y, color = '#ff6b6b') {
        const textElement = document.createElement('div');
        textElement.textContent = text;
        textElement.style.position = 'absolute';
        textElement.style.left = x + 'px';
        textElement.style.top = y + 'px';
        textElement.style.color = color;
        textElement.style.fontSize = '32px';
        textElement.style.fontWeight = 'bold';
        textElement.style.pointerEvents = 'none';
        textElement.style.zIndex = '2000';
        textElement.style.textShadow = '0 0 10px rgba(255, 255, 255, 0.8)';
        textElement.style.animation = 'crazyTextFloat 2s ease-out forwards';
        
        document.body.appendChild(textElement);
        
        setTimeout(() => {
            if (textElement.parentNode) {
                textElement.parentNode.removeChild(textElement);
            }
        }, 2000);
    }
    
    // 更新连击系统
    updateCombo(matchCount) {
        this.combo++;
        this.maxCombo = Math.max(this.maxCombo, this.combo);
        this.lastMatchTime = Date.now();
        
        // 连击奖励分数
        const comboBonus = this.combo * 50;
        this.score += comboBonus;
        
        // 连击音效
        if (this.combo >= 3) {
            this.soundManager.playSequence('score', Math.min(this.combo, 5));
            this.soundManager.vibratePattern('success');
            
            // 创建连击文字效果
            const gameBoard = document.getElementById('gameBoard');
            const rect = gameBoard.getBoundingClientRect();
            const x = rect.left + rect.width / 2 - 100;
            const y = rect.top + rect.height / 2;
            
            this.createCrazyText(`${this.combo}连击! +${comboBonus}`, x, y, '#ffaa00');
        }
        
        // 进入狂热模式
        if (this.combo >= 5 && !this.fever) {
            this.enterFeverMode();
        }
        
        // 疯狂模式
        if (this.combo >= 10) {
            this.enterCrazyMode();
        }
    }
    
    // 狂热模式
    enterFeverMode() {
        this.fever = true;
        this.feverTimer = Date.now() + 10000; // 10秒狂热模式
        
        // 特殊音效
        this.soundManager.playRiseSequence();
        this.soundManager.vibratePattern('explosion');
        
        // 视觉效果
        const gameBoard = document.getElementById('gameBoard');
        gameBoard.style.animation = 'feverMode 10s linear';
        
        // 狂热模式文字
        const rect = gameBoard.getBoundingClientRect();
        this.createCrazyText('🔥 FEVER TIME! 🔥', rect.left + rect.width / 2 - 120, rect.top - 50, '#ff1744');
        
        setTimeout(() => {
            this.fever = false;
            gameBoard.style.animation = '';
        }, 10000);
    }
    
    // 疯狂模式
    enterCrazyMode() {
        if (this.crazyMode) return;
        
        this.crazyMode = true;
        
        // 疯狂音效
        this.soundManager.playSequence('explosion', 3);
        this.soundManager.vibratePattern('explosion');
        
        // 屏幕闪烁
        document.body.style.animation = 'crazyFlash 2s ease-in-out';
        
        // 疯狂模式文字
        const gameBoard = document.getElementById('gameBoard');
        const rect = gameBoard.getBoundingClientRect();
        this.createCrazyText('💥 CRAZY MODE! 💥', rect.left + rect.width / 2 - 150, rect.top - 80, '#ff0066');
        
        // 临时增加分数倍数
        const originalScore = this.score;
        this.score *= 2;
        this.animateScoreUpdate(this.score);
        
        setTimeout(() => {
            this.crazyMode = false;
            document.body.style.animation = '';
        }, 3000);
    }
    
    // 重置连击
    resetCombo() {
        this.combo = 0;
    }
    
    // 随机彩蛋事件
    triggerRandomEasterEgg() {
        const random = Math.random();
        
        if (random < 0.1) { // 10%概率
            // 黄金雨效果
            this.createGoldenRain();
        } else if (random < 0.15) { // 5%概率
            // 全屏爆炸
            this.createMegaExplosion();
        } else if (random < 0.2) { // 5%概率
            // 时间加速
            this.createTimeWarp();
        }
    }
    
    // 黄金雨效果
    createGoldenRain() {
        this.soundManager.playRiseSequence();
        this.createCrazyText('💰 GOLDEN RAIN! 💰', window.innerWidth / 2 - 150, 100, '#ffd700');
        
        for (let i = 0; i < 20; i++) {
            setTimeout(() => {
                const coin = document.createElement('div');
                coin.textContent = '💰';
                coin.style.position = 'fixed';
                coin.style.left = Math.random() * window.innerWidth + 'px';
                coin.style.top = '-50px';
                coin.style.fontSize = '24px';
                coin.style.zIndex = '3000';
                coin.style.animation = 'coinFall 3s linear forwards';
                coin.style.pointerEvents = 'none';
                
                document.body.appendChild(coin);
                
                setTimeout(() => {
                    if (coin.parentNode) {
                        coin.parentNode.removeChild(coin);
                    }
                }, 3000);
            }, i * 100);
        }
        
        this.score += 500;
        this.animateScoreUpdate(this.score);
    }
    
    // 全屏爆炸
    createMegaExplosion() {
        this.soundManager.playSequence('explosion', 5);
        this.soundManager.vibratePattern('explosion');
        this.createScreenShake();
        
        this.createCrazyText('💥 MEGA BOOM! 💥', window.innerWidth / 2 - 150, 150, '#ff4444');
        
        // 创建多个爆炸波
        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                const x = Math.random() * window.innerWidth;
                const y = Math.random() * window.innerHeight;
                this.createExplosionWave(null, null, x, y);
            }, i * 200);
        }
    }
    
    // 时间加速
    createTimeWarp() {
        this.createCrazyText('⚡ TIME WARP! ⚡', window.innerWidth / 2 - 140, 200, '#00ffff');
        
        // 临时加速动画
        const style = document.createElement('style');
        style.textContent = `
            .time-warp * {
                animation-duration: 0.1s !important;
                transition-duration: 0.1s !important;
            }
        `;
        document.head.appendChild(style);
        document.body.classList.add('time-warp');
        
        setTimeout(() => {
            document.body.classList.remove('time-warp');
            document.head.removeChild(style);
        }, 2000);
    }
    
    dropCells() {
        for (let j = 0; j < this.boardSize; j++) {
            // 从底部开始处理每一列
            let writePos = this.boardSize - 1;
            
            for (let i = this.boardSize - 1; i >= 0; i--) {
                if (this.board[i][j] !== null) {
                    if (i !== writePos) {
                        this.board[writePos][j] = this.board[i][j];
                        this.board[i][j] = null;
                    }
                    writePos--;
                }
            }
        }
    }
    
    fillBoard() {
        for (let j = 0; j < this.boardSize; j++) {
            for (let i = 0; i < this.boardSize; i++) {
                if (this.board[i][j] === null) {
                    this.board[i][j] = Math.floor(Math.random() * this.colors);
                }
            }
        }
    }
    
    updateUI() {
        document.getElementById('level').textContent = this.level;
        document.getElementById('score').textContent = this.score;
        document.getElementById('moves').textContent = this.moves;
        document.getElementById('target').textContent = this.target;
        
        // 移除所有特殊样式
        document.querySelectorAll('.cell').forEach(cell => {
            cell.classList.remove('removing', 'falling', 'selected', 'highlight');
        });
    }
    
    // 分数高亮动画
    animateScoreUpdate(newScore) {
        const scoreElement = document.getElementById('score');
        const scoreContainer = scoreElement.closest('.score-item');
        
        // 播放得分音效
        this.soundManager.playSound('score');
        
        // 添加高亮效果
        scoreContainer.classList.add('highlight');
        
        // 动画更新分数
        const startScore = parseInt(scoreElement.textContent);
        const duration = 400; // 减少动画时间
        const startTime = Date.now();
        
        const updateScore = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // 使用更快的缓动函数
            const easeOut = 1 - Math.pow(1 - progress, 2);
            const currentScore = Math.floor(startScore + (newScore - startScore) * easeOut);
            
            scoreElement.textContent = currentScore;
            
            if (progress < 1) {
                requestAnimationFrame(updateScore);
            } else {
                // 移除高亮效果
                setTimeout(() => {
                    scoreContainer.classList.remove('highlight');
                }, 150);
            }
        };
        
        updateScore();
    }
    
    checkGameEnd() {
        if (this.moves <= 0) {
            this.gameRunning = false;
            if (this.score >= this.target) {
                this.nextLevel();
            } else {
                this.showGameOverModal('游戏结束', `很遗憾，没有达到目标分数。\n最终得分：${this.score}\n目标分数：${this.target}\n当前关卡：第${this.level}关`);
            }
        } else if (this.score >= this.target) {
            this.nextLevel();
        }
    }
    
    // 进入下一关
    nextLevel() {
        this.level++;
        this.target = this.calculateTarget(this.level);
        this.moves = this.calculateMoves(this.level);
        
        // 播放过关音效和震动
        this.soundManager.playRiseSequence();
        this.soundManager.vibratePattern('success');
        
        // 显示过关信息
        const message = `🎉 恭喜过关！\n\n✨ 进入第 ${this.level} 关\n🎯 新目标：${this.target} 分\n👣 可用步数：${this.moves} 步\n📊 当前得分：${this.score} 分`;
        
        this.showGameOverModal(`第 ${this.level - 1} 关完成！`, message, '进入下一关');
    }
    
    // 计算关卡目标分数
    calculateTarget(level) {
        // 每关目标分数递增：1000, 1500, 2200, 3000, 4000, 5200, 6600, 8200...
        if (level <= 1) return 1000;
        return Math.floor(1000 * level + 500 * (level - 1) * (level - 1) * 0.5);
    }
    
    // 计算关卡步数
    calculateMoves(level) {
        // 根据关卡调整步数：第1关30步，后续逐渐增加
        const baseMoves = 30;
        const extraMoves = Math.floor((level - 1) * 2); // 每关增加2步
        return Math.min(baseMoves + extraMoves, 50); // 最多50步
    }
    
    showGameOverModal(title, message, buttonText = '再来一局') {
        document.getElementById('gameOverTitle').textContent = title;
        document.getElementById('gameOverMessage').textContent = message;
        document.getElementById('playAgainBtn').textContent = buttonText;
        document.getElementById('gameOverModal').classList.add('show');
    }
    
    hideGameOverModal() {
        document.getElementById('gameOverModal').classList.remove('show');
    }
    
    newGame() {
        // 检查当前按钮文字来决定是新游戏还是继续下一关
        const buttonText = document.getElementById('playAgainBtn').textContent;
        
        if (buttonText === '进入下一关') {
            this.continueGame();
        } else {
            this.restartGame();
        }
    }
    
    // 继续下一关
    continueGame() {
        this.selectedCell = null;
        this.gameRunning = true;
        this.isProcessing = false;
        this.draggedCell = null;
        this.hideGameOverModal();
        this.generateBoard();
        this.updateUI();
    }
    
    // 完全重新开始
    restartGame() {
        this.score = 0;
        this.moves = 30;
        this.target = 1000;
        this.level = 1;
        this.selectedCell = null;
        this.gameRunning = true;
        this.isProcessing = false;
        this.draggedCell = null;
        this.hideGameOverModal();
        this.generateBoard();
        this.updateUI();
    }
    
    shuffle() {
        if (!this.gameRunning || this.moves <= 0) return;
        
        // 重新生成棋盘，确保没有初始匹配
        do {
            for (let i = 0; i < this.boardSize; i++) {
                for (let j = 0; j < this.boardSize; j++) {
                    this.board[i][j] = Math.floor(Math.random() * this.colors);
                }
            }
        } while (this.hasMatches());
        
        this.moves--; // 洗牌消耗一步
        this.renderBoard();
        this.updateUI();
        this.checkGameEnd();
    }
    
    getHint() {
        if (!this.gameRunning) return;
        
        // 简单的提示：找到第一个可能的匹配
        for (let i = 0; i < this.boardSize; i++) {
            for (let j = 0; j < this.boardSize; j++) {
                // 检查右方交换
                if (j < this.boardSize - 1) {
                    const temp = this.board[i][j];
                    this.board[i][j] = this.board[i][j + 1];
                    this.board[i][j + 1] = temp;
                    
                    if (this.hasMatches()) {
                        // 恢复原状态
                        this.board[i][j + 1] = this.board[i][j];
                        this.board[i][j] = temp;
                        
                        // 高亮提示方块
                        const cellIndex1 = i * this.boardSize + j;
                        const cellIndex2 = i * this.boardSize + (j + 1);
                        const cells = document.querySelectorAll('.cell');
                        
                        cells[cellIndex1].classList.add('highlight');
                        cells[cellIndex2].classList.add('highlight');
                        
                        setTimeout(() => {
                            cells[cellIndex1].classList.remove('highlight');
                            cells[cellIndex2].classList.remove('highlight');
                        }, 2000);
                        
                        return;
                    }
                    
                    // 恢复原状态
                    this.board[i][j + 1] = this.board[i][j];
                    this.board[i][j] = temp;
                }
                
                // 检查下方交换
                if (i < this.boardSize - 1) {
                    const temp = this.board[i][j];
                    this.board[i][j] = this.board[i + 1][j];
                    this.board[i + 1][j] = temp;
                    
                    if (this.hasMatches()) {
                        // 恢复原状态
                        this.board[i + 1][j] = this.board[i][j];
                        this.board[i][j] = temp;
                        
                        // 高亮提示方块
                        const cellIndex1 = i * this.boardSize + j;
                        const cellIndex2 = (i + 1) * this.boardSize + j;
                        const cells = document.querySelectorAll('.cell');
                        
                        cells[cellIndex1].classList.add('highlight');
                        cells[cellIndex2].classList.add('highlight');
                        
                        setTimeout(() => {
                            cells[cellIndex1].classList.remove('highlight');
                            cells[cellIndex2].classList.remove('highlight');
                        }, 2000);
                        
                        return;
                    }
                    
                    // 恢复原状态
                    this.board[i + 1][j] = this.board[i][j];
                    this.board[i][j] = temp;
                }
            }
        }
    }
    
    setupEventListeners() {
        document.getElementById('newGameBtn').addEventListener('click', () => this.newGame());
        document.getElementById('shuffleBtn').addEventListener('click', () => this.shuffle());
        document.getElementById('hintBtn').addEventListener('click', () => this.getHint());
        document.getElementById('playAgainBtn').addEventListener('click', () => this.newGame());
        document.getElementById('showTutorialBtn').addEventListener('click', () => this.showTutorial());
        
        // 点击模态框外部关闭
        document.getElementById('gameOverModal').addEventListener('click', (e) => {
            if (e.target.id === 'gameOverModal') {
                this.hideGameOverModal();
            }
        });
    }
    
    // 教程系统
    initTutorial() {
        document.getElementById('nextStepBtn').addEventListener('click', () => this.nextTutorialStep());
        document.getElementById('prevStepBtn').addEventListener('click', () => this.prevTutorialStep());
        document.getElementById('skipTutorialBtn').addEventListener('click', () => this.skipTutorial());
        document.getElementById('startGameBtn').addEventListener('click', () => this.startGame());
        
        this.updateTutorialProgress();
    }
    
    nextTutorialStep() {
        if (this.currentTutorialStep < this.totalTutorialSteps) {
            this.currentTutorialStep++;
            this.updateTutorialStep();
            this.updateTutorialProgress();
        }
    }
    
    prevTutorialStep() {
        if (this.currentTutorialStep > 1) {
            this.currentTutorialStep--;
            this.updateTutorialStep();
            this.updateTutorialProgress();
        }
    }
    
    updateTutorialStep() {
        const steps = document.querySelectorAll('.tutorial-step');
        steps.forEach((step, index) => {
            step.classList.remove('active', 'prev');
            if (index + 1 === this.currentTutorialStep) {
                step.classList.add('active');
            } else if (index + 1 < this.currentTutorialStep) {
                step.classList.add('prev');
            }
        });
        
        // 更新按钮状态
        document.getElementById('prevStepBtn').disabled = this.currentTutorialStep === 1;
        
        if (this.currentTutorialStep === this.totalTutorialSteps) {
            document.getElementById('nextStepBtn').style.display = 'none';
            document.getElementById('startGameBtn').style.display = 'block';
        } else {
            document.getElementById('nextStepBtn').style.display = 'block';
            document.getElementById('startGameBtn').style.display = 'none';
        }
    }
    
    updateTutorialProgress() {
        const progress = (this.currentTutorialStep / this.totalTutorialSteps) * 100;
        document.getElementById('tutorialProgress').style.width = progress + '%';
        document.getElementById('currentStep').textContent = this.currentTutorialStep;
    }
    
    skipTutorial() {
        this.hideTutorial();
        this.gameRunning = true;
        this.updateUI();
    }
    
    startGame() {
        this.hideTutorial();
        this.gameRunning = true;
        this.updateUI();
    }
    
    showTutorial() {
        this.currentTutorialStep = 1;
        this.updateTutorialStep();
        this.updateTutorialProgress();
        document.getElementById('tutorialModal').classList.add('show');
    }
    
    hideTutorial() {
        document.getElementById('tutorialModal').classList.remove('show');
    }
    
    // 特殊道具系统
    checkForSpecialBlocks(matches) {
        const matchCount = matches.length;
        
        if (matchCount >= 5) {
            // 创建彩虹球
            const centerMatch = matches[Math.floor(matches.length / 2)];
            this.createRainbowBlock(centerMatch.row, centerMatch.col);
            return 'rainbow';
        } else if (matchCount >= 4) {
            // 创建炸弹
            const centerMatch = matches[Math.floor(matches.length / 2)];
            this.createBombBlock(centerMatch.row, centerMatch.col);
            return 'bomb';
        }
        
        return null;
    }
    
    createBombBlock(row, col) {
        // 延迟创建，等消除动画完成
        setTimeout(() => {
            this.board[row][col] = 'bomb';
            this.renderBoard();
        }, 900);
    }
    
    createRainbowBlock(row, col) {
        // 延迟创建，等消除动画完成
        setTimeout(() => {
            this.board[row][col] = 'rainbow';
            this.renderBoard();
        }, 900);
    }
    
    handleSpecialBlockClick(row, col) {
        const cellType = this.board[row][col];
        
        if (cellType === 'bomb') {
            this.explodeBomb(row, col);
            return true;
        } else if (cellType === 'rainbow') {
            this.activateRainbow(row, col);
            return true;
        }
        
        return false;
    }
    
        explodeBomb(row, col) {
        this.isProcessing = true;
        const cellsToRemove = [];
        
        // 爆炸范围：3x3区域
        for (let i = Math.max(0, row - 1); i <= Math.min(this.boardSize - 1, row + 1); i++) {
            for (let j = Math.max(0, col - 1); j <= Math.min(this.boardSize - 1, col + 1); j++) {
                if (this.board[i][j] !== null) {
                    cellsToRemove.push({row: i, col: j});
                }
            }
        }
        
        // 创建爆炸波效果
        this.createExplosionWave(row, col);
        
        // 播放爆炸音效和强烈震动
        this.soundManager.playSound('explosion');
        this.soundManager.vibratePattern('explosion');
        
        // 屏幕震动效果
        this.createScreenShake();
        
        // 添加分数
        this.score += cellsToRemove.length * 20;
        this.animateScoreUpdate(this.score);
        
        // 消除动画
        this.animateMatches(cellsToRemove);
        
        // 处理消除
        setTimeout(() => {
            cellsToRemove.forEach(cell => {
                this.board[cell.row][cell.col] = null;
            });
            
            this.animateGravity().then(() => {
                this.fillBoardWithAnimation().then(() => {
                    setTimeout(() => {
                        this.processMatches();
                    }, 200);
                });
            });
        }, 800);
    }
    
    activateRainbow(row, col) {
        this.isProcessing = true;
        const cellsToRemove = [];
        
        // 找到所有同颜色的方块（随机选择一个颜色）
        const targetColor = Math.floor(Math.random() * this.colors);
        
        for (let i = 0; i < this.boardSize; i++) {
            for (let j = 0; j < this.boardSize; j++) {
                if (this.board[i][j] === targetColor) {
                    cellsToRemove.push({row: i, col: j});
                }
            }
        }
        
        // 添加彩虹球本身
        cellsToRemove.push({row, col});
        
        // 添加分数
        this.score += cellsToRemove.length * 30;
        this.animateScoreUpdate(this.score);
        

        
        // 消除动画
        this.animateMatches(cellsToRemove);
        
        // 处理消除
        setTimeout(() => {
            cellsToRemove.forEach(cell => {
                this.board[cell.row][cell.col] = null;
            });
            
            this.animateGravity().then(() => {
                this.fillBoardWithAnimation().then(() => {
                    setTimeout(() => {
                        this.processMatches();
                    }, 200);
                });
            });
        }, 800);
    }
    
    createExplosionWave(row, col, x = null, y = null) {
        let centerX, centerY;
        
        if (x !== null && y !== null) {
            // 使用指定坐标
            centerX = x;
            centerY = y;
        } else {
            // 使用方块坐标
            const cellIndex = row * this.boardSize + col;
            const cell = document.querySelectorAll('.cell')[cellIndex];
            const rect = cell.getBoundingClientRect();
            centerX = rect.left + rect.width / 2;
            centerY = rect.top + rect.height / 2;
        }
        
        const wave = document.createElement('div');
        wave.className = 'explosion-wave';
        wave.style.left = centerX + 'px';
        wave.style.top = centerY + 'px';
        wave.style.marginLeft = '-100px';
        wave.style.marginTop = '-100px';
        
        document.body.appendChild(wave);
        
        setTimeout(() => {
            if (wave.parentNode) {
                wave.parentNode.removeChild(wave);
            }
        }, 1000);
    }
    

}

// 启动游戏
let game;
document.addEventListener('DOMContentLoaded', () => {
    game = new CandyCrushGame();
});

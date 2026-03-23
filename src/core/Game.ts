import { World, Material } from './World';
import { Miner } from '../entities/Miner';
import { Particle } from '../entities/Particle';
import { FloatingText } from '../entities/FloatingText';
import { Renderer, GameState } from '../engine/Renderer';
import { InputHandler } from '../engine/InputHandler';
import { SoundManager } from '../engine/SoundManager';

export class Game {
    public state: GameState = GameState.MENU;
    public world!: World;
    public miners: Miner[] = [];
    public particles: Particle[] = [];
    public floatingTexts: FloatingText[] = [];
    public renderer: Renderer;
    public input: InputHandler;
    public sound: SoundManager;
    
    public currentLevel: number = 0;
    public cameraX: number = 0;
    public cameraY: number = 0;
    public zoomFactor: number = 1.0;
    
    private realLastTick: number = 0;
    private virtualDelta: number = 0;
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;

    public globalDigTargetX: number = 0;
    public globalDigTargetY: number = 0;
    public globalDigTargetTime: number = 0;

    private lastMouseWorldX: number = 0;
    private lastMouseWorldY: number = 0;
    private gameSpeed: number = 1;
    private gameTicks: number = 0;

    // DOM HUD elements
    private uiScore!: HTMLElement;
    private uiTime!: HTMLElement;
    private uiMiners!: HTMLElement;
    private uiMenu!: HTMLElement;

    private minersAlive: number = 0;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d')!;
        this.renderer = new Renderer();
        this.input = new InputHandler(this.canvas);
        this.sound = new SoundManager();
        
        this.uiScore = document.getElementById('ui-score')!;
        this.uiTime = document.getElementById('ui-time')!;
        this.uiMiners = document.getElementById('ui-miners')!;
        this.uiMenu = document.getElementById('ui-menu')!;
        
        this.uiMenu.addEventListener('click', () => {
            this.state = GameState.PLAYING;
            this.uiMenu.classList.add('hidden');
        });

        // Speed buttons
        document.querySelectorAll('.speed-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const target = e.target as HTMLElement;
                const speed = parseInt(target.getAttribute('data-speed') || '1');
                this.gameSpeed = speed;
                
                // Update active state
                document.querySelectorAll('.speed-btn').forEach(b => b.classList.remove('active'));
                target.classList.add('active');
            });
        });

        this.startLevel(0);
        this.state = GameState.MENU;
        
        this.realLastTick = performance.now();
        requestAnimationFrame((time) => this.run(time));
    }

    public resize(width: number, height: number) {
        const targetHeight = 240;
        const targetWidth = Math.floor(targetHeight * (width / height));
        this.renderer.resize(targetWidth, targetHeight);
    }

    private startLevel(index: number) {
        this.world = new World(index);
        this.miners = [];
        this.particles = [];
        this.floatingTexts = [];

        const minersToSpawn = index === 0 ? 50 : (index === 6 ? 800 : index * index * 50);
        for (let i = 0; i < minersToSpawn; i++) {
            let spawnX = Math.floor(Math.random() * (88 - 24 - 16)) + 24;
            if (i < minersToSpawn / 2) spawnX = this.world.width - spawnX;
            this.miners.push(new Miner(spawnX, -Math.floor(Math.random() * 400), Math.random() < 0.5 ? -1 : 1, -640));
        }

        this.cameraX = 0;
        this.cameraY = 0;
        this.lastMouseWorldX = 0;
        this.lastMouseWorldY = 0;
        this.input.mouseButton = 0;
        this.score = 0;
        this.minersAlive = minersToSpawn;
        this.zoomFactor = 1.0;
        this.gameTicks = 0;
    }

    private run(currentTime: number) {
        let realDelta = currentTime - this.realLastTick;
        this.realLastTick = currentTime;

        this.handleInput();

        if (this.state === GameState.PLAYING) {
            this.virtualDelta += realDelta * this.gameSpeed;
            while (this.virtualDelta >= 25) {
                this.update();
                this.virtualDelta -= 25;
            }
        } else {
            this.virtualDelta = 0;
        }

        this.render();
        requestAnimationFrame((time) => this.run(time));
    }

    private handleInput() {
        if (this.state === GameState.PLAYING) {
            // Camera Pan
            // Camera Pan speed scales with zoom
            const panSpeed = Math.floor(8 * this.zoomFactor);
            const viewW = this.renderer.viewWidth * this.zoomFactor;
            const viewH = this.renderer.viewHeight * this.zoomFactor;

            if (this.input.isKeyPressed('ArrowLeft') || this.input.isKeyPressed('KeyA')) this.cameraX -= panSpeed;
            if (this.input.isKeyPressed('ArrowRight') || this.input.isKeyPressed('KeyD')) this.cameraX += panSpeed;
            if (this.input.isKeyPressed('ArrowUp') || this.input.isKeyPressed('KeyW')) this.cameraY -= panSpeed;
            if (this.input.isKeyPressed('ArrowDown') || this.input.isKeyPressed('KeyS')) this.cameraY += panSpeed;

            // Clamp camera to world bounds (with some margin for centering)
            const minX = (viewW > this.world.width) ? (this.world.width - viewW) / 2 : 0;
            const maxX = (viewW > this.world.width) ? (this.world.width - viewW) / 2 : this.world.width - viewW;
            const minY = (viewH > this.world.height) ? (this.world.height - viewH) / 2 : 0;
            const maxY = (viewH > this.world.height) ? (this.world.height - viewH) / 2 : this.world.height - viewH;

            this.cameraX = Math.max(minX, Math.min(maxX, this.cameraX));
            this.cameraY = Math.max(minY, Math.min(maxY, this.cameraY));

            // Zoom Control
            if (this.input.mouseWheelRotation !== 0) {
                const oldZoom = this.zoomFactor;
                if (this.input.mouseWheelRotation > 0) this.zoomFactor *= 1.1;
                else this.zoomFactor /= 1.1;

                this.zoomFactor = Math.max(0.5, Math.min(4.0, this.zoomFactor));
                
                // Adjust camera to zoom relative to center of view
                const dw = this.renderer.viewWidth * (oldZoom - this.zoomFactor);
                const dh = this.renderer.viewHeight * (oldZoom - this.zoomFactor);
                this.cameraX += dw / 2;
                this.cameraY += dh / 2;

                this.input.mouseWheelRotation = 0;
            }

            this.handleUserMining();
        }
    }

    private handleUserMining() {
        const currentMouseWorldX = Math.floor(this.input.xMouse * this.renderer.viewWidth * this.zoomFactor) + this.cameraX;
        const currentMouseWorldY = Math.floor(this.input.yMouse * this.renderer.viewHeight * this.zoomFactor) + this.cameraY;

        if (this.input.mouseButton > 0) {
            const dx = currentMouseWorldX - this.lastMouseWorldX;
            const dy = currentMouseWorldY - this.lastMouseWorldY;
            const dist = Math.floor(Math.sqrt(dx * dx + dy * dy)) + 1;
            
            let dugThisFrame = false;

            for (let i = 0; i < dist; i++) {
                const mx = Math.floor(currentMouseWorldX + (this.lastMouseWorldX - currentMouseWorldX) * i / dist);
                const my = Math.floor(currentMouseWorldY + (this.lastMouseWorldY - currentMouseWorldY) * i / dist);

                for (let xx = -3; xx <= 3; xx++) {
                    for (let yy = -3; yy <= 3; yy++) {
                        if ((xx !== -3 && xx !== 3) || (yy !== -3 && yy !== 3)) {
                            const px = mx + xx;
                            const py = my + yy;
                            if (px >= 0 && py >= 0 && px < 1024 && py < 2048) {
                                if (this.input.mouseButton === 1) {
                                    const mat = this.world.getMaterial(px, py);
                                    
                                    // Professional check: DIRT and GRASS are destructible
                                    if (mat === Material.DIRT || mat === Material.GRASS) {
                                        this.world.setPixel(px, py, World.COLOR_EMPTY, Material.AIR);
                                        dugThisFrame = true;
                                        if (Math.random() < 0.3) {
                                             const col = this.world.getPixel(px, py);
                                             this.spawnParticles(px, py, 1, col, 1.2); 
                                        }
                                        // BRIGHT SPARKS (Faíscas)
                                        if (Math.random() < 0.1) {
                                            this.spawnParticles(px, py, 1, 0xFFFFFFCC, 2.0); 
                                        }
                                    }
                                } else if (this.input.mouseButton === 3) {
                                    // Build DIRT (Right Click)
                                    if (this.world.getMaterial(px, py) === Material.AIR) {
                                        let br = 1.6 - (Math.random() - 0.5) * Math.random() * Math.random() * 0.6;
                                        br *= (1 - py / 6048.0);
                                        const r = Math.floor(111 * br);
                                        const g = Math.floor(92 * br);
                                        const b = Math.floor(51 * br);
                                        this.world.setPixel(px, py, 0xff000000 | (r << 16) | (g << 8) | b, Material.DIRT);
                                    }
                                }
                            }
                        }
                    }
                }
            }
            if (dugThisFrame) {
                // Save the digging location to attract miners
                this.globalDigTargetX = currentMouseWorldX;
                this.globalDigTargetY = currentMouseWorldY;
                this.globalDigTargetTime = performance.now();

                // Rhythmic Sound Throttling (Phase 3 Fix from original Java)
                const now = performance.now();
                if (now - (this as any).lastDigSoundTime > 80 || !(this as any).lastDigSoundTime) {
                    this.sound.play('dig');
                    (this as any).lastDigSoundTime = now;
                }
            }

        }
        this.lastMouseWorldX = currentMouseWorldX;
        this.lastMouseWorldY = currentMouseWorldY;
    }

    private spawnParticles(x: number, y: number, count: number, color: number, speedMult: number = 1.0) {
        if (this.particles.length > 2000) return;
        for (let i = 0; i < count; i++) {
            const vx = (Math.random() - 0.5) * 4.0 * speedMult;
            const vy = (Math.random() - 1.0) * 4.0 * speedMult;
            const life = 20 + Math.floor(Math.random() * 20);
            const p = new Particle(x, y, vx, vy, color, life);
            
            // Special behaviors
            if (color === 0xFF888888) { // Smoke
                p.gravity = -0.05; // Rises
                p.friction = 0.95;
            } else if (color === 0xFFFFFFCC) { // Sparks
                p.gravity = 0.1;
                p.life = 10 + Math.floor(Math.random() * 10);
            }
            
            this.particles.push(p);
        }
    }

    private update() {
        this.gameTicks++;
        this.spreadSlime();

        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.update();
            if (p.isDead()) this.particles.splice(i, 1);
        }

        for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
            const ft = this.floatingTexts[i];
            ft.update();
            if (ft.isDead()) this.floatingTexts.splice(i, 1);
        }

        let aliveCount = 0;
        for (const m of this.miners) {
            this.updateMiner(m);
            if (m.isAlive()) aliveCount++;
        }
        this.minersAlive = aliveCount;
        
        this.checkLevelState();
    }

    private checkLevelState() {
        if (this.state !== GameState.PLAYING) return;

        const passedTimeSec = Math.floor(this.gameTicks / 40); // 40 ticks per second (1 tick = 25ms)
        const timeLeft = this.world.timeLimit - passedTimeSec;

        // Win condition
        if (this.score >= this.world.targetGold) {
            this.state = GameState.MENU;
            if (this.currentLevel < 6) this.currentLevel++;
            this.startLevel(this.currentLevel);
            this.uiMenu.querySelector('p')!.innerText = "Level Complete! Click to continue...";
            this.uiMenu.classList.remove('hidden');
        }

        // Loss condition
        if (this.minersAlive <= 0 || timeLeft <= 0 || this.input.isKeyPressed('KeyK')) {
            this.state = GameState.MENU;
            this.startLevel(this.currentLevel); // Reset
            this.uiMenu.querySelector('p')!.innerText = "Game Over! Click to retry...";
            this.uiMenu.classList.remove('hidden');
        }
    }

    private spreadSlime() {
        for (let i = 0; i < 400; i++) {
            const x = Math.floor(Math.random() * 1021) + 1;
            const y = Math.floor(Math.random() * 1021) + 1;
            const x2 = x + Math.floor(Math.random() * 3) - 1;
            const y2 = y + Math.floor(Math.random() * 3) - 1;
            if (this.world.getPixel(x2, y2) === World.COLOR_SLIME_PIXEL) {
                for (let xx = -1; xx <= 1; xx++) {
                    for (let yy = -1; yy <= 1; yy++) {
                        this.world.setPixel(x + xx, y + yy, World.COLOR_SLIME_PIXEL);
                    }
                }
            }
        }
    }

    private updateMiner(m: Miner) {
        if (!m.isAlive()) {
            m.updateDeathAnimation();
            return;
        }

        // 1. If inside gold (any type), move up (pushed out)
        const currentMat = this.world.getMaterial(m.x, m.y);
        if (m.y > 0 && (currentMat === Material.GOLD_RAW || currentMat === Material.GOLD_SAFE)) {
            m.y--;
        }

        // 2. Jumping Arc / Movement
        if (m.jumpVelocity > 1 && m.y > 1) {
            const nextX = m.x + m.direction;
            const nextY = m.y - Math.floor(m.jumpVelocity / 8);
            if (this.world.getMaterial(nextX, nextY) === Material.AIR) {
                m.x = nextX;
                m.y = nextY;
                m.animate();
                m.jumpVelocity--;
            } else {
                m.jumpVelocity = 0; // Hit head/wall
            }
        } else {
            // 3. Falling check
            if (m.y < 4 || this.world.getMaterial(m.x, m.y + 1) === Material.AIR) {
                // Original: 66% chance to start a jump if about to fall and on ground
                if (m.jumpVelocity === -1 && Math.random() < 0.66) {
                    m.jump();
                } else {
                    for (let j = 0; j < 2; j++) {
                        if (m.y < 4 || this.world.getMaterial(m.x, m.y + 1) === Material.AIR) {
                            m.y++;
                            m.jumpVelocity = 0;
                            m.fallDistance++;
                        }
                    }
                }
            } else {
                // 4. Grounded logic
                if (m.fallDistance > 100) {
                    m.die();
                    m.x -= m.direction;
                    this.spawnParticles(m.x, m.y, 10, World.COLOR_BLOOD);
                    this.renderer.setShake(1.0); // Small jolt on death
                }
                m.fallDistance = 0;
                m.jumpVelocity = -1;

                // 5. Normal Horizontal Movement (95% chance to move per tick)
                if (Math.random() < 0.95) {
                    let hit = true;
                    // Original: step up 4 or down 2
                    for (let dy = 2; dy >= -4; dy--) {
                        if (this.world.getMaterial(m.x + m.direction, m.y + dy) === Material.AIR) {
                            m.x += m.direction;
                            m.y += dy;
                            m.animate();
                            hit = false;
                            break;
                        }
                    }

                    // --- SMART AI LOGIC V3 ---
                    let turnProb = hit ? 0.1 : 0.00025;

                    if (m.carryingGold) {
                        // Se estiver com ouro, NÃO vira aleatoriamente em terreno plano.
                        turnProb = hit ? 0.1 : 0.0;
                    } else {
                        let foundGoldNearby = false;
                        
                        // 1. Alert System: Segue companheiros que vêm com ouro
                        // Se não temos ouro e cruzamos com alguém com ouro, vamos na direção de onde eles vieram!
                        for (const other of this.miners) {
                            if (other.isAlive() && other.carryingGold && other !== m) {
                                const dist = Math.abs(m.x - other.x) + Math.abs(m.y - other.y);
                                if (dist < 12) { // Distância de contato
                                    const dirTowardsGold = -other.direction;
                                    if (m.direction !== dirTowardsGold) {
                                        m.direction = dirTowardsGold; // Começa a ir para dentro da mina
                                    }
                                    m.memoryY = 200; // Usa memoryY como timer de foco
                                    break;
                                }
                            }
                        }

                        // 2. Olfato para o ouro bruto local
                        for (let i = 0; i < 3; i++) {
                            const lookDist = 5 + Math.random() * 25;
                            const lookYOffset = (Math.random() - 0.5) * 10;
                            const aheadMat = this.world.getMaterial(Math.floor(m.x + m.direction * lookDist), Math.floor(m.y + lookYOffset));
                            const behindMat = this.world.getMaterial(Math.floor(m.x - m.direction * lookDist), Math.floor(m.y + lookYOffset));
                            
                            if (aheadMat === Material.GOLD_RAW) {
                                turnProb = hit ? 0.02 : 0.00001;
                                foundGoldNearby = true;
                                break;
                            } else if (behindMat === Material.GOLD_RAW) {
                                turnProb = hit ? 0.2 : 0.05;
                                foundGoldNearby = true;
                                break;
                            }
                        }

                        // 3. Temporizador de Foco (para não virar à toa enquanto segue a trilha)
                        if (!foundGoldNearby && m.memoryY !== null && m.memoryY > 0) {
                            m.memoryY--;
                            if (!hit) {
                                turnProb = 0.0; // Foco total, segue reto pelo túnel
                            } else {
                                turnProb = 0.1; // Bateu em algo no túnel, deve ter chance de virar e adaptar
                                m.memoryY -= 10; // Bater desgasta a memória
                            }
                            if (m.memoryY <= 0) m.memoryY = null;
                        } else if (!foundGoldNearby && m.memoryY !== null && m.memoryY <= 0) {
                            m.memoryY = null;
                        }
                    }

                    if (Math.random() < turnProb || m.x <= 8 || m.x >= this.world.width - 9) {
                        m.direction *= -1;
                        if (hit && Math.random() < 0.66) m.jump();
                    }
                }
            }
        }
        this.handleGoldInteraction(m);
    }

    public score: number = 0;

    private handleGoldInteraction(m: Miner) {
        if (m.carryingGold && m.y <= this.world.getHeightAt(m.x) && (m.x === 8 + 32 || m.x === this.world.width - 8 - 32)) {
            this.score++;
            m.carryingGold = false;
            m.memoryX = null; // Esquece o ouro antigo!
            m.memoryY = null;
            this.dropGoldPixels(m.x, m.y - 5);
            this.spawnParticles(m.x, m.y - 4, 8, World.COLOR_GOLD_PIXEL);
            this.sound.play('deposit');
            this.floatingTexts.push(new FloatingText(m.x, m.y - 10, "+1", "#FFDE00"));
            m.direction *= -1;
        }

        for (let xx = -3; xx <= 3; xx++) {
            for (let yy = -8; yy <= 1; yy++) {
                const px = m.x + xx * m.direction;
                const py = m.y + yy;
                if (px >= 0 && py >= 0 && px < this.world.width && py < this.world.height) {
                    const charIdx: number = (xx + 3) + (yy + 8) * 7 + m.getAnimationFrame() * 70;
                    if (World.SPRITES[charIdx] !== ' ') {
                        const mat = this.world.getMaterial(px, py);
                        if (mat === Material.SLIME) {
                            m.die();
                            this.explode(m.x, m.y);
                            this.spawnParticles(m.x, m.y, 20, World.COLOR_SLIME_PIXEL);
                            this.sound.play('death');
                        }
                        if (!m.carryingGold && mat === Material.GOLD_RAW) {
                            for (let xxx = -1; xxx <= 1; xxx++) {
                                for (let yyy = -1; yyy <= 1; yyy++) {
                                    if (this.world.getMaterial(px + xxx, py + yyy) === Material.GOLD_RAW) {
                                        this.world.setPixel(px + xxx, py + yyy, World.COLOR_EMPTY, Material.AIR);
                                    }
                                }
                            }
                            m.carryingGold = true;
                            // Grava as coordenadas deste ouro na memória do minerador!
                            m.memoryX = px;
                            m.memoryY = py;
                            m.direction *= -1;

                            // LOTS OF SPARKS ON COLLECTION
                            this.spawnParticles(px, py, 12, World.COLOR_GOLD_PIXEL, 1.5);
                            this.spawnParticles(px, py, 8, 0xFFFFFFCC, 2.5); // Fast white sparks
                            this.sound.play('gold');
                        }
                    }
                }
            }
        }
    }

    private explode(centerX: number, centerY: number) {
        const s = 16;
        for (let dx = -s; dx <= s; dx++) {
            for (let dy = -s; dy <= s; dy++) {
                const distSq = dx * dx + dy * dy;
                const px = dx + centerX;
                const py = dy + centerY - 4;
                if (px >= 4 && py >= 4 && px < this.world.width - 4 && py < this.world.height - 4 && distSq < s * s) {
                    this.world.setPixel(px, py, World.COLOR_EMPTY, Material.AIR);
                }
            }
        }
        this.renderer.setShake(5.0); // Big explosion shake
        this.spawnParticles(centerX, centerY, 30, 0xFF888888, 0.5); // Smoke
        this.spawnParticles(centerX, centerY, 20, 0xFFFFFFCC, 2.5); // Sparks
        this.sound.play('explode');
    }

    private dropGoldPixels(x: number, y: number) {
        for (let j = 0; j < 4; j++) {
            let xx = x, yy = y;
            let done = false;
            while (!done) {
                if (this.world.getMaterial(xx, yy + 1) === Material.AIR) yy++;
                else if (this.world.getMaterial(xx - 1, yy + 1) === Material.AIR) { xx--; yy++; }
                else if (this.world.getMaterial(xx + 1, yy + 1) === Material.AIR) { xx++; yy++; }
                else done = true;
            }
            if (yy < this.world.getHeightAt(xx)) {
                this.world.setPixel(xx, yy, World.COLOR_GOLD_DEPOSIT, Material.GOLD_SAFE);
            }
        }
    }

    private render() {
        this.renderer.render(this.world, this.miners, this.particles, this.floatingTexts, Math.floor(this.cameraX), Math.floor(this.cameraY), this.zoomFactor);
        this.renderer.present(this.ctx, this.canvas.width, this.canvas.height);
        
        // Update DOM HUD safely outside the expensive loop
        const passedTimeSec = Math.floor(this.gameTicks / 40);
        const timeLeft = Math.max(0, this.world.timeLimit - passedTimeSec);

        this.uiScore.innerText = `GOLD: ${this.score} / ${this.world.targetGold}`;
        if (this.state === GameState.PLAYING) {
            this.uiTime.innerText = `${timeLeft}s`;
            if (timeLeft < 30) {
                this.uiTime.parentElement?.classList.add('low-time');
            } else {
                this.uiTime.parentElement?.classList.remove('low-time');
            }
        }
        this.uiMiners.innerText = `MINERS: ${this.minersAlive}`;
    }
}

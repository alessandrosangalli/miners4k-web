import { World, Material } from './World.js';
import { Miner } from '../entities/Miner.js';
import { Particle } from '../entities/Particle.js';
import { Renderer, GameState } from '../engine/Renderer.js';
import { InputHandler } from '../engine/InputHandler.js';
import { SoundManager } from '../engine/SoundManager.js';

export class Game {
    constructor(canvas) {
        this.state = GameState.MENU;
        this.world = null;
        this.miners = [];
        this.particles = [];
        this.currentLevel = 0;
        this.cameraX = 0;
        this.cameraY = 0;
        this.score = 0;
        this.lastTick = 0;
        this.lastMouseWorldX = 0;
        this.lastMouseWorldY = 0;
        this.roundsStartTime = 0;
        this.minersAlive = 0;

        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.renderer = new Renderer();
        this.input = new InputHandler(this.canvas);
        this.sound = new SoundManager();
        
        this.uiScore = document.getElementById('ui-score');
        this.uiTime = document.getElementById('ui-time');
        this.uiMiners = document.getElementById('ui-miners');
        this.uiMenu = document.getElementById('ui-menu');
        
        this.uiMenu.addEventListener('click', () => {
            this.state = GameState.PLAYING;
            this.uiMenu.classList.add('hidden');
            this.roundsStartTime = performance.now();
            this.startLevel(this.currentLevel);
        });

        this.startLevel(0);
        this.state = GameState.MENU;
        
        this.lastTick = performance.now();
        requestAnimationFrame((time) => this.run(time));
    }

    startLevel(index) {
        this.world = new World(index);
        this.miners = [];
        this.particles = [];

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
    }

    run(currentTime) {
        let delta = currentTime - this.lastTick;

        this.handleInput();

        if (this.state === GameState.PLAYING) {
            while (delta >= 25) {
                this.update();
                this.lastTick += 25;
                delta -= 25;
            }
        } else {
            this.lastTick = currentTime;
        }

        this.render();
        requestAnimationFrame((time) => this.run(time));
    }

    handleInput() {
        if (this.state === GameState.PLAYING) {
            if (this.input.isKeyPressed('ArrowLeft') && this.cameraX > 8) this.cameraX -= 8;
            if (this.input.isKeyPressed('ArrowRight') && this.cameraX < this.world.width - Renderer.VIEW_WIDTH) this.cameraX += 8;
            if (this.input.isKeyPressed('ArrowUp') && this.cameraY > 8) this.cameraY -= 8;
            if (this.input.isKeyPressed('ArrowDown') && this.cameraY < this.world.height - Renderer.VIEW_HEIGHT) this.cameraY += 8;

            this.handleUserMining();
        }
    }

    handleUserMining() {
        const currentMouseWorldX = Math.floor(this.input.xMouse * Renderer.VIEW_WIDTH) + this.cameraX;
        const currentMouseWorldY = Math.floor(this.input.yMouse * Renderer.VIEW_HEIGHT) + this.cameraY;

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
                            if (px >= 0 && py >= 0 && px < this.world.width && py < this.world.height) {
                                if (this.input.mouseButton === 3 || this.input.isKeyPressed('ControlLeft') || this.input.isKeyPressed('ControlRight')) {
                                    const material = this.world.getMaterial(px, py);
                                    
                                    // Professional Logic: Only destroy DIRT blocks.
                                    if (material === Material.DIRT) {
                                        const col = this.world.getPixel(px, py);
                                        this.world.setPixel(px, py, World.COLOR_EMPTY, Material.EMPTY);
                                        dugThisFrame = true;
                                        if (Math.random() < 0.25) this.spawnParticles(px, py, 1, col);
                                    }
                                } else {
                                    if (this.world.getMaterial(px, py) === Material.EMPTY) {
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
                const now = performance.now();
                if (now - this.lastDigSoundTime > 80 || !this.lastDigSoundTime) {
                    this.sound.play('dig');
                    this.lastDigSoundTime = now;
                }
            }
        }
        this.lastMouseWorldX = currentMouseWorldX;
        this.lastMouseWorldY = currentMouseWorldY;
    }

    spawnParticles(x, y, count, color) {
        if (this.particles.length > 1000) return;
        for (let i = 0; i < count; i++) {
            const vx = (Math.random() - 0.5) * 4.0;
            const vy = (Math.random() - 1.0) * 4.0;
            const life = 20 + Math.floor(Math.random() * 20);
            this.particles.push(new Particle(x, y, vx, vy, color, life));
        }
    }

    update() {
        this.spreadSlime();

        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.update();
            if (p.isDead()) this.particles.splice(i, 1);
        }

        let aliveCount = 0;
        for (const m of this.miners) {
            this.updateMiner(m);
            if (m.isAlive()) aliveCount++;
        }
        this.minersAlive = aliveCount;
        
        this.checkLevelState();
    }

    checkLevelState() {
        if (this.state !== GameState.PLAYING) return;

        const passedTimeSec = Math.floor((performance.now() - this.roundsStartTime) / 1000);
        const timeLeft = this.world.timeLimit - passedTimeSec;

        if (this.score >= this.world.targetGold) {
            this.state = GameState.MENU;
            if (this.currentLevel < 6) this.currentLevel++;
            this.uiMenu.querySelector('p').innerText = "Level Complete! Click to continue...";
            this.uiMenu.classList.remove('hidden');
        }

        if (this.minersAlive <= 0 || timeLeft <= 0 || this.input.isKeyPressed('KeyK')) {
            this.state = GameState.MENU;
            this.uiMenu.querySelector('p').innerText = "Game Over! Click to retry...";
            this.uiMenu.classList.remove('hidden');
        }
    }

    spreadSlime() {
        for (let i = 0; i < 400; i++) {
            const x = Math.floor(Math.random() * (this.world.width - 4)) + 1;
            const y = Math.floor(Math.random() * (this.world.height - 4)) + 1;
            const x2 = x + Math.floor(Math.random() * 3) - 1;
            const y2 = y + Math.floor(Math.random() * 3) - 1;
            if (this.world.getMaterial(x2, y2) === Material.SLIME) {
                for (let xx = -1; xx <= 1; xx++) {
                    for (let yy = -1; yy <= 1; yy++) {
                        this.world.setPixel(x + xx, y + yy, World.COLOR_SLIME_PIXEL, Material.SLIME);
                    }
                }
            }
        }
    }

    updateMiner(m) {
        if (!m.isAlive()) {
            m.updateDeathAnimation();
            return;
        }

        if (m.jumpVelocity > 1 && m.y > 1) {
            const nextX = m.x + m.direction;
            if (nextX <= 4 || nextX >= this.world.width - 5) {
                m.direction *= -1;
            } else if (this.world.getMaterial(nextX, Math.floor(m.y - m.jumpVelocity / 8)) === Material.EMPTY) {
                m.x = nextX;
                m.y -= Math.floor(m.jumpVelocity / 8);
                m.animate();
                m.jumpVelocity--;
            } else {
                m.jumpVelocity = 0;
            }
        } else {
            if (m.y > 0 && this.world.getMaterial(m.x, m.y) === Material.GOLD) m.y--;

            if (m.y < 4 || this.world.getMaterial(m.x, m.y + 1) === Material.EMPTY) {
                if (m.jumpVelocity === -1 && Math.random() < 0.66) {
                    m.jump();
                } else {
                    for (let j = 0; j < 2; j++) {
                        if (m.y < 4 || this.world.getMaterial(m.x, m.y + 1) === Material.EMPTY) {
                            m.y++;
                            m.jumpVelocity = 0;
                            m.fallDistance++;
                        }
                    }
                }
            } else {
                if (m.fallDistance > 100) {
                    m.die();
                    m.x -= m.direction;
                    this.spawnParticles(m.x, m.y, 10, World.COLOR_BLOOD);
                    this.sound.play('death');
                }
                m.fallDistance = 0;
                m.jumpVelocity = -1;

                if (Math.random() < 0.95) { // 19 out of 20 frames they walk!
                    let hit = true;
                    const nextX = m.x + m.direction;
                    if (nextX <= 4 || nextX >= this.world.width - 5) {
                        m.direction *= -1;
                    } else {
                        for (let dy = 2; dy >= -4; dy--) {
                            if (this.world.getMaterial(nextX, m.y + dy) === Material.EMPTY) {
                                m.x = nextX;
                                m.y += dy;
                                m.animate();
                                hit = false;
                                break;
                            }
                        }
                        if (Math.random() < (hit ? 0.1000 : 0.00025)) {
                            m.direction *= -1;
                            if (hit && Math.random() < 0.66) m.jump();
                        }
                    }
                }
            }
        }
        this.handleGoldInteraction(m);
    }

    handleGoldInteraction(m) {
        if (m.carryingGold && m.y <= this.world.getHeightAt(m.x) && (m.x === 8 + 32 || m.x === this.world.width - 8 - 32)) {
            this.score++;
            m.carryingGold = false;
            this.dropGoldPixels(m.x, m.y - 5);
            this.spawnParticles(m.x, m.y - 4, 8, World.COLOR_GOLD_PIXEL);
            this.sound.play('deposit');
            m.direction *= -1;
        }

        for (let xx = -3; xx <= 3; xx++) {
            for (let yy = -8; yy <= 1; yy++) {
                const px = m.x + xx * m.direction;
                const py = m.y + yy;
                if (px >= 0 && py >= 0 && px < this.world.width && py < this.world.height) {
                    const charIdx = (xx + 3) + (yy + 8) * 7 + m.getAnimationFrame() * 70;
                    if (World.SPRITES[charIdx] !== ' ') {
                        let material = this.world.getMaterial(px, py);
                        if (material === Material.SLIME) {
                            m.die();
                            this.explode(m.x, m.y);
                            this.spawnParticles(m.x, m.y, 20, World.COLOR_SLIME_PIXEL);
                            this.sound.play('death');
                        }
                        if (!m.carryingGold && material === Material.GOLD) {
                            for (let xxx = -1; xxx <= 1; xxx++) {
                                for (let yyy = -1; yyy <= 1; yyy++) {
                                    if (this.world.getMaterial(px + xxx, py + yyy) === Material.GOLD) {
                                        this.world.setPixel(px + xxx, py + yyy, World.COLOR_EMPTY, Material.EMPTY);
                                    }
                                }
                            }
                            m.carryingGold = true;
                            m.direction *= -1;
                            this.spawnParticles(px, py, 12, World.COLOR_GOLD_PIXEL);
                            this.sound.play('gold');
                        }
                    }
                }
            }
        }
    }

    explode(centerX, centerY) {
        const s = 16;
        for (let dx = -s; dx <= s; dx++) {
            for (let dy = -s; dy <= s; dy++) {
                const distSq = dx * dx + dy * dy;
                const px = dx + centerX;
                const py = dy + centerY - 4;
                if (px >= 4 && py >= 4 && px < this.world.width - 4 && py < this.world.height - 4 && distSq < s * s) {
                    this.world.setPixel(px, py, World.COLOR_EMPTY, Material.EMPTY);
                }
            }
        }
        this.sound.play('explode');
    }

    dropGoldPixels(x, y) {
        for (let j = 0; j < 4; j++) {
            let xx = x, yy = y;
            let done = false;
            while (!done) {
                if (this.world.getMaterial(xx, yy + 1) === Material.EMPTY) yy++;
                else if (this.world.getMaterial(xx - 1, yy + 1) === Material.EMPTY) { xx--; yy++; }
                else if (this.world.getMaterial(xx + 1, yy + 1) === Material.EMPTY) { xx++; yy++; }
                else done = true;
            }
            if (yy < this.world.getHeightAt(xx)) {
                this.world.setPixel(xx, yy, World.COLOR_GOLD_DEPOSIT, Material.GOLD);
            }
        }
    }

    render() {
        this.renderer.render(this.world, this.miners, this.particles, Math.floor(this.cameraX), Math.floor(this.cameraY));
        this.renderer.present(this.ctx, this.canvas.width, this.canvas.height);
        
        const passedTimeSec = Math.floor((performance.now() - this.roundsStartTime) / 1000);
        const timeLeft = Math.max(0, this.world.timeLimit - passedTimeSec);

        this.uiScore.innerText = `GOLD: ${this.score} / ${this.world.targetGold}`;
        if (this.state === GameState.PLAYING) {
            this.uiTime.innerText = `TIME: ${timeLeft}s`;
            if (timeLeft < 30 && timeLeft % 2 === 0) {
                this.uiTime.style.color = '#FF1111';
            } else {
                this.uiTime.style.color = '#FFDE00';
            }
        }
        this.uiMiners.innerText = `MINERS: ${this.minersAlive}`;
    }
}

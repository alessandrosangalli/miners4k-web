import { World } from '../core/World.js';

export const GameState = { MENU: 0, PLAYING: 1, PAUSED: 2, GAME_OVER: 3 };

export class Renderer {
    constructor() {
        this.offscreenCanvas = document.createElement('canvas');
        this.offscreenCanvas.width = Renderer.VIEW_WIDTH;
        this.offscreenCanvas.height = Renderer.VIEW_HEIGHT;
        this.offscreenCtx = this.offscreenCanvas.getContext('2d');
        this.imageData = this.offscreenCtx.createImageData(Renderer.VIEW_WIDTH, Renderer.VIEW_HEIGHT);
        this.pixels = this.imageData.data;
    }

    render(world, miners, particles, cameraX, cameraY) {
        this.renderSky(cameraX, cameraY);
        const worldPixels = world.pixels;

        const lightMap = new Float32Array(Renderer.VIEW_WIDTH * Renderer.VIEW_HEIGHT);
        for (let y = 0; y < Renderer.VIEW_HEIGHT; y++) {
            const baseBrightness = Math.max(0.4, 1.0 - (cameraY + y) / (world.height - 200) * 0.9);
            for (let x = 0; x < Renderer.VIEW_WIDTH; x++) {
                lightMap[x + y * Renderer.VIEW_WIDTH] = baseBrightness;
            }
        }

        for (const m of miners) {
            if (m.x < cameraX - 10 || m.x > cameraX + Renderer.VIEW_WIDTH + 10 || m.y < cameraY - 10 || m.y > cameraY + Renderer.VIEW_HEIGHT + 10) continue;
            let mx = m.x - cameraX;
            let my = m.y - cameraY;
            for (let dy = -30; dy <= 30; dy++) {
                for (let dx = -30; dx <= 30; dx++) {
                    let lx = mx + dx, ly = my + dy;
                    if (lx >= 0 && ly >= 0 && lx < Renderer.VIEW_WIDTH && ly < Renderer.VIEW_HEIGHT) {
                        let distSq = dx * dx + dy * dy;
                        if (distSq < 900) {
                            let light = 1.0 - Math.sqrt(distSq) / 30.0;
                            let lidx = lx + ly * Renderer.VIEW_WIDTH;
                            lightMap[lidx] = Math.max(lightMap[lidx], lightMap[lidx] + (1.0 - lightMap[lidx]) * light);
                        }
                    }
                }
            }
        }

        for (let y = 0; y < Renderer.VIEW_HEIGHT; y++) {
            const wy = cameraY + y;
            for (let x = 0; x < Renderer.VIEW_WIDTH; x++) {
                const wx = cameraX + x;
                const idx = (x + y * Renderer.VIEW_WIDTH) * 4;

                if (wx >= 0 && wy >= 0 && wx < world.width && wy < world.height) {
                    const col = worldPixels[world.getIndex(wx, wy)];
                    const brightness = lightMap[x + y * Renderer.VIEW_WIDTH];

                    if (col !== 0 && col !== 0x00000000) {
                        this.pixels[idx] = ((col >> 16) & 0xff) * brightness;
                        this.pixels[idx + 1] = ((col >> 8) & 0xff) * brightness;
                        this.pixels[idx + 2] = (col & 0xff) * brightness;
                    } else if (wy > world.getHeightAt(wx) + 3) {
                        this.pixels[idx] = 0x2b * brightness;
                        this.pixels[idx + 1] = 0x1e * brightness;
                        this.pixels[idx + 2] = 0x15 * brightness;
                    }
                }
            }
        }

        for (const m of miners) {
            if (!m.isAlive()) continue;
            if (m.x < cameraX - 10 || m.x > cameraX + Renderer.VIEW_WIDTH + 10 || m.y < cameraY - 10 || m.y > cameraY + Renderer.VIEW_HEIGHT + 10) continue;

            const frame = m.getAnimationFrame();
            for (let dy = -8; dy <= 1; dy++) {
                const wy = m.y + dy;
                for (let dx = -3; dx <= 3; dx++) {
                    const wx = m.x + dx;
                    const charIdx = (dx * m.direction + 3) + (dy + 8) * 7 + frame * 70;
                    const pChar = World.SPRITES[charIdx];
                    if (pChar !== ' ') {
                        let mCol = 0x0000FF;
                        if (pChar === '!') mCol = 0x00FF00;
                        else if (pChar === 'o') mCol = 0xDB8EAF;
                        else if (pChar === 'X') {
                            if (m.carryingGold) mCol = 0xFFFF00;
                            else continue;
                        } else if (pChar === '#') mCol = 0xFF0000;

                        const lX = wx - cameraX;
                        const lY = wy - cameraY;
                        if (lX >= 0 && lX < Renderer.VIEW_WIDTH && lY >= 0 && lY < Renderer.VIEW_HEIGHT) {
                            const br = lightMap[lX + lY * Renderer.VIEW_WIDTH];
                            const idx = (lX + lY * Renderer.VIEW_WIDTH) * 4;
                            this.pixels[idx] = ((mCol >> 16) & 0xff) * br;
                            this.pixels[idx + 1] = ((mCol >> 8) & 0xff) * br;
                            this.pixels[idx + 2] = (mCol & 0xff) * br;
                        }
                    }
                }
            }
        }

        for (const p of particles) {
            const sx = Math.floor(p.x - cameraX);
            const sy = Math.floor(p.y - cameraY);
            if (sx >= 0 && sy >= 0 && sx < Renderer.VIEW_WIDTH && sy < Renderer.VIEW_HEIGHT) {
                const idx = (sx + sy * Renderer.VIEW_WIDTH) * 4;
                this.pixels[idx] = (p.color >> 16) & 0xff;
                this.pixels[idx + 1] = (p.color >> 8) & 0xff;
                this.pixels[idx + 2] = p.color & 0xff;
            }
        }
        
        this.offscreenCtx.putImageData(this.imageData, 0, 0);
    }

    renderSky(cameraX, cameraY) {
        for (let y = 0; y < Renderer.VIEW_HEIGHT; y++) {
            const ratio = Math.max(0, Math.min(1.0, (cameraY + y) / 1000.0));
            const r = Math.floor(135 * (1 - ratio) + 25 * ratio);
            const g = Math.floor(206 * (1 - ratio) + 25 * ratio);
            const b = Math.floor(235 * (1 - ratio) + 112 * ratio);
            
            for (let x = 0; x < Renderer.VIEW_WIDTH; x++) {
                const idx = (x + y * Renderer.VIEW_WIDTH) * 4;
                this.pixels[idx] = r;
                this.pixels[idx + 1] = g;
                this.pixels[idx + 2] = b;
                this.pixels[idx + 3] = 255;
            }
        }
    }

    present(ctx, canvasWidth, canvasHeight) {
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(this.offscreenCanvas, 0, 0, canvasWidth, canvasHeight);
    }
}
Renderer.VIEW_WIDTH = 320;
Renderer.VIEW_HEIGHT = 240;

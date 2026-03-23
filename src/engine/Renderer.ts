import { World } from '../core/World';
import { Miner } from '../entities/Miner';
import { Particle } from '../entities/Particle';

export enum GameState { MENU = 0, PLAYING = 1, PAUSED = 2, GAME_OVER = 3 }

export class Renderer {
    public static readonly VIEW_WIDTH = 320;
    public static readonly VIEW_HEIGHT = 240;

    private offscreenCanvas: HTMLCanvasElement;
    private offscreenCtx: CanvasRenderingContext2D;
    private imageData: ImageData;
    private pixels: Uint8ClampedArray;

    constructor() {
        this.offscreenCanvas = document.createElement('canvas');
        this.offscreenCanvas.width = Renderer.VIEW_WIDTH;
        this.offscreenCanvas.height = Renderer.VIEW_HEIGHT;
        this.offscreenCtx = this.offscreenCanvas.getContext('2d')!;
        this.imageData = this.offscreenCtx.createImageData(Renderer.VIEW_WIDTH, Renderer.VIEW_HEIGHT);
        this.pixels = this.imageData.data;
    }

    public render(world: World, miners: Miner[], particles: Particle[], cameraX: number, cameraY: number, zoomFactor: number = 1.0): void {
        this.renderSky(cameraY, zoomFactor);
        const worldPixels = world.pixels;

        // 1. Pre-calculate Light Map (320x240)
        const lightMap = new Float32Array(Renderer.VIEW_WIDTH * Renderer.VIEW_HEIGHT);
        for (let y = 0; y < Renderer.VIEW_HEIGHT; y++) {
            const wy = cameraY + y * zoomFactor;
            // Day light: 1.0 at surface, down to 0.4 deep in cave
            const ratio = Math.max(0, Math.min(1.0, wy / (world.height * 0.8)));
            const baseBrightness = 1.0 * (1.0 - ratio) + 0.4 * ratio;
            
            for (let x = 0; x < Renderer.VIEW_WIDTH; x++) {
                // Subtle vignette at the absolute edges
                const dx = (x / Renderer.VIEW_WIDTH) - 0.5;
                const dy = (y / Renderer.VIEW_HEIGHT) - 0.5;
                const vign = 1.0 - (dx * dx + dy * dy) * 0.8;
                lightMap[x + y * Renderer.VIEW_WIDTH] = baseBrightness * Math.max(0.7, vign);
            }
        }

        const viewW = Renderer.VIEW_WIDTH * zoomFactor;
        const viewH = Renderer.VIEW_HEIGHT * zoomFactor;

        for (const m of miners) {
            if (!m.isAlive()) continue;
            if (m.x < cameraX - 100 || m.x > cameraX + viewW + 100 || m.y < cameraY - 100 || m.y > cameraY + viewH + 100) continue;
            
            // Headlamp position (slightly above center of miner)
            let mx = (m.x - cameraX) / zoomFactor;
            let my = (m.y - cameraY - 4) / zoomFactor;
            
            // Concentrated beam radius
            let scaledRadius = 40 / zoomFactor;
            let R = Math.ceil(scaledRadius);
            
            for (let dy = -R; dy <= R; dy++) {
                for (let dx = -R; dx <= R; dx++) {
                    let lx = Math.floor(mx + dx), ly = Math.floor(my + dy);
                    if (lx >= 0 && ly >= 0 && lx < Renderer.VIEW_WIDTH && ly < Renderer.VIEW_HEIGHT) {
                        let dist = Math.sqrt(dx * dx + dy * dy);
                        
                        if (dist < scaledRadius) {
                            // Conical beam logic
                            let angleFactor = 0.0;
                            const forwardValue = dx * m.direction; 
                            const relDist = dist / scaledRadius;
                            
                            if (forwardValue < 0) {
                                // Minimal glow around head
                                angleFactor = 0.08 * (1.0 - Math.abs(forwardValue) / (scaledRadius * 0.4));
                            } else {
                                // Sharp hotspot beam
                                // cos(theta) = forwardValue / dist
                                const cosTheta = forwardValue / (dist + 0.001);
                                angleFactor = 0.15 + 0.85 * Math.pow(cosTheta, 6); // Narrower cone
                            }
                            
                            // Light intensity formula
                            let light = (1.0 - relDist) * angleFactor;
                            if (light > 0) {
                                let lidx = lx + ly * Renderer.VIEW_WIDTH;
                                // More intense additive light
                                lightMap[lidx] = Math.min(1.2, lightMap[lidx] + light * 2.2);
                            }
                        }
                    }
                }
            }
        }

        // 2. Pass 1: Draw Terrain
        for (let y = 0; y < Renderer.VIEW_HEIGHT; y++) {
            const wy = Math.floor(cameraY + y * zoomFactor);
            for (let x = 0; x < Renderer.VIEW_WIDTH; x++) {
                const wx = Math.floor(cameraX + x * zoomFactor);
                const idx = (x + y * Renderer.VIEW_WIDTH) * 4;
                const brightness = lightMap[x + y * Renderer.VIEW_WIDTH];

                if (wx >= 0 && wy >= 0 && wx < world.width && wy < world.height) {
                    const col = worldPixels[wx | (wy << 10)];

                    if (col !== 0 && col !== World.COLOR_EMPTY) {
                        this.pixels[idx] = ((col >> 16) & 0xff) * brightness; // R
                        this.pixels[idx + 1] = ((col >> 8) & 0xff) * brightness; // G
                        this.pixels[idx + 2] = (col & 0xff) * brightness; // B
                    } else if (wy > world.getHeightAt(wx) + 3) {
                        this.pixels[idx] = 0x2b * brightness; // R
                        this.pixels[idx + 1] = 0x1e * brightness; // G
                        this.pixels[idx + 2] = 0x15 * brightness; // B
                    }
                } else if (wy >= 0) {
                    // Out of bounds - decide if it's bedrock or void
                    // Use a simple check: if we are below 'sky' level, draw bedrock
                    const sY = world.getHeightAt(Math.max(0, Math.min(world.width - 1, wx)));
                    if (wy > sY) {
                         this.pixels[idx] = 0x1a * brightness; // Dark Bedrock
                         this.pixels[idx + 1] = 0x1a * brightness;
                         this.pixels[idx + 2] = 0x1a * brightness;
                    }
                }
                this.pixels[idx + 3] = 255; // Always ensure alpha
            }
        }

        // 3. Pass 2: Draw Miners
        for (const m of miners) {
            if (!m.isAlive()) continue;
            if (m.x < cameraX - 10 || m.x > cameraX + viewW + 10 || m.y < cameraY - 10 || m.y > cameraY + viewH + 10) continue;

            const frame = m.getAnimationFrame();
            for (let dy = -8; dy <= 1; dy++) {
                const wy = m.y + dy;
                for (let dx = -3; dx <= 3; dx++) {
                    const wx = m.x + dx;
                    const charIdx = (dx * m.direction + 3) + (dy + 8) * 7 + frame * 70;
                    const pChar = World.SPRITES[charIdx];
                    if (pChar && pChar !== ' ') {
                        let mCol = 0x0000FF; // Clothes
                        if (pChar === '!') mCol = 0x00FF00;
                        else if (pChar === 'o') mCol = 0xDB8EAF;
                        else if (pChar === 'X') {
                            if (m.carryingGold) mCol = 0xFFFF00;
                            else continue;
                        } else if (pChar === '#') mCol = 0xFF0000;

                        const lX = Math.floor((wx - cameraX) / zoomFactor);
                        const lY = Math.floor((wy - cameraY) / zoomFactor);
                        if (lX >= 0 && lX < Renderer.VIEW_WIDTH && lY >= 0 && lY < Renderer.VIEW_HEIGHT) {
                            const br = lightMap[lX + lY * Renderer.VIEW_WIDTH];
                            const idx = (lX + lY * Renderer.VIEW_WIDTH) * 4;
                            this.pixels[idx] = ((mCol >> 16) & 0xff) * br;
                            this.pixels[idx + 1] = ((mCol >> 8) & 0xff) * br;
                            this.pixels[idx + 2] = (mCol & 0xff) * br;
                            this.pixels[idx + 3] = 255;
                        }
                    }
                }
            }
        }

        // 4. Pass 3: Particles
        for (const p of particles) {
            const sx = Math.floor((p.x - cameraX) / zoomFactor);
            const sy = Math.floor((p.y - cameraY) / zoomFactor);
            if (sx >= 0 && sy >= 0 && sx < Renderer.VIEW_WIDTH && sy < Renderer.VIEW_HEIGHT) {
                const idx = (sx + sy * Renderer.VIEW_WIDTH) * 4;
                this.pixels[idx] = (p.color >> 16) & 0xff;
                this.pixels[idx + 1] = (p.color >> 8) & 0xff;
                this.pixels[idx + 2] = p.color & 0xff;
            }
        }
        
        // Put buffer into offscreen canvas
        this.offscreenCtx.putImageData(this.imageData, 0, 0);
    }

    private renderSky(cameraY: number, zoomFactor: number): void {
        for (let y = 0; y < Renderer.VIEW_HEIGHT; y++) {
            const wy = cameraY + y * zoomFactor;
            const ratio = Math.max(0, Math.min(1.0, wy / 1000.0));
            const r = Math.floor(135 * (1 - ratio) + 25 * ratio);
            const g = Math.floor(206 * (1 - ratio) + 25 * ratio);
            const b = Math.floor(235 * (1 - ratio) + 112 * ratio);
            
            for (let x = 0; x < Renderer.VIEW_WIDTH; x++) {
                const idx = (x + y * Renderer.VIEW_WIDTH) * 4;
                this.pixels[idx] = r;
                this.pixels[idx + 1] = g;
                this.pixels[idx + 2] = b;
                this.pixels[idx + 3] = 255; // Alpha
            }
        }
    }

    public present(ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number) {
        // Draw the crisp 320x240 offscreen canvas onto the main screen without filtering (pixelated)
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(this.offscreenCanvas, 0, 0, canvasWidth, canvasHeight);
    }
}

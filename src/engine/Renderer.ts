import { World } from '../core/World';
import { Miner } from '../entities/Miner';
import { Particle } from '../entities/Particle';
import { FloatingText } from '../entities/FloatingText';

export enum GameState { MENU = 0, PLAYING = 1, PAUSED = 2, GAME_OVER = 3 }

export class Renderer {
    public static readonly VIEW_WIDTH = 320;
    public static readonly VIEW_HEIGHT = 240;

    private offscreenCanvas: HTMLCanvasElement;
    private offscreenCtx: CanvasRenderingContext2D;
    private imageData: ImageData;
    private pixels: Uint8ClampedArray;
    private shake: number = 0;

    constructor() {
        this.offscreenCanvas = document.createElement('canvas');
        this.offscreenCanvas.width = Renderer.VIEW_WIDTH;
        this.offscreenCanvas.height = Renderer.VIEW_HEIGHT;
        this.offscreenCtx = this.offscreenCanvas.getContext('2d')!;
        this.imageData = this.offscreenCtx.createImageData(Renderer.VIEW_WIDTH, Renderer.VIEW_HEIGHT);
        this.pixels = this.imageData.data;
    }

    public render(world: World, miners: Miner[], particles: Particle[], floatingTexts: FloatingText[], cameraX: number, cameraY: number, zoomFactor: number = 1.0): void {
        this.renderSky(cameraX, cameraY, zoomFactor);
        const worldPixels = world.pixels;
        const viewW = Renderer.VIEW_WIDTH * zoomFactor;
        const viewH = Renderer.VIEW_HEIGHT * zoomFactor;

        // 1. Pre-calculate Light Map (320x240)
        const lightMap = new Float32Array(Renderer.VIEW_WIDTH * Renderer.VIEW_HEIGHT);
        
        // Ambient & Sky Light Pass
        for (let y = 0; y < Renderer.VIEW_HEIGHT; y++) {
            const wy = cameraY + y * zoomFactor;
            const ratio = Math.max(0, Math.min(1.0, wy / (world.height * 0.8)));
            const baseBrightness = 1.0 * (1.0 - ratio) + 0.4 * ratio;
            
            // Vignette for depth feel
            const dy = (y / Renderer.VIEW_HEIGHT) - 0.5;
            for (let x = 0; x < Renderer.VIEW_WIDTH; x++) {
                const dx = (x / Renderer.VIEW_WIDTH) - 0.5;
                const vign = 1.0 - (dx * dx + dy * dy) * 0.4;
                lightMap[x + y * Renderer.VIEW_WIDTH] = baseBrightness * vign;
            }
        }
        // Miner Headlamp Pass (Dynamic Directional Lights)
        for (const m of miners) {
            if (!m.isAlive()) continue;
            // Cull miners far from view
            if (m.x < cameraX - 200 || m.x > cameraX + viewW + 200) continue;
            
            let mx = (m.x - cameraX) / zoomFactor;
            let my = (m.y - cameraY - 4) / zoomFactor;
            let scaledRadius = 40 / zoomFactor;
            let R = Math.ceil(scaledRadius);
            
            for (let dy = -R; dy <= R; dy++) {
                for (let dx = -R; dx <= R; dx++) {
                    let lx = Math.floor(mx + dx), ly = Math.floor(my + dy);
                    if (lx >= 0 && ly >= 0 && lx < Renderer.VIEW_WIDTH && ly < Renderer.VIEW_HEIGHT) {
                        let dist = Math.sqrt(dx * dx + dy * dy);
                        if (dist < scaledRadius) {
                            const forwardValue = dx * m.direction; 
                            const relDist = dist / scaledRadius;
                            let angleFactor = 0.0;
                            
                            if (forwardValue < 0) {
                                // Subtle glow behind miner - reduced
                                angleFactor = 0.05 * (1.0 - Math.abs(forwardValue) / (scaledRadius));
                            } else {
                                // Softer beam forward
                                const cosTheta = forwardValue / (dist + 0.001);
                                angleFactor = 0.1 + 0.5 * Math.pow(cosTheta, 6);
                            }
                            
                            // Much lower intensity multiplier (0.6 instead of 1.5)
                            let light = (1.0 - relDist) * angleFactor * 0.6;
                            
                            const lidx = lx + ly * Renderer.VIEW_WIDTH;
                            lightMap[lidx] += light;
                            
                            // Cap brightness to avoid "burning" out the pixels
                            if (lightMap[lidx] > 1.25) lightMap[lidx] = 1.25;
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
                        let r = ((col >> 16) & 0xff) * brightness;
                        let g = ((col >> 8) & 0xff) * brightness;
                        let b = (col & 0xff) * brightness;

                        // Gold Glow Juice
                        if (col === World.COLOR_GOLD_PIXEL || col === World.COLOR_GOLD_DEPOSIT) {
                             const glow = 1.0 + Math.sin(Date.now() * 0.01) * 0.1;
                             r = Math.min(255, r * glow * 1.2);
                             g = Math.min(255, g * glow * 1.2);
                        }

                        this.pixels[idx] = r;
                        this.pixels[idx + 1] = g;
                        this.pixels[idx + 2] = b;
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

            // DYNAMIC ANIMATION OFFSETS
            let animYOffset = 0;
            if (m.isAlive() && m.jumpVelocity === -1) {
                // Bobbing while walking
                animYOffset = Math.sin(m.walkAnimationStep * (Math.PI / 8)) * 1.5;
            }
            
            // Squash/Stretch factor for jumping
            let squash = 1.0;
            if (m.jumpVelocity > 0) {
                squash = 1.0 - (m.jumpVelocity / 32); // Simple squash at peak/jump
            }

            for (let dy = -8; dy <= 1; dy++) {
                const wy = m.y + dy * squash + animYOffset;
                for (let dx = -3; dx <= 3; dx++) {
                    const wx = m.x + dx;
                    const charIdx = (dx * m.direction + 3) + (dy + 8) * 7 + frame * 70;
                    const pChar = World.SPRITES[charIdx];
                    if (pChar && pChar !== ' ') {
                        let mCol = 0x2244AA; // Deep Blue Clothes
                        if (pChar === '!') mCol = 0xFF5500; // Bright Orange Hat
                        else if (pChar === 'o') mCol = 0xFFCCAA; // Better Skin Tone
                        else if (pChar === 'X') {
                            if (m.carryingGold) mCol = 0xFFDE00; // Gold Glow Color
                            else continue;
                        } else if (pChar === '#') mCol = 0xAA0000; // Dark Blood
                        else if (pChar === '*') mCol = 0x443322; // Brown Boots/Belt

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
                const alpha = p.getAlpha();
                const lidx = sx + sy * Renderer.VIEW_WIDTH;
                const br = lightMap[lidx];
                
                // Emisivity check
                let pr = (p.color >> 16) & 0xff;
                let pg = (p.color >> 8) & 0xff;
                let pb = p.color & 0xff;
                
                // Is it a spark or gold? They emit light!
                const isEmissive = (p.color === 0xFFFFFFCC || p.color === World.COLOR_GOLD_PIXEL);
                if (!isEmissive) {
                    pr *= br; pg *= br; pb *= br;
                } else {
                    // Sparks are extra bright
                    pr = Math.min(255, pr * 1.5);
                    pg = Math.min(255, pg * 1.5);
                }

                if (alpha >= 0.95) {
                    this.pixels[idx] = pr;
                    this.pixels[idx + 1] = pg;
                    this.pixels[idx + 2] = pb;
                } else {
                    // Alpha blending
                    this.pixels[idx] = Math.floor(this.pixels[idx] * (1 - alpha) + pr * alpha);
                    this.pixels[idx + 1] = Math.floor(this.pixels[idx + 1] * (1 - alpha) + pg * alpha);
                    this.pixels[idx + 2] = Math.floor(this.pixels[idx + 2] * (1 - alpha) + pb * alpha);
                }
            }
        }
        
        // Put buffer into offscreen canvas
        this.offscreenCtx.putImageData(this.imageData, 0, 0);

        // 5. Pass 4: Floating Texts (Low-res style)
        this.offscreenCtx.font = "8px 'Press Start 2P'";
        this.offscreenCtx.textAlign = 'center';
        for (const ft of floatingTexts) {
            const sx = Math.floor((ft.x - cameraX) / zoomFactor);
            const sy = Math.floor((ft.y - cameraY) / zoomFactor);
            if (sx >= -50 && sy >= -50 && sx < Renderer.VIEW_WIDTH + 50 && sy < Renderer.VIEW_HEIGHT + 50) {
               this.offscreenCtx.fillStyle = ft.color;
               this.offscreenCtx.globalAlpha = ft.getOpacity();
               this.offscreenCtx.fillText(ft.text, sx, sy);
            }
        }
        this.offscreenCtx.globalAlpha = 1.0;
    }

    private renderSky(cameraX: number, cameraY: number, zoomFactor: number): void {
        // Happy Daylight colors
        const skyBaseR = 100, skyBaseG = 180, skyBaseB = 255; // Vibrant Sky Blue
        const horizonR = 210, horizonG = 240, horizonB = 255; // Atmospheric Horizon

        for (let y = 0; y < Renderer.VIEW_HEIGHT; y++) {
            const wy = cameraY + y * zoomFactor;
            // Power curve for more sky at the top
            const ratio = Math.pow(Math.max(0, Math.min(1.0, wy / 1100.0)), 0.8);
            
            // Background Gradient
            const r = Math.floor(skyBaseR * (1 - ratio) + horizonR * ratio); 
            const g = Math.floor(skyBaseG * (1 - ratio) + horizonG * ratio);
            const b = Math.floor(skyBaseB * (1 - ratio) + horizonB * ratio);
            
            for (let x = 0; x < Renderer.VIEW_WIDTH; x++) {
                const idx = (x + y * Renderer.VIEW_WIDTH) * 4;
                const wx = (cameraX + x * zoomFactor); 
                
                let cr = r, cg = g, cb = b;

                // 1. Stylized Discrete Clouds
                if (wy < 600) {
                    // We define 5-6 fixed cloud "lanes" in the world
                    for (let i = 0; i < 5; i++) {
                        const laneY = 100 + i * 120;
                        const laneSpeed = 0.5 + i * 0.2;
                        // Use a modulo to repeat clouds horizontally
                        const worldX = (wx * laneSpeed) % 800;
                        
                        // Simple circular cluster logic
                        const dx = worldX - 400;
                        const dy = wy - laneY;
                        const distSq = dx * dx + (dy * dy * 4); // Flattened ellipse
                        
                        if (distSq < 2500) { // Main body
                            const alpha = 0.9;
                            cr = Math.floor(cr * (1 - alpha) + 255 * alpha);
                            cg = Math.floor(cg * (1 - alpha) + 255 * alpha);
                            cb = Math.floor(cb * (1 - alpha) + 255 * alpha);
                        } else if (distSq < 4500) { // Softer edge
                            const alpha = 0.4;
                            cr = Math.floor(cr * (1 - alpha) + 255 * alpha);
                            cg = Math.floor(cg * (1 - alpha) + 255 * alpha);
                            cb = Math.floor(cb * (1 - alpha) + 255 * alpha);
                        }
                    }
                }

                // 2. Far Mountains (Distat greenish-blue) - Parallax factor 0.1
                const farX = wx * 0.1;
                const farMountHeight = 150 - Math.sin((farX * 0.05) + 2.0) * 20 - Math.cos((farX * 0.02)) * 10;
                if (wy > farMountHeight && wy < 1000) {
                    const mountRatio = 0.9; // Very subtle far away
                    cr = Math.floor(cr * mountRatio + 120 * (1 - mountRatio));
                    cg = Math.floor(cg * mountRatio + 160 * (1 - mountRatio));
                    cb = Math.floor(cb * mountRatio + 180 * (1 - mountRatio));
                }

                // 3. Near Mountains (Hills) - Parallax factor 0.3
                const nearX = wx * 0.3;
                const nearMountHeight = 175 - Math.sin((nearX * 0.1) + 5.0) * 15 - Math.cos((nearX * 0.04)) * 8;
                if (wy > nearMountHeight && wy < 1000) {
                    const mountRatio = 0.7;
                    cr = Math.floor(cr * mountRatio + 80 * (1 - mountRatio));
                    cg = Math.floor(cg * mountRatio + 120 * (1 - mountRatio));
                    cb = Math.floor(cb * mountRatio + 80 * (1 - mountRatio)); // Greenish hills
                }

                this.pixels[idx] = cr;
                this.pixels[idx + 1] = cg;
                this.pixels[idx + 2] = cb;
                this.pixels[idx + 3] = 255;
            }
        }
    }

    public setShake(intensity: number) {
        this.shake = intensity;
    }

    public present(ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number) {
        // Apply screen shake
        let offsetX = 0;
        let offsetY = 0;
        if (this.shake > 0) {
            offsetX = (Math.random() - 0.5) * this.shake * 10;
            offsetY = (Math.random() - 0.5) * this.shake * 10;
            this.shake *= 0.9; // Decay
            if (this.shake < 0.1) this.shake = 0;
        }

        // Draw the crisp 320x240 offscreen canvas onto the main screen without filtering (pixelated)
        ctx.imageSmoothingEnabled = false;
        ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset
        ctx.translate(offsetX, offsetY);
        ctx.drawImage(this.offscreenCanvas, 0, 0, canvasWidth, canvasHeight);
        ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform back
    }
}

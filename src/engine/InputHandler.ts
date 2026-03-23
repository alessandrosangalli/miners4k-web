export type TouchMode = 'drag' | 'dig' | 'build';

export class InputHandler {
    private keys: Set<string> = new Set();
    public xMouse: number = 0;
    public yMouse: number = 0;
    public mouseButton: number = 0;
    public mouseWheelRotation: number = 0;
    
    // Touch / Pan state
    public panDeltaX: number = 0;
    public panDeltaY: number = 0;
    public touchMode: TouchMode = 'drag'; 
    
    private pointers: Map<number, {x: number, y: number}> = new Map();
    private initialPinchDistance: number | null = null;
    private lastPanX: number | null = null;
    private lastPanY: number | null = null;
    private pendingTouchDig: boolean = false; // prevents 2-finger start from digging
    public resetLastPosition: boolean = false;

    constructor(canvas: HTMLCanvasElement) {
        window.addEventListener('keydown', (e) => this.keys.add(e.code));
        window.addEventListener('keyup', (e) => this.keys.delete(e.code));
        window.addEventListener('blur', () => {
            this.keys.clear();
            this.mouseButton = 0;
            this.pointers.clear();
        });

        // Use Pointer Events for hybrid mouse/touch
        canvas.addEventListener('pointerdown', (e) => this.onPointerDown(e, canvas));
        window.addEventListener('pointermove', (e) => this.onPointerMove(e, canvas));
        window.addEventListener('pointerup', (e) => this.onPointerUp(e));
        window.addEventListener('pointercancel', (e) => this.onPointerUp(e));

        canvas.addEventListener('contextmenu', (e) => e.preventDefault());

        canvas.addEventListener('wheel', (e) => {
            this.mouseWheelRotation += e.deltaY;
            e.preventDefault();
        }, { passive: false });
        
        // Touch default behaviors disable
        canvas.style.touchAction = 'none';
    }

    private onPointerDown(e: PointerEvent, canvas: HTMLCanvasElement) {
        this.resetLastPosition = true;
        if (e.pointerType === 'mouse') {
            this.updateMousePosition(e, canvas);
            this.mouseButton = e.button === 2 ? 3 : 1;
        } else {
            this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
            
            if (this.pointers.size === 1) {
                this.updateMousePosition(e, canvas);
                // Don't start digging yet — wait until move confirms this is
                // truly a single-finger gesture (not the start of a 2-finger pan)
                this.pendingTouchDig = true;
                this.mouseButton = 0;
            } else if (this.pointers.size >= 2) {
                // Multi-touch: cancel any pending dig, start pan/pinch
                this.pendingTouchDig = false;
                this.mouseButton = 0;
                this.initialPinchDistance = this.getPinchDistance();
                
                const pts = Array.from(this.pointers.values());
                this.lastPanX = (pts[0].x + pts[1].x) / 2;
                this.lastPanY = (pts[0].y + pts[1].y) / 2;
            }
        }
        
        if (e.target instanceof Element) {
            e.target.setPointerCapture(e.pointerId);
        }
    }

    private onPointerMove(e: PointerEvent, canvas: HTMLCanvasElement) {
        if (e.pointerType === 'mouse') {
            this.updateMousePosition(e, canvas);
        } else {
            if (!this.pointers.has(e.pointerId)) return;
            this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

            if (this.pointers.size === 1) {
                this.updateMousePosition(e, canvas);
                // Confirm action only once we have actual movement with 1 finger
                if (this.pendingTouchDig) {
                    this.mouseButton = (this.touchMode === 'build') ? 3 : 1;
                    this.pendingTouchDig = false;
                }
            } else if (this.pointers.size === 2) {
                const pts = Array.from(this.pointers.values());
                const centerX = (pts[0].x + pts[1].x) / 2;
                const centerY = (pts[0].y + pts[1].y) / 2;

                // 2-Finger Pan
                if (this.lastPanX !== null && this.lastPanY !== null) {
                    this.panDeltaX += (centerX - this.lastPanX);
                    this.panDeltaY += (centerY - this.lastPanY);
                }
                this.lastPanX = centerX;
                this.lastPanY = centerY;

                // 2-Finger Pinch (Zoom)
                const dist = this.getPinchDistance();
                if (this.initialPinchDistance !== null && dist > 0) {
                    const diff = this.initialPinchDistance - dist;
                    this.mouseWheelRotation += diff * 4; 
                    this.initialPinchDistance = dist;
                }
            }
        }
    }

    private onPointerUp(e: PointerEvent) {
        if (e.pointerType === 'mouse') {
            this.mouseButton = 0;
        } else {
            this.pointers.delete(e.pointerId);
            this.pendingTouchDig = false; // always cancel on lift
            if (this.pointers.size < 2) {
                this.initialPinchDistance = null;
                this.lastPanX = null;
                this.lastPanY = null;
            }
            if (this.pointers.size === 0) {
                this.mouseButton = 0;
            }
        }
    }

    private getPinchDistance(): number {
        const pts = Array.from(this.pointers.values());
        if (pts.length < 2) return 0;
        const dx = pts[0].x - pts[1].x;
        const dy = pts[0].y - pts[1].y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    private updateMousePosition(e: PointerEvent, canvas: HTMLCanvasElement) {
        const rect = canvas.getBoundingClientRect();
        this.xMouse = (e.clientX - rect.left) / rect.width;
        this.yMouse = (e.clientY - rect.top) / rect.height;
    }

    public isKeyPressed(code: string): boolean {
        return this.keys.has(code);
    }
    
    public getAndClearPanDelta(): { dx: number, dy: number } {
        const dx = this.panDeltaX;
        const dy = this.panDeltaY;
        this.panDeltaX = 0;
        this.panDeltaY = 0;
        return { dx, dy };
    }
}

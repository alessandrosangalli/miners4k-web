export class InputHandler {
    private keys: Set<string> = new Set();
    public xMouse: number = 0;
    public yMouse: number = 0;
    public mouseButton: number = 0;
    public mouseWheelRotation: number = 0;

    constructor(canvas: HTMLCanvasElement) {
        window.addEventListener('keydown', (e) => this.keys.add(e.code));
        window.addEventListener('keyup', (e) => this.keys.delete(e.code));
        window.addEventListener('blur', () => {
            this.keys.clear();
            this.mouseButton = 0;
        });

        const updateMousePosition = (e: MouseEvent) => {
            const rect = canvas.getBoundingClientRect();
            // Store relative normalized coordinates (0.0 to 1.0)
            this.xMouse = (e.clientX - rect.left) / rect.width;
            this.yMouse = (e.clientY - rect.top) / rect.height;
        };

        window.addEventListener('mousemove', (e) => updateMousePosition(e as MouseEvent));

        canvas.addEventListener('mousedown', (e) => {
            updateMousePosition(e);
            this.mouseButton = e.button === 2 ? 3 : 1;
        });

        window.addEventListener('mouseup', () => {
            this.mouseButton = 0;
        });

        canvas.addEventListener('contextmenu', (e) => e.preventDefault());

        canvas.addEventListener('wheel', (e) => {
            this.mouseWheelRotation = e.deltaY;
            e.preventDefault();
        }, { passive: false });
    }

    public isKeyPressed(code: string): boolean {
        return this.keys.has(code);
    }
}

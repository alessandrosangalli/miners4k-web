export const Material = {
    EMPTY: 0,
    DIRT: 1,
    ROCK: 2,
    GOLD: 3,
    SLIME: 4
};

export class World {
    constructor(levelIndex) {
        this.width = (Math.floor(levelIndex / 4) * 384) + 640;
        this.height = (levelIndex > 1) ? 1024 : 480;
        if (levelIndex === 6) this.height = 2048;

        this.pixels = new Int32Array(this.width * this.height);
        this.materials = new Uint8Array(this.width * this.height);
        this.heightmap = new Int32Array(this.width);
        
        this.targetGold = levelIndex * 500;
        if (levelIndex === 0) this.targetGold = 100;
        if (levelIndex === 1) this.targetGold = 200;
        
        this.timeLimit = this.targetGold * 2;
        this.generateLevel(levelIndex);
    }

    getIndex(x, y) {
        return x + y * this.width;
    }

    generateLevel(currentLevel) {
        const h = new Int32Array(this.width);
        const midPoint = Math.floor(this.width / 2);
        h[0] = 200; h[midPoint] = 200;
        
        for (let i = midPoint; i > 1; i = Math.floor(i / 2)) {
            for (let p = 0; p < this.width; p += i) {
                const d0 = h[p];
                const d1 = h[(p + i) % this.width];
                h[p + Math.floor(i / 2)] = Math.floor((d0 + d1) / 2 + (Math.floor(Math.random() * i) - Math.floor(i / 2)) / 4);
            }
        }
        for (let x = 0; x < 88; x++) {
            h[x] = h[88] - 2;
            const rightX = this.width - x - 1;
            if (rightX >= 0) h[rightX] = h[this.width - 88 - 1] - 2;
        }
        this.heightmap.set(h);

        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const i = this.getIndex(x, y);
                let br = 1.2 - (Math.random() - 0.5) * Math.random() * Math.random() * 0.6;
                br *= (1.0 - y / 6048.0);

                if (x < 8 || x >= this.width - 8 || y >= this.height - 8) {
                    const c = Math.floor(180 * br);
                    this.pixels[i] = 0xff000000 | (c << 16) | (c << 8) | c;
                    this.materials[i] = Material.ROCK;
                } else if (y < h[x]) {
                    this.pixels[i] = World.COLOR_EMPTY;
                    this.materials[i] = Material.EMPTY;
                } else {
                    let r = Math.floor(111 * br);
                    let g = Math.floor(92 * br);
                    let b = Math.floor(51 * br);
                    if (y < h[x] + 4) {
                        r = Math.floor(44 * br); g = Math.floor(148 * br); b = Math.floor(49 * br);
                        if (x < 88 || x > this.width - 89) { r = g = b; }
                    }
                    this.pixels[i] = 0xff000000 | (r << 16) | (g << 8) | b;
                    this.materials[i] = Material.DIRT;
                }
            }
        }

        let goldLumps = currentLevel * currentLevel * 50;
        let rocks = Math.floor((currentLevel - 1) / 2) * 100;
        if (currentLevel === 0) { goldLumps = 10; rocks = 0; }
        if (currentLevel === 1) { goldLumps = 30; rocks = 10; }
        const slimeCount = (currentLevel === 3 ? 6 : (currentLevel === 4 ? 10 : (currentLevel === 5 ? 25 : 0)));

        for (let i = 0; i < goldLumps + rocks + slimeCount; i++) {
            const x = Math.floor(Math.random() * (this.width - 40)) + 20;
            const y0 = Math.floor(Math.random() * (this.height - 240)) + 200;
            const y1 = Math.floor(Math.random() * (this.height - 240)) + 200;
            const y2 = Math.floor(Math.random() * (this.height - 240)) + 200;
            const y = Math.max(y2, Math.max(y0, y1));

            let type = 0; // Gold
            let size = Math.floor(Math.random() * 8) + 4;
            if (i >= goldLumps) {
                type = 1; // Rocks
                size = Math.floor(Math.random() * 32) + 8;
                if (i >= goldLumps + rocks) {
                    type = 2; // Slime
                    size = 6;
                }
            }

            for (let xx = x - size; xx <= x + size; xx++) {
                for (let yy = y - size; yy <= y + size; yy++) {
                    const d = (xx - x) * (xx - x) + (yy - y) * (yy - y);
                    if (xx >= 0 && yy >= 0 && xx < this.width && yy < this.height && d < size * size) {
                        const idx = this.getIndex(xx, yy);
                        if (this.materials[idx] !== Material.EMPTY) {
                            if (type === 0) {
                                this.pixels[idx] = 0xffffff00 | 0;
                                this.materials[idx] = Material.GOLD;
                            }
                            else if (type === 1) {
                                const d2 = Math.floor(((xx - x + size / 3.0) * (xx - x + size / 3.0) / size / size + (yy - y + size / 3.0) * (yy - y + size / 3.0) / size / size) * 64);
                                const c = 200 - d2 - Math.floor(Math.random() * 16);
                                this.pixels[idx] = (0xff000000 | (c << 16) | (c << 8) | c) | 0;
                                this.materials[idx] = Material.ROCK;
                            }
                            else if (type === 2) {
                                this.pixels[idx] = 0xff00ff00 | 0;
                                this.materials[idx] = Material.SLIME;
                            }
                        }
                    }
                }
            }
        }
    }

    setPixel(x, y, color, material = Material.DIRT) {
        if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
            const idx = this.getIndex(x, y);
            this.pixels[idx] = color;
            this.materials[idx] = material;
            if (color === World.COLOR_EMPTY || color === 0) {
                this.materials[idx] = Material.EMPTY;
            }
        }
    }

    getMaterial(x, y) {
        if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
            return this.materials[this.getIndex(x, y)];
        }
        return Material.ROCK; // Bounds act as solid rock walls in professional handling
    }

    getPixel(x, y) {
        if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
            return this.pixels[this.getIndex(x, y)];
        }
        return World.COLOR_EMPTY;
    }

    getHeightAt(x) {
        if (x >= 0 && x < this.width) return this.heightmap[x];
        return 200;
    }
}
World.COLOR_EMPTY = 0x00000000 | 0;
World.COLOR_GOLD_CHUNK = 0xFFFFFF00 | 0;
World.COLOR_GOLD_PIXEL = 0xFFFFFF00 | 0;
World.COLOR_GOLD_DEPOSIT = 0xFFFEFE00 | 0;
World.COLOR_SLIME_PIXEL = 0xFF00FF00 | 0;
World.COLOR_ROCK = 0xFF888888 | 0;
World.COLOR_BLOOD = 0xFFFF0000 | 0;
World.SPRITES = (
    " !!!!  " + " !oooo " + " !oooo " + "  **   " + "  **XX " + "  o*XX " + "  **   " + "  **   " + "  **   " + "  ooo  " + 
    "  !    " + " !!!!  " + " !oooo " + "  oooo " + "  **XXX" + "  *oXXX" + "  **** " + " ** ** " + "**   oo" + "oo     " + 
    "  !!!  " + " !oooo " + "!!oooo " + "  ** XX" + "  ***oX" + "  ** XX" + "  ***  " + " ***** " + "o** ** " + "o    oo" + 
    " !!!!  " + "!!oooo " + " !oooo " + "  **   " + "  **XXX" + "  *oXXX" + "  **   " + " o***  " + "  o**  " + "    oo " +
    " !!!!  " + " !oooo " + " !oooo " + "  **   " + "  **XX " + "  o*XX " + "  **   " + "  **   " + "  **   " + "  ooo  " + 
    "  !    " + " !!!!  " + " !oooo " + "  oooo " + "  **XXX" + "  *oXXX" + "  **** " + " ** ** " + "**   oo" + "oo     " + 
    "  !!!  " + " !oooo " + "!!oooo " + "  ** XX" + "  ***oX" + "  ** XX" + "  ***  " + " ***** " + "o** ** " + "o    oo" + 
    " !!!!  " + "!!oooo " + " !oooo " + "  **   " + "  **XXX" + "  *oXXX" + "  **   " + " o***  " + "  o**  " + "    oo " +
    " !!!!  " + " !oooo " + " !oooo " + "  **   " + "  **XX " + "  o*XX " + "  **   " + "  **   " + "  **   " + "  ooo  " + 
    "  !    " + " !!!!  " + " !oooo " + "  oooo " + "  **XXX" + "  *oXXX" + "  **** " + " ** ** " + "**   oo" + "oo     " + 
    " !!!!  " + " !oooo " + " !oooo " + "  **   " + "  **XX " + "  o*XX " + "  **   " + "  **   " + "  **   " + "  ooo  " + 
    "  !    " + " !!!!  " + " !oooo " + "  oooo " + "  **XXX" + "  *oXXX" + "  **** " + " ** ** " + "**   oo" + "oo     " + 
    "  !!!  " + " !oooo " + "!!oooo " + "  ** XX" + "  ***oX" + "  ** XX" + "  ***  " + " ***** " + "o** ** " + "o    oo" + 
    " !!!!  " + "!!oooo " + " !oooo " + "  **   " + "  **XXX" + "  *oXXX" + "  **   " + " o***  " + "  o**  " + "    oo " +
    " !!!!  " + " !oooo " + " !oooo " + "  **   " + "  **XX " + "  o*XX " + "  **   " + "  **   " + "  **   " + "  ooo  " + 
    "  !    " + " !!!!  " + " !oooo " + "  oooo " + "  **XXX" + "  *oXXX" + "  **** " + " ** ** " + "**   oo" + "oo     " + 
    "  !!!  " + " !oooo " + "!!oooo " + "  ** XX" + "  ***oX" + "  ** XX" + "  ***  " + " ***** " + "o** ** " + "o    oo" + 
    " !!!!  " + "!!oooo " + " !oooo " + "  **   " + "  **XXX" + "  *oXXX" + "  **   " + " o***  " + "  o**  " + "    oo " +
    " !!!!  " + " !oooo " + " !oooo " + "  **   " + "  **XX " + "  o*XX " + "  **   " + "  **   " + "  **   " + "  ooo  " + 
    "  !    " + " !!!!  " + " !oooo " + "  oooo " + "  **XXX" + "  *oXXX" + "  **** " + " ** ** " + "**   oo" + "oo     " + 
    " !!!!  " + " !oooo " + " !oooo " + "  **   " + "  **XX " + "  o*XX " + "  **   " + "  **   " + "  **   " + "  ooo  " + 
    "  !    " + " !!!!  " + " !oooo " + "  oooo " + "  **XXX" + "  *oXXX" + "  **** " + " ** ** " + "**   oo" + "oo     " + 
    "  !!!  " + " !oooo " + "!!oooo " + "  ** XX" + "  ***oX" + "  ** XX" + "  ***  " + " ***** " + "o** ** " + "o    oo" + 
    " !!!!  " + "!!oooo " + " !oooo " + "  **   " + "  **XXX" + "  *oXXX" + "  **   " + " o***  " + "  o**  " + "    oo " +
    " !!!!  " + " !oooo " + " !oooo " + "  **   " + "  **XX " + "  o*XX " + "  **   " + "  **   " + "  **   " + "  ooo  " + 
    "  !    " + " !!!!  " + " !oooo " + "  oooo " + "  **XXX" + "  *oXXX" + "  **** " + " ** ** " + "**   oo" + "oo     " + 
    "  !!!  " + " !oooo " + "!!oooo " + "  ** XX" + "  ***oX" + "  ** XX" + "  ***  " + " ***** " + "o** ** " + "o    oo" + 
    " !!!!  " + "!!oooo " + " !oooo " + "  **   " + "  **XXX" + "  *oXXX" + "  **   " + " o***  " + "  o**  " + "    oo " +
    " !!!!  " + " !oooo " + " !oooo " + "  **   " + "  **XX " + "  o*XX " + "  **   " + "  **   " + "  **   " + "  ooo  " + 
    "  !    " + " !!!!  " + " !oooo " + "  oooo " + "  **XXX" + "  *oXXX" + "  **** " + " ** ** " + "**   oo" + "oo     " + 
    " !!!!  " + " !oooo " + " !oooo " + "  **   " + "  **XX " + "  o*XX " + "  **   " + "  **   " + "  **   " + "  ooo  " + 
    "  !    " + " !!!!  " + " !oooo " + "  oooo " + "  **XXX" + "  *oXXX" + "  **** " + " ** ** " + "**   oo" + "oo     " + 
    "  !!!  " + " !oooo " + "!!oooo " + "  ** XX" + "  ***oX" + "  ** XX" + "  ***  " + " ***** " + "o** ** " + "o    oo" + 
    " !!!!  " + "!!oooo " + " !oooo " + "  **   " + "  **XXX" + "  *oXXX" + "  **   " + " o***  " + "  o**  " + "    oo " +
    " !!!!  " + " !oooo " + " !oooo " + "  **   " + "  **XX " + "  o*XX " + "  **   " + "  **   " + "  **   " + "  ooo  " + 
    "  !    " + " !!!!  " + " !oooo " + "  oooo " + "  **XXX" + "  *oXXX" + "  **** " + " ** ** " + "**   oo" + "oo     " 
).split("");

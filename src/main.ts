import './style.css'
import { Game } from './core/Game'

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <canvas id="gameCanvas" width="1024" height="768"></canvas>
`

const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
const game = new Game(canvas);

console.log("Miners4k Web Engine Initialized and Loop Started!");

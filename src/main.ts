import './style.css'
import { Game } from './core/Game'

const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
const game = new Game(canvas);

console.log("Miners4k Web Engine Initialized and Loop Started!");

// main.js - punto de entrada
import MenuScene from './scenes/MenuScene.js';
import PuzzleScene from './scenes/PuzzleScene.js';
import PuzzleScene2 from './scenes/PuzzleScene2.js';
//import JigsawScene from './scenes/JigsawScene.js';
import FinalScene from './scenes/FinalScene.js';

const config = {
  type: Phaser.AUTO,
  width: 720,            // <- nuevo tamaño lógico más grande
  height: 1080,            // <- nuevo tamaño lógico (16:9)
  parent: 'phaser-example',
  transparent: true, 
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [ MenuScene, PuzzleScene,PuzzleScene2, FinalScene]
};

const game = new Phaser.Game(config);
export default game;

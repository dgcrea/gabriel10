// main.js - punto de entrada
import MenuScene from './scenes/MenuScene.js';
import PuzzleScene from './scenes/PuzzleScene.js';
import JigsawScene from './scenes/JigsawScene.js';

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
  scene: [ MenuScene, PuzzleScene, JigsawScene ]
};

const game = new Phaser.Game(config);
export default game;

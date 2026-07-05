// main.js - punto de entrada
import MenuScene from './scenes/MenuScene.js';
import PuzzleScene from './scenes/PuzzleScene.js';
import JigsawScene from './scenes/JigsawScene.js';

const config = {
  type: Phaser.AUTO,
  width: 540,
  height: 960,
  parent: 'phaser-example',

  transparent: true, 
  // Orden de escenas: BootScene -> MenuScene -> PuzzleScene
   scene: [ MenuScene, PuzzleScene, JigsawScene ] 
};

const game = new Phaser.Game(config);
export default game;
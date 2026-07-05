// src/scenes/FinalScene.js
export default class FinalScene extends Phaser.Scene {
  constructor() {
    super({ key:'FinalScene'});
  }

  preload(){
    // Reemplaza 'copa' por tu nombre clave y ajusta el frameWidth y frameHeight si hace falta
     this.load.video('final', 'assets/gabi.mp4');
  }

  create() {
 // animación de la copa
    // Añade el video en las coordenadas (400, 300) y lo reproduce
    let video = this.add.video(100, 200, 'final');

    video.setOrigin(0, 0);

    // Escalar al 50% del tamaño original
    video.setScale(0.5);
    video.play();
  }
}
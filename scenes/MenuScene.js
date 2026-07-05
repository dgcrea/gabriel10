// MenuScene.js
import { MAX_LEVELS, STORAGE_KEY_MAX_UNLOCKED } from '../config.js';

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  preload(){
    // Reemplaza 'copa' por tu nombre clave y ajusta el frameWidth y frameHeight si hace falta
    this.load.spritesheet('copa', 'assets/tropy.png', { frameWidth: 288, frameHeight: 480 });
  }

  create() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Inicializar progreso si no existe
    if (!localStorage.getItem(STORAGE_KEY_MAX_UNLOCKED)) {
      localStorage.setItem(STORAGE_KEY_MAX_UNLOCKED, '1');
    }

    // Texto principal
    const titleStyle = {
      fontFamily: 'Trebuchet MS',
      fontSize: '28px',
      color: '#000',
      align: 'center',
      backgroundColor: 'rgba(255,255,255,0.9)',
      wordWrap: { width: 500, useAdvancedWrap: true }
    };
    this.add.text(width / 2, height * 0.2,
      'Gabriel, hoy es un día de celebración, y temos un reto para tí, resuelve los siguientes desafíos y encuentra el mensaje secreto.🤫',
      titleStyle).setOrigin(0.5);

    // Leer progreso (default 1 desbloqueado)
    const maxUnlocked = parseInt(localStorage.getItem(STORAGE_KEY_MAX_UNLOCKED) || '1', 10);

    // Botón Jugar (rect + texto)
    const buttonW = 220;
    const buttonH = 60;
    const btnX = width / 2;
    const btnY = height / 2.5;

    const rect = this.add.rectangle(btnX, btnY, buttonW, buttonH, 0xcc0000).setStrokeStyle(2, 0x000000);
    rect.setInteractive({ useHandCursor: true });

    const btnText = this.add.text(btnX, btnY, '¡VAMOS!', { fontFamily: 'Trebuchet MS', fontSize: '24px', color: '#ffffff' }).setOrigin(0.5);

    // Hover / click effects
    rect.on('pointerover', () => rect.setFillStyle(0xaa0000));
    rect.on('pointerout',  () => rect.setFillStyle(0xcc0000));

    rect.on('pointerdown', () => {
      // pequeño efecto y luego iniciar el nivel 1
      this.tweens.add({
        targets: rect,
        scaleX: 0.96,
        scaleY: 0.96,
        duration: 80,
        yoyo: true,
        onComplete: () => {
          this.scene.start('PuzzleScene', { level: 1 });
        }
      });
    });

    // Mostrar niveles en 2 filas: 1..5 y 6..10
   /**  const cols = 5;
    const rows = 2;
    const startY = btnY + 70;            // y base debajo del botón "Jugar"
    const rowSpacing = 64;               // separación vertical entre filas
    const spacingX = width / (cols + 1); // separación horizontal calculada automáticamente

    let level = 1;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (level > MAX_LEVELS) break;

        const x = spacingX * (c + 1);
        const y = startY + r * rowSpacing;

        const unlocked = level <= maxUnlocked;
        const color = unlocked ? 0x0078d7 : 0x999999;

        const rRect = this.add.rectangle(x, y, 56, 40, color).setStrokeStyle(2, 0x000);
        const label = this.add.text(x, y, `${level}`, { fontFamily: 'Arial', fontSize: '18px', color: '#fff' }).setOrigin(0.5);

        if (unlocked) {
          rRect.setInteractive({ useHandCursor: true });
          rRect.on('pointerdown', () => {
            // elegir escena según nivel: Jigsaw para >=5
            if (level >= 5) this.scene.start('JigsawScene', { level });
            else this.scene.start('PuzzleScene', { level });
          });
          rRect.on('pointerover', () => rRect.setFillStyle(0x005ea6));
          rRect.on('pointerout',  () => rRect.setFillStyle(color));
        } else {
          // icono de candado bajo el botón si está bloqueado
          this.add.text(x, y + 22, '🔒', { fontSize: '14px' }).setOrigin(0.5);
        }

        level++;
      }
      if (level > MAX_LEVELS) break;
    }**/

    // animación de la copa
    this.anims.create({
      key: 'girar',
      frames: this.anims.generateFrameNumbers('copa', { start: 0, end: 13 }),
      frameRate: 10,
      repeat: -1 // -1 significa que se repite infinitamente
    });

    // Asegurarse de usar la key correcta ('copa') y posicionarla en pantalla
    this.copa = this.add.sprite(width * 0.5, height * 0.78, 'copa').setScale(0.45);
    this.copa.play('girar');

    // Footer instrucción
    const footerStyle = { fontFamily: 'Arial', fontSize: '12px', color: '#333' };
    this.add.text(width / 2, height * 0.95, 'Selecciona Jugar o un nivel desbloqueado', footerStyle).setOrigin(0.5);
  }
}

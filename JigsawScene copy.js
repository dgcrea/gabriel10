// src/scenes/JigsawScene.js
import { MAX_LEVELS, STORAGE_KEY_MAX_UNLOCKED } from '../config.js';

export default class JigsawScene extends Phaser.Scene {
  constructor() {
    super({ key: 'JigsawScene' });
  }

  init(data) {
    this.level = data.level || 5; // por defecto nivel 5 si no se pasa
    this.placedCount = 0;
    this.jigsawPieces = [];
  }

  preload() {
    // Dimensiones lógicas del puzzle (puedes cambiar por nivel si quieres)
    this.PUZZLE_LOGICAL_WIDTH = 600;
    this.PUZZLE_LOGICAL_HEIGHT = 600;

    // Carga la imagen del nivel (usa la convención de nombres que tengas)
    // Asegúrate de que el archivo exista: assets/imagen_level5.png, imagen_level6.png, etc.
    this.jigsawKey = `jigsaw_level${this.level}`;
    const path = `assets/imagenlv${this.level}.png`;
    this.load.image(this.jigsawKey, path);
  }

  create() {
    // Limpieza de listeners previos (por si venimos de otra escena)
    this.input.removeAllListeners();

    // Mostrar nivel (opcional)
    this.add.text(10, 10, `Jigsaw - Nivel: ${this.level}`, { fontFamily: 'Arial', fontSize: '18px', color: '#000' }).setDepth(20);

    // Decidir cols/rows por nivel (ajusta según dificultad deseada)
    const cfg = this.getJigsawGridForLevel(this.level);
    this.jigsawCols = cfg.cols;
    this.jigsawRows = cfg.rows;

    // Calcular tamaños lógicos de pieza
    const cols = this.jigsawCols;
    const rows = this.jigsawRows;
    const pieceW = Math.floor(this.PUZZLE_LOGICAL_WIDTH / cols);
    const pieceH = Math.floor(this.PUZZLE_LOGICAL_HEIGHT / rows);
    this.totalPieces = cols * rows;

    // Calcular escala y offsets para centrar el puzzle en el canvas (MODO A: escala)
    const availW = this.cameras.main.width;
    const availH = this.cameras.main.height;
    const scale = Math.min(availW / this.PUZZLE_LOGICAL_WIDTH, availH / this.PUZZLE_LOGICAL_HEIGHT, 1);
    this.scaleFactor = scale;
    const displayWidth = this.PUZZLE_LOGICAL_WIDTH * scale;
    const displayHeight = this.PUZZLE_LOGICAL_HEIGHT * scale;
    this.offsetX = (availW - displayWidth) / 2;
    this.offsetY = (availH - displayHeight) / 2;

    // Obtenemos la textura para comprobar tamaño real si hace falta
    const texture = this.textures.get(this.jigsawKey);
    let srcImg = null;
    if (texture && texture.source && texture.source[0]) {
      srcImg = texture.source[0].image; // HTMLImageElement
    }

    // Crear piezas: calculamos targets y creamos sprites con setCrop.
    let pieceIndex = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        // coordenadas lógicas (centro de la celda)
        const localTargetX = c * pieceW + pieceW / 2;
        const localTargetY = r * pieceH + pieceH / 2;

        // coordenadas mundiales (donde debe quedar la pieza después del snap)
        const targetWorldX = this.offsetX + localTargetX * scale;
        const targetWorldY = this.offsetY + localTargetY * scale;

        // Crear sprite mostrando la sub-región de la imagen completa
        // Creamos la imagen en world coords; luego aplicamos crop para mostrar solo la subimagen
        const sprite = this.add.image(0, 0, this.jigsawKey).setOrigin(0.5);

        // Calculamos crop en píxeles de la imagen fuente:
        // Suponemos que la imagen fuente tiene tamaño igual a PUZZLE_LOGICAL_WIDTH/HEIGHT.
        // Si la fuente real es de diferente resolución, sería necesario escalar los crop coords en proporción.
        const sx = c * pieceW;
        const sy = r * pieceH;
        const sw = pieceW;
        const sh = pieceH;

        sprite.setCrop(sx, sy, sw, sh);

        // Establecer tamaño a display (aplicar scale manual porque no usamos container)
        sprite.displayWidth = sw * scale;
        sprite.displayHeight = sh * scale;

        // POSICIÓN INICIAL: dispersar fuera del área del puzzle para que el jugador las arrastre
        const margin = 16;
        const zones = ['left', 'right', 'top', 'bottom'];
        const zone = Phaser.Utils.Array.GetRandom(zones);

        let initialX, initialY;
        if (zone === 'left') {
          initialX = Phaser.Math.Between(margin, Math.max(10, Math.floor(this.offsetX - sw * scale - margin)));
          initialY = Phaser.Math.Between(margin, this.cameras.main.height - margin);
        } else if (zone === 'right') {
          initialX = Phaser.Math.Between(Math.min(this.cameras.main.width - margin, Math.ceil(this.offsetX + this.PUZZLE_LOGICAL_WIDTH * scale + margin)), this.cameras.main.width - margin);
          initialY = Phaser.Math.Between(margin, this.cameras.main.height - margin);
        } else if (zone === 'top') {
          initialX = Phaser.Math.Between(margin, this.cameras.main.width - margin);
          initialY = Phaser.Math.Between(margin, Math.max(10, Math.floor(this.offsetY - sh * scale - margin)));
        } else { // bottom
          initialX = Phaser.Math.Between(margin, this.cameras.main.width - margin);
          initialY = Phaser.Math.Between(Math.min(this.cameras.main.height - margin, Math.ceil(this.offsetY + this.PUZZLE_LOGICAL_HEIGHT * scale + margin)), this.cameras.main.height - margin);
        }

        // Si los rangos anteriores quedaron inválidos (por ejemplo offset muy pequeño), caemos a coordenadas aleatorias
        if (!isFinite(initialX) || !isFinite(initialY) || initialX < 0 || initialY < 0 || initialX > this.cameras.main.width || initialY > this.cameras.main.height) {
          initialX = Phaser.Math.Between(margin, this.cameras.main.width - margin);
          initialY = Phaser.Math.Between(margin, this.cameras.main.height - margin);
        }

        sprite.x = initialX;
        sprite.y = initialY;

        // Datos de pieza para verificar objetivo
        const pieceData = {
          targetX: targetWorldX,
          targetY: targetWorldY,
          placed: false,
          row: r,
          col: c,
          pieceIndex
        };
        sprite._pieceData = pieceData;

        // Interactividad y Draggable
        sprite.setInteractive({ useHandCursor: true });
        this.input.setDraggable(sprite);

        // Aumentar profundidad para la pieza creada recientemente (evita solapados molestos)
        sprite.setDepth(10 + pieceIndex);

        // Guardar en array
        this.jigsawPieces.push(sprite);

        pieceIndex++;
      }
    }

    // Listeners de drag
    this.input.on('dragstart', (pointer, gameObject) => {
      // traer al frente
      gameObject.setDepth(1000);
      gameObject.setScale(1.03); // pequeño feedback
    });

    this.input.on('drag', (pointer, gameObject, dragX, dragY) => {
      // dragX/dragY están en world coords, apropiados para sprites no contenidos en container
      gameObject.x = dragX;
      gameObject.y = dragY;
    });

    this.input.on('dragend', (pointer, gameObject) => {
      gameObject.setScale(1.0);
      const data = gameObject._pieceData;
      if (!data || data.placed) return;

      // distancia al objetivo en world coords
      const dx = gameObject.x - data.targetX;
      const dy = gameObject.y - data.targetY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // umbral de snap: proporcional al tamaño de la pieza y a la escala
      const snapThreshold = Math.max(pieceW, pieceH) * scale * 0.35;

      if (dist <= snapThreshold) {
        // hacer snap a la posición exacta
        this.tweens.add({
          targets: gameObject,
          x: data.targetX,
          y: data.targetY,
          duration: 150,
          ease: 'Cubic.easeOut',
          onComplete: () => {
            data.placed = true;
            // fijar la pieza (desactivar interacción)
            gameObject.disableInteractive();
            gameObject.setDepth(5); // enviar atrás, sobre fondo
            this.placedCount++;
            // pequeño feedback
            this.tweens.add({ targets: gameObject, scale: 1.02, duration: 100, yoyo: true });

            if (this.placedCount === this.totalPieces) {
              // terminado
              this.onLevelComplete();
            }
          }
        });
      } else {
        // si no encaja, dejarla donde la soltó (o animar regreso opcional)
        // opcional: animar un pequeño rebote
        this.tweens.add({ targets: gameObject, scale: 1.0, duration: 120 });
      }
    });
  }

  // Ejemplo sencillo para elegir cols/rows según level
  getJigsawGridForLevel(level) {
    // Puedes personalizar esto a tu gusto
    if (level === 5) return { cols: 2, rows: 2 };
    if (level === 6) return { cols: 3, rows: 2 };
    if (level === 7) return { cols: 3, rows: 3 };
    if (level === 8) return { cols: 4, rows: 3 };
    if (level === 9) return { cols: 4, rows: 4 };
    if (level >= 10) return { cols: 5, rows: 4 };
    // fallback
    return { cols: 3, rows: 2 };
  }

  // ----------------- Final de nivel y unlock -----------------
  onLevelComplete() {
    // Mostrar un mensaje simple y desbloquear siguiente nivel
    this.unlockNextLevel();
    this.showFinishedText();

    // Mostrar panel de opciones (Siguiente / Reintentar / Menú)
    this.time.delayedCall(400, () => {
      this.showEndPanel();
    });
  }

  unlockNextLevel() {
    const stored = parseInt(localStorage.getItem(STORAGE_KEY_MAX_UNLOCKED) || '1', 10);
    if (this.level >= stored && this.level < MAX_LEVELS) {
      localStorage.setItem(STORAGE_KEY_MAX_UNLOCKED, String(this.level + 1));
    }
  }

  showFinishedText() {
    const style = { fontFamily: 'Arial', fontSize: '36px', color: '#000', align: 'center' };
    this.add.text(this.cameras.main.centerX, this.cameras.main.centerY - 120, '¡Completado!', style).setOrigin(0.5).setDepth(200);
  }

  showEndPanel() {
    const cx = this.cameras.main.centerX;
    const cy = this.cameras.main.centerY + 20;
    const panel = this.add.container(cx, cy).setDepth(250);

    const bg = this.add.rectangle(0, 0, 360, 160, 0xffffff).setStrokeStyle(2, 0x000);
    const txt = this.add.text(0, -36, 'Nivel completado', { fontFamily: 'Arial', fontSize: '22px', color: '#000' }).setOrigin(0.5);
    const nextBtn = this.add.text(-80, 24, 'Siguiente', { fontFamily: 'Arial', fontSize: '16px', color: '#fff', backgroundColor: '#0078d7' }).setOrigin(0.5).setPadding(8).setInteractive({ useHandCursor: true });
    const retryBtn = this.add.text(0, 24, 'Reintentar', { fontFamily: 'Arial', fontSize: '16px', color: '#fff', backgroundColor: '#28a745' }).setOrigin(0.5).setPadding(8).setInteractive({ useHandCursor: true });
    const menuBtn = this.add.text(80, 24, 'Menú', { fontFamily: 'Arial', fontSize: '16px', color: '#000', backgroundColor: '#ddd' }).setOrigin(0.5).setPadding(8).setInteractive({ useHandCursor: true });

    panel.add([bg, txt, nextBtn, retryBtn, menuBtn]);

    nextBtn.on('pointerdown', () => {
      if (this.level < MAX_LEVELS) {
        this.scene.start('JigsawScene', { level: this.level + 1 });
      } else {
        this.scene.start('MenuScene');
      }
    });

    retryBtn.on('pointerdown', () => {
      this.scene.start('JigsawScene', { level: this.level });
    });

    menuBtn.on('pointerdown', () => {
      this.scene.start('MenuScene');
    });
  }
}
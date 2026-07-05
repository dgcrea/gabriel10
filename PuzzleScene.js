// PuzzleScene.js
import { MAX_LEVELS, STORAGE_KEY_MAX_UNLOCKED } from '../config.js';

export default class PuzzleScene extends Phaser.Scene {
    constructor() {
        super({ key: 'PuzzleScene' });
    }

    init(data) {
        this.level = data.level || 1;

        // Si el nivel debe ser jigsaw, redirigimos inmediatamente a JigsawScene
        if (this.level >= 5) {
            this.scene.start('JigsawScene', { level: this.level });
            return;
        }
    }

    preload() {
        // recibir tamaño lógico fijo o variable por nivel
        this.PUZZLE_LOGICAL_WIDTH = 600;
        this.PUZZLE_LOGICAL_HEIGHT = 600;

        // Si cada nivel tiene la misma pieza lógica:
        this.PIECE_WIDTH = 300;
        this.PIECE_HEIGHT = 300;

        // Nombre del archivo según nivel (convenio)
        const level = this.level || 1;

        // si existe la textura anterior con la key 'background', la borramos para forzar recarga
        if (this.textures.exists('background')) {
            this.textures.remove('background');
        }

        const path = `assets/imagenlv${level}.png`;

        // Cargar la spritesheet específica para este nivel
        this.load.spritesheet('background', path, {
            frameWidth: this.PIECE_WIDTH,
            frameHeight: this.PIECE_HEIGHT
        });

        // (Opcional) manejar error si el asset no existe: puedes añadir un fallback o un mensaje
    }

    create() {
        this.add.text(10, 10, `Nivel: ${this.level}`, { fontFamily: 'Trebuchet MS', fontSize: '24px', color: '#000', backgroundColor: 'rgba(255,255,255,0.9)'}).setDepth(20);
        this.add.text(300, 10, `Niveles restantes:` + (MAX_LEVELS - this.level), { fontFamily: 'Trebuchet MS', fontSize: '24px', color: '#000', backgroundColor: 'rgba(255,255,255,0.9)'}).setDepth(20);

        this.BOARD_COLS = Math.floor(this.PUZZLE_LOGICAL_WIDTH / this.PIECE_WIDTH);
        this.BOARD_ROWS = Math.floor(this.PUZZLE_LOGICAL_HEIGHT / this.PIECE_HEIGHT);
        this.piecesAmount = this.BOARD_COLS * this.BOARD_ROWS;

        const availW = this.cameras.main.width;
        const availH = this.cameras.main.height;
        const scale = Math.min(availW / this.PUZZLE_LOGICAL_WIDTH, availH / this.PUZZLE_LOGICAL_HEIGHT, 1);
        const displayWidth = this.PUZZLE_LOGICAL_WIDTH * scale;
        const displayHeight = this.PUZZLE_LOGICAL_HEIGHT * scale;
        const offsetX = (availW - displayWidth) / 2;
        const offsetY = (availH - displayHeight) / 2;

        this.boardContainer = this.add.container(offsetX, offsetY);
        this.boardContainer.setScale(scale);

        this.piecesGroup = this.add.group();

        this.prepareBoardScaled();
    }

    prepareBoardScaled() {
        this.shuffledIndexArray = this.createShuffledIndexArray();

        let piecesIndex = 0;
        for (let row = 0; row < this.BOARD_ROWS; row++) {
            for (let col = 0; col < this.BOARD_COLS; col++) {
                const frameIndex = this.shuffledIndexArray[piecesIndex];
                const localX = col * this.PIECE_WIDTH + this.PIECE_WIDTH / 2;
                const localY = row * this.PIECE_HEIGHT + this.PIECE_HEIGHT / 2;

                let sprite;
                if (frameIndex !== null) {
                    sprite = this.add.sprite(localX, localY, 'background', frameIndex);
                    sprite.frameIndex = frameIndex;
                    sprite.correctIndex = frameIndex;
                    sprite.setVisible(true);
                    sprite.setInteractive();
                    sprite.on('pointerdown', () => this.selectPiece(sprite));
                    sprite.black = false;
                } else {
                    const lastFrame = this.piecesAmount - 1;
                    sprite = this.add.sprite(localX, localY, 'background', lastFrame);
                    sprite.frameIndex = null;
                    sprite.correctIndex = lastFrame;
                    sprite.black = true;
                    sprite.setVisible(false);
                }

                sprite.name = `piece${row}x${col}`;
                sprite.currentIndex = piecesIndex;
                sprite.posX = col;
                sprite.posY = row;

                this.boardContainer.add(sprite);
                this.piecesGroup.add(sprite);

                piecesIndex++;
            }
        }
    }

    selectPiece(piece) {
        const blackPiece = this.canMove(piece);
        if (blackPiece) this.movePiece(piece, blackPiece);
    }

    canMove(piece) {
        const children = this.piecesGroup.getChildren();
        for (let i = 0; i < children.length; i++) {
            const el = children[i];
            if (!el.black) continue;
            const left  = (el.posX === piece.posX - 1 && el.posY === piece.posY);
            const right = (el.posX === piece.posX + 1 && el.posY === piece.posY);
            const up    = (el.posY === piece.posY - 1 && el.posX === piece.posX);
            const down  = (el.posY === piece.posY + 1 && el.posX === piece.posX);
            if (left || right || up || down) return el;
        }
        return null;
    }

    movePiece(piece, blackPiece) {
        const tmp = { posX: piece.posX, posY: piece.posY, currentIndex: piece.currentIndex, x: piece.x, y: piece.y };
        const targetX = blackPiece.posX * this.PIECE_WIDTH + this.PIECE_WIDTH / 2;
        const targetY = blackPiece.posY * this.PIECE_HEIGHT + this.PIECE_HEIGHT / 2;

        piece.posX = blackPiece.posX;
        piece.posY = blackPiece.posY;
        piece.currentIndex = blackPiece.currentIndex;

        blackPiece.posX = tmp.posX;
        blackPiece.posY = tmp.posY;
        blackPiece.currentIndex = tmp.currentIndex;
        blackPiece.x = tmp.x;
        blackPiece.y = tmp.y;

        this.disableAllInput();

        this.tweens.add({
            targets: piece,
            x: targetX,
            y: targetY,
            duration: 300,
            ease: 'Linear',
            onComplete: () => {
                piece.black = false;
                blackPiece.black = true;
                piece.setVisible(true);
                blackPiece.setVisible(false);

                this.enableAllInput();
                this.checkIfFinished();
            }
        });
    }

    checkIfFinished() {
        const children = this.piecesGroup.getChildren();
        let isFinished = true;
        for (let i = 0; i < children.length; i++) {
            if (children[i].currentIndex !== children[i].correctIndex) {
                isFinished = false;
                break;
            }
        }

        if (isFinished) {
            this.disableAllInput();
            // delegamos la lógica de final aquí
            this.onLevelComplete();
        }
    }

    onLevelComplete() {
        // Revela la pieza final y luego muestra el panel de fin, desbloquea siguiente nivel
        this.revealMissingTile(() => {
            this.unlockNextLevel();
            // mostrar panel con opciones (Siguiente/Reintentar/Menu)
            this.time.delayedCall(300, () => this.showEndPanel());
        });
    }

    unlockNextLevel() {
        const stored = parseInt(localStorage.getItem(STORAGE_KEY_MAX_UNLOCKED) || '1', 10);
        if (this.level >= stored && this.level < MAX_LEVELS) {
            localStorage.setItem(STORAGE_KEY_MAX_UNLOCKED, String(this.level + 1));
        }
    }

    showEndPanel() {
        const cx = this.cameras.main.centerX;
        const cy = this.cameras.main.centerY + 400;
        const panel = this.add.container(cx, cy).setDepth(60);
        const bg = this.add.rectangle(0, 0, 400, 160, 0xffffff).setStrokeStyle(2, 0x000);
        const txt = this.add.text(0, -44, '¡Muy bien Gabriel!', { fontFamily: 'Arial', fontSize: '28px', color:'#000' }).setOrigin(0.5);
        const nextBtn = this.add.text(-80, 10, 'Siguiente', { fontFamily: 'Arial', fontSize: '18px', color:'#fff', backgroundColor: '#0078d7' }).setOrigin(0.5).setPadding(8).setInteractive({ useHandCursor: true });
        const retryBtn = this.add.text(0, 10, 'Reintentar', { fontFamily: 'Arial', fontSize: '18px', color:'#fff', backgroundColor: '#28a745' }).setOrigin(0.5).setPadding(8).setInteractive({ useHandCursor: true });
        const menuBtn = this.add.text(80, 10, 'Menú', { fontFamily: 'Arial', fontSize: '18px', color:'#000', backgroundColor: '#ddd' }).setOrigin(0.5).setPadding(8).setInteractive({ useHandCursor: true });

        panel.add([bg, txt, nextBtn, retryBtn, menuBtn]);

        // Desactivar inputs previos (ya deshabilitado), y bloquear piezas mientras panel activo
        this.disableAllInput();

        // Handlers
        nextBtn.on('pointerdown', () => {
            const nextLevel = this.level + 1;
            if (nextLevel > MAX_LEVELS) {
                this.scene.start('MenuScene');
            } else if (nextLevel >= 5) {
                this.scene.start('JigsawScene', { level: nextLevel });
            } else {
                this.scene.start('PuzzleScene', { level: nextLevel });
            }
        });

        retryBtn.on('pointerdown', () => {
            // reiniciar mismo nivel en la escena apropiada
            if (this.level >= 5) {
                this.scene.start('JigsawScene', { level: this.level });
            } else {
                this.scene.start('PuzzleScene', { level: this.level });
            }
        });

        menuBtn.on('pointerdown', () => {
            this.scene.start('MenuScene');
        });
    }

    revealMissingTile(onComplete) {
        const children = this.piecesGroup.getChildren();
        let blackPiece = null;
        for (let i = 0; i < children.length; i++) if (children[i].black) { blackPiece = children[i]; break; }
        if (!blackPiece) { if (onComplete) onComplete(); return; }

        const lastFrame = this.piecesAmount - 1;
        blackPiece.setFrame(lastFrame);
        blackPiece.frameIndex = lastFrame;
        blackPiece.correctIndex = lastFrame;
        blackPiece.black = false;
        blackPiece.setVisible(true);
        blackPiece.setAlpha(0);

        this.tweens.add({
            targets: blackPiece,
            alpha: 1,
            duration: 400,
            ease: 'Cubic.easeOut',
            onComplete: () => { if (onComplete) onComplete(); }
        });
    }

    disableAllInput() {
        const children = this.piecesGroup.getChildren();
        for (let i = 0; i < children.length; i++) {
            const g = children[i];
            if (g.input && g.input.enabled) g.disableInteractive();
        }
    }

    enableAllInput() {
        const children = this.piecesGroup.getChildren();
        for (let i = 0; i < children.length; i++) {
            const g = children[i];
            if (!g.black) {
                g.off('pointerdown');
                g.setInteractive();
                g.on('pointerdown', () => this.selectPiece(g));
            }
        }
    }

    // ---------- Helpers: shuffle y solvabilidad ----------
    createShuffledIndexArray() {
        const indexArray = [];
        for (let i = 0; i < this.piecesAmount; i++) indexArray.push(i);
        indexArray.splice(this.piecesAmount - 1, 1);
        indexArray.push(null);
        let shuffled;
        do {
            shuffled = this.shuffle(indexArray.slice());
        } while (!this.isSolvable(shuffled) || this.isAlreadySolved(shuffled));
        return shuffled;
    }

    shuffle(array) {
        let counter = array.length, temp, idx;
        while (counter > 0) {
            idx = Math.floor(Math.random() * counter);
            counter--;
            temp = array[counter];
            array[counter] = array[idx];
            array[idx] = temp;
        }
        return array;
    }

    isAlreadySolved(arr) {
        for (let i = 0; i < arr.length - 1; i++) if (arr[i] !== i) return false;
        return arr[arr.length - 1] === null;
    }

    isSolvable(arr) {
        const list = arr.filter(x => x !== null);
        let inversions = 0;
        for (let i = 0; i < list.length; i++) {
            for (let j = i + 1; j < list.length; j++) {
                if (list[i] > list[j]) inversions++;
            }
        }
        if (this.BOARD_COLS % 2 === 1) return (inversions % 2) === 0;
        const blankIndex = arr.indexOf(null);
        const blankRowFromTop = Math.floor(blankIndex / this.BOARD_COLS);
        const blankRowFromBottom = this.BOARD_ROWS - blankRowFromTop;
        if ((blankRowFromBottom % 2) === 0) return (inversions % 2) === 1;
        return (inversions % 2) === 0;
    }
}
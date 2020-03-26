import { GameEditor } from "./GameEditor";
import { clamp } from "lodash";
import { modulo } from "../game/core/Utils";
import { TILE_COUNT, TEXTURE_W, TEXTURE_H, TILE_COLS, TILE_W, TILE_H, TILE_ROWS } from "./Constants";

export class TextureSelector {
    private readonly editor: GameEditor;
    private readonly canvas: HTMLCanvasElement;
    private readonly tileset: HTMLImageElement;

    public constructor(editor: GameEditor) {
        this.editor = editor;

        // Add preview
        this.canvas = document.createElement("canvas");
        this.canvas.width = TEXTURE_W / 2;
        this.canvas.height = TEXTURE_H / 2;
        this.canvas.style.position = "absolute";
        document.body.appendChild(this.canvas);

        // Load tileset
        this.tileset = new Image();
        this.tileset.src = "/assets/tileset.png";
        this.tileset.onload = () => this.render();
    }

    public update() {
        const { world, input } = this.editor;
        const scroll = clamp(input.mouse.scroll, -1, 1);
        if (scroll === 0) return;

        world.texutreIndex += scroll;
        world.texutreIndex = modulo(world.texutreIndex, TILE_COUNT);
        this.render();
        console.log(`> Texture: ${world.texutreIndex}`);
    }

    private render() {
        const ctx = this.canvas.getContext("2d") as CanvasRenderingContext2D;
        ctx.drawImage(this.tileset, 0, 0, this.canvas.width, this.canvas.height);

        const tilew = this.canvas.width / TILE_COLS;
        const tileh = this.canvas.height / TILE_ROWS;
        const index = this.editor.world.texutreIndex - 1;
        ctx.strokeStyle = "red";
        ctx.strokeRect(
            Math.floor(index % TILE_COLS) * tilew,
            Math.floor(index / TILE_COLS) * tileh,
            tilew,
            tileh
        );
    }
}
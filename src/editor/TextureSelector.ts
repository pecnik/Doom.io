import { GameEditor } from "./GameEditor";
import { clamp } from "lodash";
import { modulo } from "../game/core/Utils";
import { TILE_COUNT } from "./Constants";

export class TextureSelector {

    private readonly editor: GameEditor;

    public constructor(editor: GameEditor) {
        this.editor = editor;
    }

    public update() {
        const { world, input } = this.editor;
        const scroll = clamp(input.mouse.scroll, -1, 1);
        if (scroll === 0) return;

        world.texutreIndex += scroll;
        world.texutreIndex = modulo(world.texutreIndex, TILE_COUNT);
        console.log(`> Texture: ${world.texutreIndex}`);
    }
}
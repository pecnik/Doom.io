import { Tool } from "./Tool";
import { KeyCode } from "../../game/core/Input";
import { GameEditor } from "../GameEditor";

export class TextureSelectTool extends Tool {
    public readonly name = "texture-select";
    public readonly hotkey = KeyCode.T;

    public constructor(editor: GameEditor) {
        super(editor);
    }

    public update() {
        this.editor.world.texutreIndex++;
        this.editor.world.texutreIndex %= 64;
        this.editor.currTool = this.editor.prevTool;
    }
}
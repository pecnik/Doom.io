import { GameEditor } from "../GameEditor";
import { KeyCode } from "../../game/core/Input";

export abstract class Tool {
    protected readonly editor: GameEditor;

    public abstract readonly name: string;
    public abstract readonly hotkey: KeyCode;
    public abstract update(): void;

    public constructor(editor: GameEditor) {
        this.editor = editor;
    }

    public selected() {
        // ...
    }
}
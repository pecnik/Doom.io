import { GameEditor } from "../GameEditor";
import { KeyCode, Input } from "../../game/core/Input";
import { EditorWorld } from "../data/EditorWorld";
import { EditorHud } from "../data/EditorHud";

export abstract class Tool {
    protected readonly input: Input;
    protected readonly world: EditorWorld;
    protected readonly hud: EditorHud;

    public abstract readonly name: string;
    public abstract readonly hotkey: KeyCode;
    public abstract update(): void;

    public constructor(editor: GameEditor) {
        this.input = editor.input;
        this.world = editor.world;
        this.hud = editor.hud;
    }
}

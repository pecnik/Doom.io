import { Editor } from "../Editor";
import { Input } from "../../game/core/Input";
import { EditorWorld } from "../data/EditorWorld";
import { EditorHud } from "../data/EditorHud";

export abstract class Tool {
    protected readonly input: Input;
    protected readonly world: EditorWorld;
    protected readonly hud: EditorHud;

    public abstract icon: string;
    public abstract name: string;

    public constructor(editor: Editor) {
        this.input = editor.input;
        this.world = editor.world;
        this.hud = editor.hud;
    }

    public start() {}

    public end() {}

    public onMouseOne() {}

    public onMouseTwo() {}
}

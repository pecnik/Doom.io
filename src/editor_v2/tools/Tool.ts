import { Editor } from "../Editor";
import { KeyCode, Input } from "../../game/core/Input";

export enum ToolType {
    Move,
    Block,
    Eraser,
    Paint,
}

export abstract class Tool {
    protected readonly editor: Editor;
    protected readonly input: Input;

    public abstract readonly name: string;
    public abstract readonly type: ToolType;
    public abstract readonly hotkey: KeyCode;

    public constructor(editor: Editor) {
        this.editor = editor;
        this.input = editor.input;
    }

    public start() {}
    public update() {}
    public end() {}
}

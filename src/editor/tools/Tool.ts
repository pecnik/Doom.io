import { KeyCode } from "../../game/core/Input";
import { Editor } from "../Editor";

export class Tool {
    public readonly name: string = "Tool";
    public readonly hotkey: KeyCode = KeyCode.DEL;
    public readonly cursorType: string = "cursor-default";

    protected readonly editor: Editor;
    public constructor(editor: Editor) {
        this.editor = editor;
    }

    public getModifiedTool(): Tool {
        return this;
    }

    public initialize() {}
    public start() {}
    public update() {}
    public end() {}

    public onUp() {}
    public onPresed() {}
    public onDown() {}
    public onReleased() {}
}

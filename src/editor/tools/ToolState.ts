import { Editor } from "../Editor";

export class ToolState {
    protected readonly editor: Editor;
    public readonly cursorType: string = "cursor-default";

    public constructor(fsm: Editor) {
        this.editor = fsm;
    }

    public initialize() {}
    public start(_prevState: ToolState) {}
    public end(_nextState: ToolState) {}

    public update() {}

    public startAction1() {}
    public startAction2() {}
    public endAction() {}

    public hotkeyBlock() {}
    public hotkeyPaint() {}
    public hotkeySelect() {}

    public startMove() {}
    public endMove() {}

    public startSample() {}
    public endSample() {}
}

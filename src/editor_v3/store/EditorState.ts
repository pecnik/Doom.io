import { createLevel } from "../EditorUtils";

export enum EditorTool {
    Block = "fa-cube",
    Paint = "fa-fill-drip",
    Pick = "fa-eye-dropper"
}

export class EditorState {
    public level = createLevel(0, 0, 0);
    public tool = EditorTool.Block;
    public wireframe = false;
    public tileSelectDialog = false;
    public tileIdSlotIndex = 0;
    public tileIdSlotArray = [0, 1, 2, 3, 4, 5].map(i => i + 8);
}

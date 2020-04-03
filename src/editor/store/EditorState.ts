import { Level } from "../Level";

export enum EditorTool {
    Block = "fa-cube",
    Paint = "fa-fill-drip",
    Pick = "fa-eye-dropper"
}

export class EditorState {
    public level = Level.create(0, 0, 0);
    public tool = EditorTool.Block;
    public wireframe = false;
    public tileSelectDialog = false;
    public tileIdSlotIndex = 0;
    public tileIdSlotArray = [0, 1, 2, 8, 9, 10];
}

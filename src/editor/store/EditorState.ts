import { Level } from "../../game/data/Level";

export enum EditorTool {
    Block = "fa-cube",
    Paint = "fa-fill-drip",
    Pick = "fa-eye-dropper",
}

export class EditorState {
    public level = new Level.Level().matrix;
    public tool = EditorTool.Block;
    public wireframe = false;
    public tileSelectDialog = false;
    public tileIdSlotIndex = 0;
    public tileIdSlotArray = [0, 1, 2, 3, 8, 9, 10, 11];
}

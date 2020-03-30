import { createLevel } from "../EditorUtils";

export class EditorState {
    public level = createLevel(0, 0, 0);

    public tileIdSlotIndex = 0;
    public tileIdSlotArray = [0, 1, 2, 3, 4, 5, 6, 7];
}

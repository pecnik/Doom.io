import { Tool } from "./Tool";
import { KeyCode } from "../../game/core/Input";

export class PaintTool extends Tool {
    public readonly name = "paint";
    public readonly key = KeyCode.F;
}

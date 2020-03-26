import { Tool } from "./Tool";
import { KeyCode } from "../../game/core/Input";

export class TextureSelectTool extends Tool {
    public readonly name = "texture-select";
    public readonly hotkey = KeyCode.T;

    public update() { }
}
import { Tool } from "./Tool";
import { KeyCode } from "../../game/core/Input";

export class EntityTool extends Tool {
    public readonly name = "entity";
    public readonly key = KeyCode.G;
}

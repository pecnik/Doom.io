import { Engine } from "../game/core/Engine";
import { Editor, VIEW_WIDTH, VIEW_HEIGHT } from "./Editor";

new Engine(
    new Editor(),
    document.getElementById("viewport") as HTMLCanvasElement,
    document.getElementById("gamearea") as HTMLDivElement
).start(VIEW_WIDTH, VIEW_HEIGHT);

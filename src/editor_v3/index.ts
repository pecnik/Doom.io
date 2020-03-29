import { Engine } from "../game/core/Engine";
import { Editor } from "./Editor";
import { VIEW_WIDTH, VIEW_HEIGHT } from "./Constants";

new Engine(
    new Editor(),
    document.getElementById("viewport") as HTMLCanvasElement,
    document.getElementById("gamearea") as HTMLDivElement
).start(VIEW_WIDTH, VIEW_HEIGHT);

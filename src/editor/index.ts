import { Engine } from "../game/core/Engine";
import { Editor } from "./Editor";
import { SCREEN_WIDTH, SCREEN_HEIGHT } from "../game/data/Globals";

new Engine(
    new Editor(),
    document.getElementById("viewport") as HTMLCanvasElement,
    document.getElementById("gamearea") as HTMLDivElement
).start(SCREEN_WIDTH, SCREEN_HEIGHT);

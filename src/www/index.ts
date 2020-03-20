import { Engine } from "../game/core/Engine";
import { SCREEN_WIDTH, SCREEN_HEIGHT } from "../game/data/Globals";

new Engine(
    document.getElementById("viewport") as HTMLCanvasElement,
    document.getElementById("gamearea") as HTMLDivElement
).start(SCREEN_WIDTH, SCREEN_HEIGHT);

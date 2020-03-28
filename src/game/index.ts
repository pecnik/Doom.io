import { GameClient } from "./GameClient";
import { Engine } from "./core/Engine";
import { SCREEN_WIDTH, SCREEN_HEIGHT } from "./data/Globals";

new Engine(
    new GameClient(),
    document.getElementById("viewport") as HTMLCanvasElement,
    document.getElementById("gamearea") as HTMLDivElement
).start(SCREEN_WIDTH, SCREEN_HEIGHT);

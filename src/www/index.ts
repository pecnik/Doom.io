import { Engine } from "../game/core/Engine";
import { SCREEN_WIDTH, SCREEN_HEIGHT } from "../game/data/Globals";
import { GameClient } from "../game/GameClient";

new Engine(
    new GameClient(),
    document.getElementById("viewport") as HTMLCanvasElement,
    document.getElementById("gamearea") as HTMLDivElement
).start(SCREEN_WIDTH, SCREEN_HEIGHT);

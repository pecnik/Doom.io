import { GameClient } from "./GameClient";
import { Engine } from "./core/Engine";
import { SCREEN_WIDTH, SCREEN_HEIGHT } from "./data/Globals";
import { createDebugCli } from "./Debug";

const game = new GameClient();
createDebugCli(game);

new Engine(
    game,
    document.getElementById("viewport") as HTMLCanvasElement,
    document.getElementById("gamearea") as HTMLDivElement
).start(SCREEN_WIDTH, SCREEN_HEIGHT);

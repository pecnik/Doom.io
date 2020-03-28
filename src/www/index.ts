import { Engine } from "../game/core/Engine";
import { SCREEN_WIDTH, SCREEN_HEIGHT } from "../game/data/Globals";
import { GameClient } from "../game/GameClient";
import { Editor } from "../editor/Editor";

function getApp() {
    const route = location.pathname.split("/")[1];
    if (route === "editor") {
        return new Editor();
    } else {
        return new GameClient();
    }
}

new Engine(
    getApp(),
    document.getElementById("viewport") as HTMLCanvasElement,
    document.getElementById("gamearea") as HTMLDivElement
).start(SCREEN_WIDTH, SCREEN_HEIGHT);

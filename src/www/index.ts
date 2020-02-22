import { Engine } from "../game/core/Engine";

new Engine(
    document.getElementById("viewport") as HTMLCanvasElement,
    document.getElementById("gamearea") as HTMLDivElement
).start(800, 600);

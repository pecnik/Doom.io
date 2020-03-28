import { Engine } from "../game/core/Engine";
import { Editor } from "./Editor";

new Engine(
    new Editor(),
    document.getElementById("viewport") as HTMLCanvasElement,
    document.getElementById("gamearea") as HTMLDivElement
).start(1920, 1080);

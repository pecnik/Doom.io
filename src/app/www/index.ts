import { Engine } from "../core/Engine";

const engine = new Engine(
    document.getElementById("viewport") as HTMLCanvasElement,
    document.getElementById("gamearea") as HTMLDivElement
);

engine.start(800, 600);

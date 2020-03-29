import { Game } from "../game/core/Engine";
import { EditorWorld } from "./data/EditorWorld";
import { EditorHud } from "./data/EditorHud";
import { Input } from "../game/core/Input";
import { createUI } from "./ui/App";

export class Editor implements Game {
    public readonly ui = createUI();
    public readonly hud = new EditorHud();
    public readonly world = new EditorWorld();
    public readonly input = new Input({
        requestPointerLock: true,
        element: document.getElementById("viewport") as HTMLElement
    });

    public preload() {
        return Promise.all([
            // ...
        ]);
    }

    public create() {
        // ...
    }

    public update(_: number) {
        // ...
    }
}

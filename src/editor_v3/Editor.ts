import { Game } from "../game/core/Engine";
import { EditorWorld } from "./data/EditorWorld";
import { EditorHud } from "./data/EditorHud";
import { Input } from "../game/core/Input";

export class Editor implements Game {
    public readonly input = new Input({ requestPointerLock: true });
    public readonly world = new EditorWorld();
    public readonly hud = new EditorHud();

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

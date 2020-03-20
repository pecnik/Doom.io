import { System } from "@nova-engine/ecs";
import { World } from "../data/World";
import { Hud } from "../data/Hud";
import {
    TextureLoader,
    SpriteMaterial,
    AdditiveBlending,
    Sprite,
    NearestFilter
} from "three";

export class PlayerHudSystem extends System {
    public constructor(_: World, hud: Hud) {
        super();

        new TextureLoader().load("/assets/sprites/crosshair.png", map => {
            const material = new SpriteMaterial({
                map,
                blending: AdditiveBlending
            });

            map.magFilter = NearestFilter;
            map.minFilter = NearestFilter;

            const crosshair = new Sprite(material);
            crosshair.position.z = 0;
            crosshair.scale.multiplyScalar(128);
            hud.scene.add(crosshair);
        });
    }

    public update() {
        // ...
    }
}

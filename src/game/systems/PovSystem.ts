import { System } from "@nova-engine/ecs";
import { World } from "../World";
import {
    TextureLoader,
    Sprite,
    SpriteMaterial,
    AdditiveBlending,
    NearestFilter
} from "three";

export class PovSystem extends System {
    public constructor(world: World) {
        super();

        new TextureLoader().load("/assets/sprites/crosshair.png", map => {
            const material = new SpriteMaterial({
                depthTest: false,
                depthWrite: false,
                blending: AdditiveBlending,
                map
            });

            map.magFilter = NearestFilter;
            map.minFilter = NearestFilter;

            const sprite = new Sprite(material);
            sprite.renderOrder = 100;

            sprite.position.z = -4;
            world.camera.add(sprite);
        });

        new TextureLoader().load("/assets/sprites/pov-gun.png", map => {
            const material = new SpriteMaterial({
                depthTest: false,
                depthWrite: false,
                map
            });

            map.magFilter = NearestFilter;
            map.minFilter = NearestFilter;

            const sprite = new Sprite(material);
            sprite.renderOrder = 100;

            sprite.position.x = 0.75;
            sprite.position.y = -0.5;
            sprite.position.z = -1;
            world.camera.add(sprite);
        });
    }

    public update() {
        // ...
    }
}

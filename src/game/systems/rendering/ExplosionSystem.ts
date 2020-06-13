import { System, Components, AnyComponents } from "../../ecs";
import { Sprite, SpriteMaterial, AdditiveBlending } from "three";
import { loadTexture } from "../../Helpers";
import { GameContext } from "../../GameContext";
import { ease } from "../../core/Utils";

class ExplostionSpawnerArchetype implements AnyComponents {
    public spawnExplosionTag = true;
    public position = new Components.Position();
}

export class ExplosionSystem extends System {
    private readonly material = (() => {
        const material = new SpriteMaterial({
            blending: AdditiveBlending,
        });

        loadTexture("/assets/sprites/plasma_ball.png").then((map) => {
            material.map = map;
            material.needsUpdate = true;
        });

        return material;
    })();

    private readonly group = this.createSceneGroup();

    public constructor(game: GameContext) {
        super(game);
        this.createEntityFamily({
            archetype: new ExplostionSpawnerArchetype(),
            onEntityRemvoed: (entity) => {
                let sprite = this.group.children.find((child) => {
                    return !child.visible;
                });

                if (sprite === undefined) {
                    sprite = new Sprite(this.material);
                    this.group.add(sprite);
                }

                sprite.visible = true;
                sprite.name = entity.id;
                sprite.scale.setScalar(0.25);
                sprite.position.copy(entity.position);
            },
        });
    }

    public update() {
        this.group.children.forEach((sprite) => {
            sprite.visible = sprite.scale.lengthSq() < 4;
            if (sprite.visible) {
                sprite.scale.x = ease(sprite.scale.x, 2, 0.1);
                sprite.scale.setScalar(sprite.scale.x);
            }
        });
        // this.spawners.entities.forEach((entity) => {
        //     const sprite = this.group.getObjectByName(entity.id);
        //     if (sprite !== undefined) {
        //     }
        // });
    }
}

import { System } from "../../ecs";
import { ProjectileArchetype } from "../../ecs/Archetypes";
import { Sprite, SpriteMaterial, AdditiveBlending } from "three";
import { loadTexture } from "../../Helpers";
import { random } from "lodash";

export class ProjectileMeshSystem extends System {
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
    private readonly family = this.createEntityFamily({
        archetype: new ProjectileArchetype(),

        onEntityAdded: (entity) => {
            let sprite = this.group.children.find((child) => {
                return !child.visible;
            });

            if (sprite === undefined) {
                sprite = new Sprite(this.material);
                this.group.add(sprite);
            }

            sprite.visible = true;
            sprite.name = entity.id;
            sprite.scale.setScalar(random(0.5, 0.75, true));
            sprite.position.copy(entity.position);
        },

        onEntityRemvoed: (entity) => {
            const sprite = this.group.getObjectByName(entity.id);
            if (sprite !== undefined) {
                sprite.visible = false;
            }
        },
    });

    public update() {
        this.family.entities.forEach((entity) => {
            const sprite = this.group.getObjectByName(entity.id);
            if (sprite !== undefined) {
                sprite.position.copy(entity.position);
            }
        });
    }
}

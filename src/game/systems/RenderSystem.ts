import { System } from "../ecs";
import { World } from "../ecs";
import { Comp } from "../ecs";

export class RenderSystem extends System {
    private readonly group = this.createSceneGroup();
    private readonly family = this.createEntityFamily({
        archetype: {
            position: new Comp.Position(),
            render: new Comp.Render(),
        },

        onEntityAdded: ({ render }) => {
            this.group.add(render.obj);
        },

        onEntityRemvoed: ({ render }) => {
            this.group.remove(render.obj);
        },
    });

    public update(world: World) {
        this.family.entities.forEach(({ render, position, rotation }) => {
            render.obj.position.copy(position);

            if (rotation !== undefined) {
                render.obj.rotation.set(rotation.x, rotation.y, 0, "YXZ");
            }

            const light = world.level.getVoxelLightAt(position);
            if (!render.mat.color.equals(light)) {
                render.mat.color.lerp(light, 0.125);
                render.mat.needsUpdate = true;
            }
        });
    }
}

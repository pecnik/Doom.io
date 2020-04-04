import { System, Family, FamilyBuilder, Entity } from "@nova-engine/ecs";
import { Group, Vector3 } from "three";
import { World } from "../data/World";
import { Comp } from "../data/Comp";
import { onFamilyChange } from "../utils/EntityUtils";
import { Level } from "../../editor/Level";

export class RenderSystem extends System {
    private readonly family: Family;
    private readonly group: Group;

    public constructor(world: World) {
        super();

        this.family = new FamilyBuilder(world)
            .include(Comp.Render)
            .include(Comp.Position2D)
            .build();

        this.group = new Group();
        world.scene.add(this.group);

        onFamilyChange(world, this.family, {
            onEntityAdded: (entity: Entity) => {
                const render = entity.getComponent(Comp.Render);
                this.group.add(render.obj);
            },
            onEntityRemoved: (entity: Entity) => {
                const render = entity.getComponent(Comp.Render);
                this.group.remove(render.obj);
            },
        });
    }

    public update(world: World) {
        for (let i = 0; i < this.family.entities.length; i++) {
            const entity = this.family.entities[i];
            const render = entity.getComponent(Comp.Render);
            const position = entity.getComponent(Comp.Position2D);
            render.obj.position.set(position.x, -0.5, position.y);

            // TODO: UPDATE TO 3D
            const index = new Vector3(position.x, 0, position.y);
            const light = Level.getVoxelLightColor(world.level.data, index);
            if (!render.mat.color.equals(light)) {
                render.mat.color.lerp(light, 0.125);
                render.mat.needsUpdate = true;
            }
        }
    }
}

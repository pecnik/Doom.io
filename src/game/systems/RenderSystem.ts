import { System, Family, FamilyBuilder, Entity } from "@nova-engine/ecs";
import { World } from "../data/World";
import { Comp } from "../data/Comp";
import { onFamilyChange } from "../data/EntityUtils";
import { Group } from "three";

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
            }
        });
    }

    public update() {
        for (let i = 0; i < this.family.entities.length; i++) {
            const entity = this.family.entities[i];
            const render = entity.getComponent(Comp.Render);
            const position = entity.getComponent(Comp.Position2D);
            render.obj.position.set(position.x, -0.5, position.y);
        }
    }
}

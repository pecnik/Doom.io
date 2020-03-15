import { Entity } from "@nova-engine/ecs";
import { uniqueId } from "lodash";
import { Comp } from "./Comp";
import { setRenderMesh } from "./EntityUtils";

export module EntityFactory {
    const nextID = () => uniqueId("e");

    export function Player() {
        const entity = new Entity();
        entity.id = nextID();

        entity.putComponent(Comp.PlayerInput);
        entity.putComponent(Comp.Position2D);
        entity.putComponent(Comp.Velocity2D);
        entity.putComponent(Comp.Rotation2D);
        entity.putComponent(Comp.Collision);

        return entity;
    }

    export function Barrel() {}

    export function Decal() {}

    export function Wall() {
        const entity = new Entity();
        entity.id = nextID();

        entity.putComponent(Comp.Position2D);
        entity.putComponent(Comp.Render);

        setRenderMesh(entity, "/assets/models/metal_box.glb");

        return entity;
    }
}

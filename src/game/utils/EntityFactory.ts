import { Entity } from "@nova-engine/ecs";
import { uniqueId } from "lodash";
import { Comp } from "../data/Comp";
import { loadRenderMesh, setColliderFromMesh } from "./EntityUtils";

export module EntityFactory {
    const nextID = () => uniqueId("e");

    export function Player() {
        const entity = new Entity();
        entity.id = nextID();

        entity.putComponent(Comp.PlayerInput);
        entity.putComponent(Comp.Position);
        entity.putComponent(Comp.Velocity);
        entity.putComponent(Comp.Rotation2D);
        entity.putComponent(Comp.Collision);
        entity.putComponent(Comp.Shooter);
        entity.putComponent(Comp.Gunshot);
        entity.putComponent(Comp.Footstep);

        return entity;
    }

    export function Barrel() {
        const entity = new Entity();
        entity.id = nextID();

        entity.putComponent(Comp.Position);
        entity.putComponent(Comp.Collider);
        entity.putComponent(Comp.Render);
        entity.putComponent(Comp.Health);

        loadRenderMesh(entity, "/assets/models/barrel.glb").then(() => {
            setColliderFromMesh(entity);
        });

        return entity;
    }

    export function Wall() {
        const entity = new Entity();
        entity.id = nextID();

        entity.putComponent(Comp.Position);
        entity.putComponent(Comp.Collider);
        entity.putComponent(Comp.Render);
        entity.putComponent(Comp.RenderDecalTag);

        loadRenderMesh(entity, "/assets/models/metal_box.glb").then(() => {
            setColliderFromMesh(entity);
        });

        return entity;
    }
}

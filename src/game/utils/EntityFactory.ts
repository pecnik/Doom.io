import { uniqueId } from "lodash";
import { Comp } from "../ecs";
import { loadRenderMesh, setColliderFromMesh } from "./Helpers";

export module EntityFactory {
    const nextID = () => uniqueId("e");

    export function Player() {
        const entity = {
            id: nextID(),
            input: new Comp.PlayerInput(),
            position: new Comp.Position(),
            velocity: new Comp.Velocity(),
            rotation: new Comp.Rotation2D(),
            collision: new Comp.Collision(),
            shooter: new Comp.Shooter(),
            gunshot: new Comp.Gunshot(),
            footstep: new Comp.Footstep(),
            jump: new Comp.Jump(),
        };

        return entity;
    }

    export function Barrel() {
        const entity = {
            id: nextID(),
            position: new Comp.Position(),
            collider: new Comp.Collider(),
            render: new Comp.Render(),
            health: new Comp.Health(),
        };

        loadRenderMesh(entity, "/assets/models/barrel.glb").then(() => {
            setColliderFromMesh(entity);
        });

        return entity;
    }

    export function Wall() {
        const entity = {
            id: nextID(),
            renderdecaltag: new Comp.RenderDecalTag(),
            position: new Comp.Position(),
            collider: new Comp.Collider(),
            render: new Comp.Render(),
        };

        loadRenderMesh(entity, "/assets/models/metal_box.glb").then(() => {
            setColliderFromMesh(entity);
        });

        return entity;
    }
}

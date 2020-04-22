import { uniqueId } from "lodash";
import { Comp } from "../ecs";
import { loadRenderMesh } from "../Helpers";

export module EntityFactory {
    const nextID = () => uniqueId("e");

    export function Player() {
        const entity = {
            id: nextID(),
            input: new Comp.PlayerInput(),
            position: new Comp.Position(),
            velocity: new Comp.Velocity(),
            rotation: new Comp.Rotation(),
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
            render: new Comp.Render(),
            health: new Comp.Health(),
        };

        loadRenderMesh(entity, "/assets/models/barrel.glb");

        return entity;
    }
}

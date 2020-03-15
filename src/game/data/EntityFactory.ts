import { Entity } from "@nova-engine/ecs";
import { uniqueId } from "lodash";
import { Comp } from "./Comp";

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

    export function Wall() {}
}

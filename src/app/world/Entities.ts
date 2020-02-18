import { Entity } from "@nova-engine/ecs";
import { uniqueId } from "lodash";
import {
    PositionComponent,
    VelocityComponent,
    RotationComponent
} from "./Components";

export function PlayerEntity(id = uniqueId("e")) {
    const entity = new Entity();
    entity.id = id;
    entity.putComponent(PositionComponent);
    entity.putComponent(VelocityComponent);
    entity.putComponent(RotationComponent);
    return entity;
}

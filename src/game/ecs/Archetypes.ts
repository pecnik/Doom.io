import { Components, AnyComponents } from "./Components";

export class PlayerArchetype implements AnyComponents {
    public playerData = new Components.PlayerData();
    public avatarSpawner = new Components.AvatarSpawner();
}

export class AvatarArchetype implements AnyComponents {
    public playerId = "";
    public avatarTag = true;
    public position = new Components.Position();
    public velocity = new Components.Velocity();
    public rotation = new Components.Rotation();
    public collision = new Components.Collision();
    public footstep = new Components.Footstep();
    public health = new Components.Health();
    public avatar = new Components.Avatar();
    public shooter = new Components.Shooter();
}

export class LocalAvatarArchetype extends AvatarArchetype {
    public jump = new Components.Jump();
    public input = new Components.Input();
    public eventsBuffer = [];
}

export class EnemyAvatarArchetype extends AvatarArchetype {
    public render = new Components.Render();
}

export class PickupArchetype implements AnyComponents {
    public position = new Components.Position();
    public rotation = new Components.Rotation();
    public render = new Components.Render();
    public pickup = new Components.Pickup();
}

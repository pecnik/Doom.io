import { Comp, AnyComponents } from "./Components";

export class PlayerArchetype implements AnyComponents {
    public playerData = new Comp.PlayerData();
}

export class AvatarArchetype implements AnyComponents {
    public playerId = "";
    public avatarTag = true;
    public position = new Comp.Position();
    public velocity = new Comp.Velocity();
    public rotation = new Comp.Rotation();
    public collision = new Comp.Collision();
    public gunshot = new Comp.Gunshot();
    public footstep = new Comp.Footstep();
    public health = new Comp.Health();
}

export class LocalAvatarArchetype extends AvatarArchetype {
    public jump = new Comp.Jump();
    public input = new Comp.Input();
    public shooter = new Comp.Shooter();
    public eventsBuffer = [];
}

export class EnemyAvatarArchetype extends AvatarArchetype {
    public render = new Comp.Render();
}

export class PickupArchetype implements AnyComponents {
    public position = new Comp.Position();
    public rotation = new Comp.Rotation();
    public render = new Comp.Render();
    public pickup = new Comp.Pickup();
}

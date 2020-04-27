import { Comp, AnyComponents } from "./Components";

export class PlayerArchetype implements AnyComponents {
    public playerTag = true;
    public localPlayerTag = true;
    public eventsBuffer = [];
    public input = new Comp.PlayerInput();
    public position = new Comp.Position();
    public velocity = new Comp.Velocity();
    public rotation = new Comp.Rotation();
    public collision = new Comp.Collision();
    public shooter = new Comp.Shooter();
    public gunshot = new Comp.Gunshot();
    public footstep = new Comp.Footstep();
    public health = new Comp.Health();
    public jump = new Comp.Jump();
}

export class EnemyArchetype implements AnyComponents {
    public playerTag = true;
    public enemyPlayerTag = true;
    public position = new Comp.Position();
    public velocity = new Comp.Velocity();
    public rotation = new Comp.Rotation();
    public collision = new Comp.Collision();
    public shooter = new Comp.Shooter();
    public gunshot = new Comp.Gunshot();
    public footstep = new Comp.Footstep();
    public render = new Comp.Render();
    public health = new Comp.Health();
}

export class PickupArchetype implements AnyComponents {
    public position = new Comp.Position();
    public rotation = new Comp.Rotation();
    public render = new Comp.Render();
    public pickup = new Comp.Pickup();
}

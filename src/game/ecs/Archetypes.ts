import { Components, AnyComponents } from "./Components";

export class PlayerArchetype implements AnyComponents {
    public playerId = "";
    public playerData = new Components.PlayerData();
}

export class AvatarArchetype implements AnyComponents {
    public playerId = "";
    public avatarTag = true;
    public gravity = true;
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
    public localAvatarTag = true;
    public jump = new Components.Jump();
    public input = new Components.Input();
    public hitIndicator = new Components.HitIndicator();
    public cameraShake = new Components.CameraShake();
}

export class EnemyAvatarArchetype extends AvatarArchetype {
    public enemyAvatarTag = true;
    public entityMesh = new Components.EntityMesh("/assets/mesh/snowman.glb");
}

export class ProjectileArchetype implements AnyComponents {
    public playerId = "";
    public projectile = new Components.Projectile();
    public position = new Components.Position();
    public velocity = new Components.Velocity();
    public collision = new Components.Collision();
    // public entityMesh = new Components.EntityMesh(
    //     "/assets/mesh/projectile.glb"
    // );
}

export class PickupArchetype implements AnyComponents {
    public pickupTag = true;
    public position = new Components.Position();
    public rotation = new Components.Rotation();
    public entityMesh = new Components.EntityMesh();
}

export class AmmoPackArchetype extends PickupArchetype {
    public pickupTag = true;
    public pickupAmmo = new Components.PickupAmmo();
    public position = new Components.Position();
    public rotation = new Components.Rotation();
    public entityMesh = new Components.EntityMesh();
}

export class HealthArchetype extends PickupArchetype {
    public pickupTag = true;
    public pickupHealth = new Components.PickupHealth();
    public position = new Components.Position();
    public rotation = new Components.Rotation();
    public entityMesh = new Components.EntityMesh();
}

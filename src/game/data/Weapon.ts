export enum WeaponType {
    Pistol,
    Shotgun,
    Machinegun,
    Plasma,
}

export class WeaponSpec {
    public type = WeaponType.Pistol;
    public name = "Gun";

    public scope = false;

    public accuracy = 1;
    public spread = 0;

    public bulletDamage = 1;
    public bulletsPerShot = 1;
    public firerate = 0; // sec
    public reloadSpeed = 0; // Sec
    public maxLoadedAmmo = 1;
    public maxReservedAmmo = 1;

    // Assets
    public icon = "/assets/sprites/hud/icon_hg.png";
    public povSprite = "";
    public povFireSprites: string[] = [];
    public fireSound = "";
    public reloadSound = "";
    public ammoPickupMesh = "";
}

export class WeaponSpecBuilder {
    private readonly weaponSpec = new WeaponSpec();

    public type(type: WeaponType) {
        this.weaponSpec.type = type;
        return this;
    }

    public name(name: string) {
        this.weaponSpec.name = name;
        return this;
    }

    public icon(icon: string) {
        this.weaponSpec.icon = icon;
        return this;
    }

    public ammo(maxLoadedAmmo: number, maxReservedAmmo: number) {
        this.weaponSpec.maxLoadedAmmo = maxLoadedAmmo;
        this.weaponSpec.maxReservedAmmo = maxReservedAmmo;
        return this;
    }

    public accuracy(accuracy: number) {
        this.weaponSpec.accuracy = accuracy;
        this.weaponSpec.spread = 0.3 * (1 - accuracy);
        return this;
    }

    public damage(damage: number, count = 1) {
        this.weaponSpec.bulletDamage = damage;
        this.weaponSpec.bulletsPerShot = count;
        return this;
    }

    public roundsPerSec(rps: number) {
        this.weaponSpec.firerate = 1 / rps;
        return this;
    }

    public reloadSpeed(speed: number) {
        this.weaponSpec.reloadSpeed = speed;
        return this;
    }

    public povSprite(sprite: string, povFireSprites = [sprite]) {
        this.weaponSpec.povSprite = sprite;
        this.weaponSpec.povFireSprites = povFireSprites;
        return this;
    }

    public ammoPickupMesh(mesh: string) {
        this.weaponSpec.ammoPickupMesh = mesh;
        return this;
    }

    public sound(sound: { fire: string; reload: string }) {
        this.weaponSpec.fireSound = sound.fire;
        this.weaponSpec.reloadSound = sound.reload;
        return this;
    }

    public scope() {
        this.weaponSpec.scope = true;
        return this;
    }

    public build() {
        return Object.freeze(this.weaponSpec);
    }
}

export const WEAPON_SPEC_RECORD: Record<WeaponType, Readonly<WeaponSpec>> = {
    [WeaponType.Pistol]: new WeaponSpecBuilder()
        .type(WeaponType.Pistol)
        .name("Pistol")
        .icon("/assets/sprites/hud/icon_hg.png")
        .ammo(8, 256)
        .damage(20)
        .accuracy(0.9)
        .roundsPerSec(6)
        .reloadSpeed(1)
        .povSprite("/assets/sprites/Pistol/PIS001.png", [
            "/assets/sprites/Pistol/PIS002.png",
            "/assets/sprites/Pistol/PIS003.png",
            "/assets/sprites/Pistol/PIS004.png",
            "/assets/sprites/Pistol/PIS001.png",
        ])
        .ammoPickupMesh("/assets/mesh/ammo_pickup_handgun.glb")
        .sound({
            fire: "/assets/sounds/fire-gun.wav",
            reload: "/assets/sounds/reload.wav",
        })
        .scope()
        .build(),

    [WeaponType.Shotgun]: new WeaponSpecBuilder()
        .type(WeaponType.Shotgun)
        .name("Shotgun")
        .icon("/assets/sprites/hud/icon_sg.png")
        .ammo(3, 128)
        .damage(15, 4)
        .accuracy(0.1)
        .roundsPerSec(2)
        .reloadSpeed(1.25)
        .povSprite("/assets/sprites/Shotgun/SHT001.png", [
            "/assets/sprites/Shotgun/SHT002.png",
            "/assets/sprites/Shotgun/SHT003.png",
            "/assets/sprites/Shotgun/SHT004.png",
            "/assets/sprites/Shotgun/SHT005.png",
            "/assets/sprites/Shotgun/SHT006.png",
        ])
        .ammoPickupMesh("/assets/mesh/ammo_pickup_shotgun.glb")
        .sound({
            fire: "/assets/sounds/fire-shotgun.wav",
            reload: "/assets/sounds/reload.wav",
        })
        .build(),

    [WeaponType.Machinegun]: new WeaponSpecBuilder()
        .type(WeaponType.Machinegun)
        .name("Machinegun")
        .icon("/assets/sprites/hud/icon_mg.png")
        .ammo(32, 512)
        .damage(15)
        .accuracy(0.75)
        .roundsPerSec(5)
        .reloadSpeed(1.5)
        .povSprite("/assets/sprites/Machinegun/MG0001.png", [
            "/assets/sprites/Machinegun/MG0002.png",
            "/assets/sprites/Machinegun/MG0003.png",
            "/assets/sprites/Machinegun/MG0004.png",
        ])
        .ammoPickupMesh("/assets/mesh/ammo_pickup_machinegun.glb")
        .sound({
            fire: "/assets/sounds/fire-machine-gun.wav",
            reload: "/assets/sounds/reload.wav",
        })
        .build(),

    [WeaponType.Plasma]: new WeaponSpecBuilder()
        .type(WeaponType.Plasma)
        .name("Machinegun")
        .icon("/assets/sprites/hud/icon_pl.png")
        .ammo(20, 100)
        .damage(100)
        .accuracy(0.75)
        .roundsPerSec(10)
        .reloadSpeed(2)
        .povSprite("/assets/sprites/Plasma/PLR001.png", [
            "/assets/sprites/Plasma/PLR008.png",
            "/assets/sprites/Plasma/PLR009.png",
            "/assets/sprites/Plasma/PLR007.png",
        ])
        .ammoPickupMesh("/assets/mesh/ammo_pickup_plasma.glb")
        .sound({
            fire: "/assets/sounds/fire-plasma.wav",
            reload: "/assets/sounds/reload.wav",
        })
        .build(),
};

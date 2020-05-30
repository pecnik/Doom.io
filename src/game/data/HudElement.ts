import { Texture, SpriteMaterial, Sprite, BoxHelper } from "three";
import { HUD_WIDTH, HUD_HEIGHT } from "./Globals";

export class HudElement<T> {
    public readonly props: T;
    public readonly sprite: Sprite;
    public readonly width: number;
    public readonly height: number;

    public readonly texture: Texture;
    public readonly canvas: HTMLCanvasElement;
    public readonly ctx: CanvasRenderingContext2D;

    public constructor(config: { props: T; width: number; height: number }) {
        const { props, width, height } = config;
        this.props = props;
        this.width = width;
        this.height = height;

        this.canvas = document.createElement("canvas");
        this.canvas.width = width;
        this.canvas.height = height;

        this.texture = new Texture(this.canvas);
        this.texture.needsUpdate = true;

        const material = new SpriteMaterial({ map: this.texture });
        this.sprite = new Sprite(material);
        this.sprite.renderOrder = 100;
        this.sprite.scale.set(width, height, 1);

        this.ctx = this.canvas.getContext("2d") as CanvasRenderingContext2D;
        this.ctx.font = "Normal 24px Arial";
        this.ctx.textAlign = "center";
        this.ctx.textBaseline = "middle";
        this.ctx.fillStyle = "white";
    }

    public boxHelper() {
        return new BoxHelper(this.sprite);
    }

    public moveRight() {
        this.sprite.position.x = HUD_WIDTH / 2;
        this.sprite.position.x -= this.width / 2;
        return this;
    }

    public moveLeft(offset = 0) {
        this.sprite.position.x = -HUD_WIDTH / 2;
        this.sprite.position.x += this.width / 2 + offset;
        return this;
    }

    public moveBottom() {
        this.sprite.position.y = -HUD_HEIGHT / 2;
        this.sprite.position.y += this.height / 2;
        return this;
    }

    public moveTop() {
        this.sprite.position.y = HUD_HEIGHT / 2;
        this.sprite.position.y -= this.height / 2;
        return this;
    }
}

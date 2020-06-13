export const SCREEN_WIDTH = 800;
export const SCREEN_HEIGHT = 600;
export const HUD_WIDTH = 800;
export const HUD_HEIGHT = 600;

export const PLAYER_RADIUS = 0.25;
export const PLAYER_HEIGHT = 0.6;
export const PLAYER_CROUCH_H = 0.25;

export const RUN_SPEED = 3;
export const WALK_SPEED = 1;
export const SWAP_SPEED = 0.25;
export const DASH_CHARGE = 2;

export const JUMP_HEIGHT = 0.5;
export const JUMP_TIME = 0.75; // sec
export const GRAVITY = (2 * JUMP_HEIGHT) / Math.pow(JUMP_TIME * 0.5, 2);
export const JUMP_SPEED = GRAVITY * JUMP_TIME * 0.5;

export const MAX_PICKUP_COUNT = 8;

export const DEFAULT_LEVEL = "/assets/levels/dungeon_1.json";

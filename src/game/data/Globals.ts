export const RUN_SPEED = 4;
export const WALK_SPEED = 1.5;

export const FLOOR = 0;
export const CEIL = 0.374;

export const JUMP_HEIGHT = CEIL;
export const JUMP_TIME = 0.75; // sec
export const GRAVITY = (2 * JUMP_HEIGHT) / Math.pow(JUMP_TIME * 0.5, 2);
export const JUMP_SPEED = GRAVITY * JUMP_TIME * 0.5;

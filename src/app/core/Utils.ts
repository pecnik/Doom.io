export function findInMap<T, K>(
    map: Map<K, T>,
    fn: (item: T, key: K) => boolean
): [T, K] | [] {
    for (const [entityId, avatar] of map) {
        if (fn(avatar, entityId) === true) {
            return [avatar, entityId];
        }
    }
    return [];
}

export function degToRad(degrees: number) {
    return (degrees * Math.PI) / 180;
}

export function radToDeg(radians: number) {
    return (radians * 180) / Math.PI;
}

export function modulo(val: number, max: number) {
    return ((val % max) + max) % max;
}

export function lerp(curr: number, goal: number, dt: number = 1) {
    const diff = goal - curr;
    if (diff > dt) return curr + dt;
    if (diff < -dt) return curr - dt;
    return goal;
}

export function ease(curr: number, goal: number, rate = 0.1) {
    const diff = goal - curr;
    const dt = Math.abs(diff * rate);
    if (diff > dt) return curr + dt;
    if (diff < -dt) return curr - dt;
    return goal;
}

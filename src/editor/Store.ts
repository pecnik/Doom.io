import Vue from "vue";
import Vuex from "vuex";

Vue.use(Vuex);

export class State {
    public toolId: "block" | "paint" | "entity" = "block";

    public textureSlots = [0, 1, 2, 3, 8, 9, 10, 11];
    public textureSlotIndex = 0;

    public renderWireframe = true;
}

export const store = new Vuex.Store({
    state: new State(),
    getters: {
        tileId(state: State) {
            const { textureSlots, textureSlotIndex } = state;
            return textureSlots[textureSlotIndex];
        }
    }
});

<template>
    <div>
        <div id="right-menu" class="panel">
            <button @click="createLevel">New level</button>
            <br>
            <button @click="createFloor">Fill floor</button>
            <hr>
            <div>{{ level.width }} x {{ level.height }} x {{ level.depth }}</div>
        </div>
        <div id="tile-menu-bar" class="panel">
            <span v-for="(tileId, index) in this.tileIdSlotArray"
                v-on:click="setSlotIndex(index)"
                :key="index + 1"
                :class="{ active: index === tileIdSlotIndex }"
                class="tile-slot-option">
                <tile :tileId="tileId"></tile>
            </span>
        </div>
    </div>
</template>
<script>
import Tile from "./Tile.vue";
export default {
    components: { Tile },
    computed: {
        level() {
            return this.$store.state.level;
        },
        tileIdSlotIndex() {
            return this.$store.state.tileIdSlotIndex;
        },
        tileIdSlotArray() {
            return this.$store.state.tileIdSlotArray;
        }
    },
    methods: {
        createLevel() {
            const [width, height, depth] = prompt("Size?", "16,4,16")
                .split(",")
                .map(val => parseInt(val))
                .map(val => (!isNaN(val) ? val : 8));
            this.$store.dispatch("initLevel", { width, height, depth });
        },
        createFloor() {
            this.$store.dispatch("createFloor", { tileId: 8 });
        },
        setSlotIndex(index) {
            this.$store.dispatch("setTileIdSlotIndex", index);
        }
    }
};
</script>
<style scoped lang="scss">
.panel {
    padding: 16px;
    color: #f2f2f2;
    background: #444;
    border: 1px solid #222;
    box-sizing: border-box;
}

#right-menu {
    position: absolute;
    height: 100vh;
    width: 200px;
    right: 0;
}

#tile-menu-bar {
    text-align: center;
    position: absolute;
    left: auto;
    height: 64px + (16px * 2);
    width: 100vw;
    bottom: 0;

    .tile-slot-option {
        margin-left: 4px;
        margin-right: 4px;
        display: inline-block;
        cursor: pointer;
        border: 1px solid #888;
        font-size: 0;

        &:hover,
        &.active {
            border: 1px solid orange;
        }
    }
}
</style>

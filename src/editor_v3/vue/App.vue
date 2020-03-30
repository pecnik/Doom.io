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
            <tile v-for="(tileId, key) in this.tileIdSlotArray"
                :key="key + 1"
                :tileId="tileId"></tile>
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
    position: absolute;
    left: auto;
    height: 80px;
    width: 100vw;
    bottom: 0;
}
</style>

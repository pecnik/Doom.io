<template>
    <div id="right-menu">
        <button @click="createLevel">New level</button>
        <br>
        <button @click="createFloor">Fill floor</button>
        <hr>
        <div>{{ $store.state.level.width }}</div>
        <div>{{ $store.state.level.height }}</div>
        <div>{{ $store.state.level.depth }}</div>
    </div>
</template>
<script>
export default {
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
#right-menu {
    padding: 16px;

    position: absolute;
    height: 100vh;
    width: 200px;
    right: 0;

    color: #222;
    background: #f2f2f2;
}
</style>

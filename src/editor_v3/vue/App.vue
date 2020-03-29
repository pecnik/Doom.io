<template>
    <div id="right-menu">
        <button @click="createLevel">New level</button>
    </div>
</template>
<script>
export default {
    mounted() {
        console.log("Mounted");
    },
    methods: {
        createLevel() {
            const getNumber = (label, fallback) => {
                const value = parseInt(prompt(label, 16));
                return !isNaN(value) ? value : fallback;
            };

            const width = getNumber("width?", 16);
            const height = getNumber("height?", 8);
            const depth = getNumber("depth?", 16);

            console.log({ width, height, depth });
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

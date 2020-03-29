<template>
    <div id="right-menu">
        <button>New level</button>
    </div>
</template>
<script>
export default {
    mounted() {
        console.log("Mounted");
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

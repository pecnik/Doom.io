<template>
    <v-app>
        <div class="app-layout">
            <div class="app-sidemenu">
                <sidemenu></sidemenu>
            </div>
            <div class="app-viewport">
                <viewport></viewport>
            </div>
        </div>
    </v-app>
</template>
<script>
import Sidemenu from "./Sidemenu.vue";
import Viewport from "./Viewport.vue";
export default {
    components: { Sidemenu, Viewport }
};
</script>
<style scoped lang="scss">
.app-layout {
    width: 100vw;
    height: 100vh;
    display: grid;
    grid-template-rows: minmax(0, 1fr);
    grid-template-columns: 400px minmax(0, 1fr);
    box-sizing: border-box;

    .app-sidemenu {
        grid-row: 1;
        grid-column: 1;
        padding: 16px;
        overflow-y: auto;
    }

    .app-viewport {
        grid-row: 1;
        grid-column: 2;
        padding: 0;
        overflow-y: auto;
    }
}
</style>
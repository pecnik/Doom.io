<template>
    <div>
        <div class="mb-4">
            <menu-tool></menu-tool>
        </div>
        <div class="mb-4">
            <menu-view></menu-view>
        </div>
    </div>
</template>
<script>
// import MenuFile from "./MenuFile.vue";
import MenuView from "./MenuView.vue";
import MenuTool from "./MenuTool.vue";
export default {
    components: { MenuView, MenuTool }
};
</script>
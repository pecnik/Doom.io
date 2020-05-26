<template>
    <div>
        <div class="mb-4">
            <menu-tools></menu-tools>
        </div>
        <div class="mb-4">
            <menu-view></menu-view>
        </div>
    </div>
</template>
<script>
import MenuView from "./MenuView.vue";
import MenuTools from "./MenuTools.vue";
export default {
    components: { MenuView, MenuTools }
};
</script>
<template>
    <div class="texture-input">
        <texture-tile @click.native="dialog.open = true" :tile="value"></texture-tile>
        <v-dialog v-model="dialog.open" max-width="580px">
            <v-card>
                <v-card-title>Select texture</v-card-title>
                <v-card-text>
                    <texture-tile
                        v-for="n in 64"
                        :key="n"
                        :tile="n - 1"
                        :selected="n - 1 === value"
                        @click.native="seelctTile(n - 1)"
                        class="texture-tile-option"
                    ></texture-tile>
                </v-card-text>
            </v-card>
        </v-dialog>
    </div>
</template>
<script>
import TextureTile from "./TextureTile.vue";
export default {
    components: { TextureTile },
    props: {
        value: { type: Number, required: true }
    },
    methods: {
        seelctTile(tile) {
            this.$emit("input", tile);
            this.dialog.open = false;
        }
    },
    data() {
        return {
            dialog: {
                open: false
            }
        };
    }
};
</script>
<style scoped lang="scss">
.texture-input {
    cursor: pointer;
}

.texture-tile-option {
    margin-right: 8px;
    margin-bottom: 8px;
    cursor: pointer;

    &:hover {
        border-color: #ccc;
    }
}
</style>
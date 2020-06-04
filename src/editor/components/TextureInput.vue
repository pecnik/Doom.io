<template>
    <div class="texture-input">
        <img
            class="texture-tile"
            :src="texture.src"
            @click="dialog.open = true"
            :tile="value"
        />
        <v-dialog v-model="dialog.open" max-width="580px">
            <v-card>
                <v-card-title>Select texture</v-card-title>
                <v-card-text>
                    <img
                        v-for="(texture, index) in levelTextures"
                        :key="index + 1"
                        :src="texture.src"
                        :class="{ selected: index === value }"
                        class="texture-tile texture-tile-option"
                        @click="selectTexture(index)"
                    />
                </v-card-text>
            </v-card>
        </v-dialog>
    </div>
</template>
<script>
export default {
    props: {
        value: { type: Number, required: true }
    },
    computed: {
        levelTextures() {
            return this.$store.state.levelTextures || [];
        },
        texture() {
            const texture = this.levelTextures.find((_, index) => {
                return index === this.value;
            });

            if (texture === undefined) {
                return { src: "" };
            }

            return texture;
        }
    },
    methods: {
        selectTexture(textureIndex) {
            this.$emit("input", textureIndex);
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

.texture-tile {
    margin-right: 8px;
    margin-bottom: 8px;

    width: 64px;
    height: 64px;
    display: inline-block;

    &.texture-tile-option {
        cursor: pointer;

        &:hover {
            border-color: #ccc;
        }
    }
}
</style>
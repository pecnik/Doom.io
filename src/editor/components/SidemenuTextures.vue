<template>
    <v-card>
        <v-card-title>Textures</v-card-title>
        <v-card-text>
            <div
                v-for="(texture, index) in levelTextures"
                :key="index + 1"
                class="texture-slot mt-4 mb-4"
            >
                <label class="mb-2">Texture[{{ index }}]</label>
                <div>
                    <img :src="texture.src" />
                    <v-btn small color="teal" @click="scaleTexture(index, -1)">
                        <v-icon>mdi-minus</v-icon>
                    </v-btn>
                    <v-btn small color="teal" @click="scaleTexture(index, +1)">
                        <v-icon>mdi-plus</v-icon>
                    </v-btn>
                    <strong>X{{ texture.scale }}</strong>
                    <small>
                        (
                        {{ 2 ** texture.scale }}
                        x
                        {{ 2 ** texture.scale }}
                        )
                    </small>
                </div>
            </div>
            <v-btn tag="label" color="teal"
                >Add texture
                <input
                    type="file"
                    style="display: none;"
                    @input="uploadImage"
                />
            </v-btn>
        </v-card-text>
    </v-card>
</template>
<script>
import TextureInput from "./TextureInput.vue";
import { editor } from "../Editor";
import { Level } from "../Level";
import { clamp } from "lodash";

export default {
    components: { TextureInput },
    computed: {
        levelTextures() {
            return this.$store.state.levelTextures || [];
        }
    },
    methods: {
        scaleTexture(index, offset) {
            editor.commitLevelMutation(level => {
                const texture = level.textures[index];
                texture.scale += offset;
                texture.scale = clamp(texture.scale, 0, 4);
            });
        },
        uploadImage(ev) {
            const files = ev.target.files;
            const file = files[0];

            if (file) {
                const formData = new FormData();
                formData.append("texture", file);
                fetch("/texture/upload", { method: "POST", body: formData })
                    .then(rsp => rsp.json())
                    .then(rsp => {
                        editor.commitLevelMutation(level => {
                            level.textures.push(Level.Texture(rsp.src));
                        });
                    })
                    .catch(console.error);
            }
        }
    }
};
</script>
<style scoped lang="scss">
.texture-slot {
    display: block;

    > label {
        display: block;
    }

    > img {
        display: inline-block;
        width: 64px;
        height: 64px;
    }
}
</style>
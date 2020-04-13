<template>
    <div>
        <v-btn small @click="dialog = true">Settings <v-icon small>mdi-settings</v-icon></v-btn>
        <v-dialog v-model="dialog" max-width="550px">
            <v-card>
                <v-card-title>Settings</v-card-title>
                <v-card-text>
                    <v-switch
                        color="teal"
                        label="Render lighting"
                        :input-value="renderLighting"
                        @change="toggleLighting"></v-switch>
                    <v-switch
                        color="teal"
                        label="Render wireframe"
                        :input-value="renderWireframe"
                        @change="toggleWireframe"></v-switch>
                </v-card-text>
            </v-card>
         </v-dialog>
    </div>
</template>
<script>
export default {
    computed: {
        renderLighting() {
            return this.$store.state.renderWireframe;
        },
        renderWireframe() {
            return this.$store.state.renderWireframe;
        }
    },
    methods: {
        toggleLighting(value) {
            this.$store.state.renderLighting = value;
        },
        toggleWireframe(value) {
            this.$store.state.renderWireframe = value;
        }
    },
    data() {
        return {
            dialog: false
        };
    }
};
</script>
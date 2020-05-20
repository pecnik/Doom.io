import {
    NoToneMapping,
    LinearToneMapping,
    ReinhardToneMapping,
    Uncharted2ToneMapping,
    CineonToneMapping,
    ACESFilmicToneMapping,
} from "three";

export const ToneMapping = {
    NoToneMapping,
    LinearToneMapping,
    ReinhardToneMapping,
    Uncharted2ToneMapping,
    CineonToneMapping,
    ACESFilmicToneMapping,
};

export class SettingsProps {
    public fpsMeter = false;
    public antialiasing = true;
    public toneMapping = ToneMapping.NoToneMapping;
    public toneMappingExposure = 1;
    public renderResolution = 1;
    public mouseSensitivity = 0.1;
}

export class Settings {
    private static readonly key = "Settings";

    public static readonly props = new SettingsProps();

    public static save(props: SettingsProps) {
        const json = JSON.stringify(props);
        localStorage.setItem(Settings.key, json);
        Object.assign(this.props, props);
    }

    public static load() {
        const json = localStorage.getItem(Settings.key);
        if (json) {
            const props = JSON.parse(json) as SettingsProps;
            Object.assign(Settings.props, props);
        }
    }
}

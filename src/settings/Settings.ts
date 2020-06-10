import {
    NoToneMapping,
    LinearToneMapping,
    ReinhardToneMapping,
    Uncharted2ToneMapping,
    CineonToneMapping,
    ACESFilmicToneMapping,
} from "three";

export class InputSettings {
    public mouseSensitivity = 0.1;
}

export class AudioSettings {
    public masterVolume = 1;
}

export class ProfileSettings {
    public displayName = "No-name";
}

export class GraphicsSettings {
    public static readonly ToneMap = Object.freeze({
        NoToneMapping,
        LinearToneMapping,
        ReinhardToneMapping,
        Uncharted2ToneMapping,
        CineonToneMapping,
        ACESFilmicToneMapping,
    });

    public fpsMeter = true;

    public antialiasing = true;
    public renderResolution = 1;

    public toneMap = GraphicsSettings.ToneMap.NoToneMapping;
    public toneMapExposure = 1;
}

export class SettingsData {
    public readonly input = new InputSettings();
    public readonly audio = new AudioSettings();
    public readonly profile = new ProfileSettings();
    public readonly graphics = new GraphicsSettings();
}

export const Settings = new SettingsData();

export function saveSettings(settings: SettingsData) {
    localStorage.setItem("settings", JSON.stringify(settings));
}

export function loadSettings(settings: SettingsData) {
    const json = localStorage.getItem("settings");
    if (json) {
        Object.assign(settings, JSON.parse(json));
    }
}

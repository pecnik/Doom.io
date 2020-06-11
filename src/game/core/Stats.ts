import StatsJs from "stats.js";
import { Settings } from "../../settings/Settings";

export interface StatsPanel {
    update(value: number, max: number): void;
}

export const Stats = {
    begin() {},
    end() {},
    createPanel(_name: string): StatsPanel {
        return { update() {} };
    },
};

if (Settings.graphics.fpsMeter) {
    const stats = new StatsJs();
    Stats.begin = stats.begin.bind(stats);
    Stats.end = stats.end.bind(stats);
    Stats.createPanel = (name: string) => {
        const panel = new StatsJs.Panel(name, "#eeeeee", "#222222");
        stats.addPanel(panel);
        stats.showPanel(0);
        return {
            update: panel.update.bind(panel),
        };
    };
    document.body.appendChild(stats.dom);
}

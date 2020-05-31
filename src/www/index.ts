import { Settings } from "../game/Settings";

const route = location.hash.replace("#", "");
window.addEventListener("hashchange", () => {
    setTimeout(() => location.reload());
});

// Init settings
Settings.load();

// Idk ...
const removeGamearea = () => {
    const gamearea = document.getElementById("gamearea");
    if (gamearea) {
        gamearea.remove();
    }
};

switch (route) {
    case "/game/singleplayer": {
        import("../game");
        break;
    }

    case "/game/multiplayer": {
        const url = location.origin
            .replace(location.port, "8080")
            .replace("http://", "ws://")
            .replace("https://", "ws://");
        const ws = new WebSocket(url);
        ws.onmessage = (msg) => {
            console.log({ msg });
        };

        break;
    }

    case "/editor": {
        removeGamearea();
        import("../editor");
        break;
    }

    case "/settings": {
        removeGamearea();
        import("../settings");
        break;
    }

    default: {
        const homescreen = document.getElementById("homescreen");
        if (homescreen) {
            homescreen.style.display = "block";
        }
        break;
    }
}

// switch (route) {
//     case "editor":
//         import("../editor/index");
//         break;

//     case "game":
//     default:
//         import("../game/index");
//         break;
// }

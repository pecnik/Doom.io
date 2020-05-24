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
    case "/game/singleplayer":
    case "/game/multiplayer": {
        import("../game");
        break;
    }

    case "/editor": {
        removeGamearea();
        import("../editor");
        break;
    }

    case "/editor_v2": {
        removeGamearea();
        import("../editor_v2");
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

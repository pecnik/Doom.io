const route = location.hash.replace("#", "");

window.addEventListener("hashchange", () => {
    setTimeout(() => location.reload());
});

switch (route) {
    case "/game/singleplayer":
    case "/game/multiplayer": {
        import("../game");
        break;
    }

    case "/editor": {
        import("../editor");
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

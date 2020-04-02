const route = location.hash.replace("#", "");

switch (route) {
    case "editor":
        import("../editor_v3/index");
        break;

    case "game":
    default:
        import("../game/index");
        break;
}

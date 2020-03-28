const route = location.hash.replace("#", "");

switch (route) {
    case "editor":
        import("../level_editor/index");
        break;

    case "game":
    default:
        import("../game/index");
        break;
}

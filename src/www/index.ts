const route = location.hash.replace("#", "");

switch (route) {
    case "editor":
        import("../level_editor/index");
        break;

    case "editor_v3":
        import("../editor_v3/index");
        break;

    case "game":
    default:
        import("../game/index");
        break;
}

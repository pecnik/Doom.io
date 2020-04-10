const route = location.hash.replace("#", "");

switch (route) {
    case "editor":
        import("../voxed/index");
        break;

    case "game":
    default:
        import("../game/index");
        break;
}

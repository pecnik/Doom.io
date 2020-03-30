<template>
    <div id="app">
        <div id="menu-left" class="panel"></div>
        <div id="menu-right" class="panel"></div>
    </div>
</template>
<style scoped lang="scss">
#app {
    font-family: "Courier New", Courier, monospace;
    font-size: 16px;

    position: absolute;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;

    display: grid;
    grid-template-rows: 40px 1fr 96px;
    grid-template-columns: 200px 1fr 300px;

    pointer-events: none;

    #menu-top,
    #menu-bot,
    #menu-left,
    #menu-right {
        pointer-events: auto;
    }

    #menu-top {
        grid-row: 1;
        grid-column-start: 2;
        grid-column-end: 3;
    }

    #menu-bot {
        grid-row: 3;
        grid-column-start: 2;
        grid-column-end: 3;
    }

    #menu-left {
        grid-column: 1;
        grid-row-start: 1;
        grid-row-end: 4;
    }

    #menu-right {
        grid-column: 3;
        grid-row-start: 1;
        grid-row-end: 4;
    }
}

.panel {
    color: #f2f2f2;
    background: #222;
}
</style>
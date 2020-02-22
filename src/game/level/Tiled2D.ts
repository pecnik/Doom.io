export module Tiled2D {
    export interface Tileset {
        type: string;
        name: string;
        columns: number;
        margin: number;
        image: string;
        imageheight: number;
        imagewidth: number;
        spacing: number;
        tilecount: number;
        tileheight: number;
        tilewidth: number;
    }

    export interface Tilemap {
        type: string;
        version: number;
        infinite: boolean;
        nextobjectid: number;
        orientation: string;
        width: number;
        height: number;
        renderorder: string;
        tiledversion: number;
        tileheight: number;
        tilewidth: number;
        tilesets: TilesetData[];
        layers: Array<TileLayer | ObjectGroup>;
    }

    export interface TilesetData {
        firstgid: number;
        source: string;
    }

    export interface TileLayer {
        type: "tilelayer";
        name: string;
        data: number[];
        height: number;
        opacity: number;
        visible: boolean;
        width: number;
        x: number;
        y: number;
    }

    export interface ObjectGroup {
        type: "objectgroup";
        name: string;
        draworder: string;
        objects: Object[];
        opacity: number;
        visible: boolean;
        x: number;
        y: number;
    }

    export interface Object {
        height: number;
        id: number;
        name: string;
        point: boolean;
        rotation: number;
        type: string;
        visible: boolean;
        width: number;
        x: number;
        y: number;
    }
}

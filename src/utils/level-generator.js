import WorldTilemapPng from '../../assets/tileset/generation-tileset.png';
import StuffTilemapPng from '../../assets/tileset/Dungeon_Tileset.png';

export const TILES = {
    FLOOR: 0,
    WALL: 1,
    STAIRS: 211,
    CHEST: 260
}

export const NPC = {
    BLUE: 0,
    YELLOW: 1
}

export class Level {
    constructor(scene) {
        this.scene = scene;

        this.height = 0;
        this.width = 0;
        this.rooms = null;
        this.rawLayer = null;
        this.worldLayer = null;
        this.stuffLayer = null;
        this.tilemap = null;

        this.stuffs = {
            stairs : null,
            chests : [],
        }

        this.npcs = [];

        this._callbacks = {
            roomEnter: null,
            roomLeave: null
        };
    }

    get widthInPixels() {
        return this.tilemap.widthInPixels;
    }

    get heightInPixels() {
        return this.tilemap.heightInPixels;
    }

    preload() {
        this.scene.load.image("world-tiles", WorldTilemapPng);
        this.scene.load.image("stuff-tiles", StuffTilemapPng);
    }

    generate(width, height, roomsCount, maxRoomSize) {
        this.width = width;
        this.height = height;

        // заполнение фона
        this._fillBackground();
    
        // генерация комнат
        this._generateRooms(roomsCount, maxRoomSize);
        this._connectRoomsSeries();
        this._connectRoomsNeighbours();

        this._generateStuffs();
        this._generateNpc();

        // заполняем тайлами созданные слои
        this._prepareTiles();

        this._setupCallbacks();

        return [this.worldLayer, this.stuffLayer];
    }

    setRoomEnterCallback(callback) {
        this._callbacks.roomEnter = callback;
    }

    setRoomLeaveCallback(callback) {
        this._callbacks.roomLeave = callback;
    }

    _setupCallbacks() {
        if (this.worldLayer !== null && this.rooms !== null) {
            this.worldLayer.setTileLocationCallback(0, 0, this.width, this.height, (object) => {
                if (this._callbacks.roomEnter === null 
                    && this._callbacks.roomLeave === null) return;

                const [x, y] = [object.x/32, object.y/32];

                let isInside = false;
                this.rooms.forEach(r => {
                    if (r.isInclude(x, y)) {
                        if (this._callbacks.roomEnter !== null) this._callbacks.roomEnter(object, r);
                        isInside = true;
                    }
                });

                if (!isInside && this._callbacks.roomLeave !== null) this._callbacks.roomLeave(object);
            });
        }
    }

    _generateStuffs() {
        const stairsRoom = this.rooms[this.rooms.length-1];
        this.stuffs.stairs = new GameObject(
            TILES.STAIRS,
            Math.floor(stairsRoom.x + stairsRoom.w/2),
            Math.floor(stairsRoom.y + stairsRoom.h/2),
            stairsRoom
        );
        
        this.rooms.forEach(r => {
            if (Math.random() > 0.8) {
                this.stuffs.chests.push(
                    // может совпасть с лестницей
                    new GameObject(
                        TILES.CHEST,
                        Math.floor(r.x + r.w/2 + Math.random() * 4 - 2),
                        Math.floor(r.y + r.h/2 + Math.random() * 4 - 2),
                        r
                    )
                );
            }
        });
    }

    _generateNpc() {
        const getNpcType = function () {
            return Math.floor(Math.random() * 2.99)
        }

        this.rooms.slice(1).forEach(r => {
            if (Math.random() > 0.5) {
                const npcCount = Math.floor(2 + Math.random() * 6);

                for (let i = 0; i < npcCount; i++) {
                    this.npcs.push(
                        new GameObject(
                            getNpcType(),
                            Math.floor(1 + r.x + Math.random() * (r.w - 2)),
                            Math.floor(1 + r.y + Math.random() * (r.h - 2)),
                            r
                        )
                    );
                }
            }
        });
    }

    _prepareTiles() {
        this.tilemap = this.scene.make.tilemap({
            tileWidth: 32,
            tileHeight: 32,
            width: this.width,
            height: this.height
        });
        
        const worldTileset = this.tilemap.addTilesetImage("world-tiles", null, 32, 32, 0, 0);
        this.worldLayer = this.tilemap.createBlankDynamicLayer(null, worldTileset);
        this.worldLayer.setCollision([TILES.WALL]);

        // fill floor and walls
        for (let i = 0; i < this.rawLayer.length; i++) {
            for (let j = 0; j < this.rawLayer[0].length; j++) {
                this.worldLayer.putTileAt(this.rawLayer[i][j], i, j);
            }
        }

        const stuffTileset = this.tilemap.addTilesetImage("stuff-tiles", null, 32, 32, 0, 0);
        this.stuffLayer = this.tilemap.createBlankDynamicLayer(null, stuffTileset);
        this.stuffLayer.setCollision([TILES.CHEST]);

        // add stairs
        this.stuffLayer.putTileAt(TILES.STAIRS, this.stuffs.stairs.x, this.stuffs.stairs.y);
        
        // add chests
        this.stuffs.chests.forEach(chest => {
            this.stuffLayer.putTileAt(TILES.CHEST, chest.x, chest.y);
        });
    }

    _fillBackground() {
        this.rawLayer = [];
        for (let i = 0; i < this.height; i++) {
            this.rawLayer.push([]);
            for (let j = 0; j < this.width; j++) {
                this.rawLayer[i].push(TILES.WALL);
            }
        }
    }

    _generateRooms(roomsCount, maxRoomSize) {
        const width = this.width;
        const height = this.height;
        const rooms = [];

        const createRoom = function (neighbour) {
            const w = Math.floor(maxRoomSize/2 + Math.random() * maxRoomSize/2);
            const h = Math.floor(maxRoomSize/2 + Math.random() * maxRoomSize/2);
            const padding = Math.max(neighbour.w, neighbour.h, w, h) + 2;
        
            const getCoord = function() {
                return Math.random() > 0.5 ? padding : -padding;
            }
        
            let newRoom = new Room(
                neighbour.x + neighbour.w/2 - w/2 + getCoord(),
                neighbour.y + neighbour.h/2 - h/2 + getCoord(),
                w, h);
        
            let counter = 0;
            while (!newRoom.isIntersect(new Room(w+1, h+1, width-w*2-2, height-h*2-2))  // создаем комнату до тех пор, пока она не войдет внутрь мира
                || rooms.filter(r => r.isIntersect(newRoom)).length != 0) {             // и будет не пересекаться с остальными комнатами (20 попыток)
                newRoom = new Room(
                    neighbour.x + neighbour.w/2 - w/2 + getCoord(),
                    neighbour.y + neighbour.h/2 - h/2 + getCoord(),
                    w, h);
        
                if (counter == 20) 
                    return null;
                counter++;
            }
            return newRoom;
        }
   
        rooms.push(Room.createRandom(width, height, maxRoomSize));
        for (let i = 0; i < roomsCount; i++) {
            let r = createRoom(rooms[i]);
    
            if (r === null) {
                for (let j = rooms.length-2; j >= 0 && r === null; j--)
                    r = createRoom(rooms[j]);
            }
    
            if (r === null) {
                console.log('Unable to create room #' + i);
                break;
            }
    
            rooms.push(r);
        }

        this.rooms = rooms;    
        this.rooms.forEach(r => {
            for (let i = 0; i < r.w; i++)
                for (let j = 0; j < r.h; j++)       
                    try {
                        this.rawLayer[r.x+i][r.y+j] = TILES.FLOOR;
                    } catch {}
        });
    }
    
    _connectRoomsSeries() {
        for (let i = 0; i < this.rooms.length-1; i++) {
            const r1 = this.rooms[i];
            const r2 = this.rooms[i+1];
    
            this._lineTo(
                r1.x + r1.w/2,
                r1.y + r1.h/2,
                r2.x + r2.w/2,
                r2.y + r2.h/2);
        }
    }
    
    _connectRoomsNeighbours() {
        this.rooms.forEach(r1 => {
            let neighbour = null;
            let dist = 0xFFFFFFF;
    
            this.rooms.forEach(r2 => {
                if (r1 === r2 || r2.neighbour === r1) return;
    
                const d = r1.getDistance(r2);
                if (d < dist) {
                    dist = d;
                    neighbour = r2;
                }
            });
    
            if (neighbour !== null) {
                this._lineTo(
                    r1.x + r1.w/2, 
                    r1.y + r1.h/2, 
                    neighbour.x + neighbour.w/2, 
                    neighbour.y + neighbour.h/2);
    
                r1.neighbour = neighbour;
            }
        });
    }
    
    _lineTo(x1, y1, x2, y2) {
        const lenByX = Math.abs(x1 - x2);
        const lenByY = Math.abs(y1 - y2);
        x1 = Math.floor(x1)
        x2 = Math.floor(x2)
        y1 = Math.floor(y1)
        y2 = Math.floor(y2)
    
        if (lenByX > lenByY) {
            const stepX = x1 < x2 ? 1 : -1;
            for (let i = x1; i != x2+2*stepX; i += stepX) {
                this.rawLayer[i][y1-1] = TILES.FLOOR;
                this.rawLayer[i][y1] = TILES.FLOOR;
                this.rawLayer[i][y1+1] = TILES.FLOOR;
            }
    
            const stepY = y1 < y2 ? 1 : -1;
            for (let i = y1; i != y2; i += stepY) {
                this.rawLayer[x2-1][i] = TILES.FLOOR;
                this.rawLayer[x2][i] = TILES.FLOOR;
                this.rawLayer[x2+1][i] = TILES.FLOOR;
            }
        } else {
            const stepY = y1 < y2 ? 1 : -1;
            for (let i = y1; i != y2+2*stepY; i += stepY) {
                this.rawLayer[x1-1][i] = TILES.FLOOR;
                this.rawLayer[x1][i] = TILES.FLOOR;
                this.rawLayer[x1+1][i] = TILES.FLOOR;
            }
    
            const stepX = x1 < x2 ? 1 : -1;
            for (let i = x1; i != x2; i += stepX) {
                this.rawLayer[i][y2-1] = TILES.FLOOR;
                this.rawLayer[i][y2] = TILES.FLOOR;
                this.rawLayer[i][y2+1] = TILES.FLOOR;
            }
        }
    }

}

class Room {
    constructor(x, y, width, height) {
        this.x = Math.floor(x);
        this.y = Math.floor(y);
        this.w = Math.floor(width);
        this.h = Math.floor(height);
        this.neighbour = null;
    }

    isIntersect(room) {
        return (this.x-1 < room.x + room.w)
            && (room.x-1 < this.x + this.w)
            && (this.y-1 < room.y + room.h)
            && (room.y-1 < this.y + this.h);
    }

    isInclude(x, y) {
        return this.x <= x 
            && this.x + this.w >= x
            && this.y <= y
            && this.y + this.h >= y; 
    }

    getDistance(room) {
        return Math.sqrt(
            Math.pow(this.x + this.w/2 - room.x + this.w/2, 2) 
            + Math.pow(this.y + this.h/2 - room.y + this.h/2, 2) 
        );
    }

    static createRandom(mapWidth, mapHeight, maxSize) {
        const w = Math.floor(maxSize/2 + Math.random() * maxSize/2);
        const h = Math.floor(maxSize/2 + Math.random() * maxSize/2);
        const roomX = 4 + Math.random() * (mapWidth - w - 8);
        const roomY = 4 + Math.random() * (mapHeight - h - 8); 

        return new Room(roomX, roomY, w, h);
    }
}

class GameObject {
    constructor(type, x, y, room) {
        this.type = type;
        this.x = x;
        this.y = y;
        this.room = room;
    }
}
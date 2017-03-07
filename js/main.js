"use strict";
(function (window) {
    window.fg =
        {
            $: function (selector) {
                return selector.charAt(0) == '#' ? document.getElementById(selector.substr(1)) : document.getElementsByTagName(selector);
            },
            $new: function (name) { return document.createElement(name); },
            loadScript: function (root, name, callBack, callBackParams) {
                var path = root + name.replace(/\./g, '/') + '.js';
                var script = fg.$new('script');
                script.type = 'text/javascript';
                script.src = path;
                script.onload = function (event) {
                    callBack(callBackParams);
                };
                script.onerror = function () { throw ('Failed to load ' + name + ' at ' + path); };
                fg.$('head')[0].appendChild(script);
            }
        }
    //Polyfills
    if (typeof Object.assign != 'function') {
        (function () {
            Object.assign = function (target) {
                'use strict';
                // We must check against these specific cases.
                if (target === undefined || target === null) {
                    throw new TypeError('Cannot convert undefined or null to object');
                }

                var output = Object(target);
                for (var index = 1; index < arguments.length; index++) {
                    var source = arguments[index];
                    if (source !== undefined && source !== null) {
                        for (var nextKey in source) {
                            if (source.hasOwnProperty(nextKey)) {
                                output[nextKey] = source[nextKey];
                            }
                        }
                    }
                }
                return output;
            };
        })();
    }
    if (!Array.prototype.find) {
        Object.defineProperty(Array.prototype, "find", {
            value: function (predicate) {
                'use strict';
                if (this == null) {
                    throw new TypeError('Array.prototype.find called on null or undefined');
                }
                if (typeof predicate !== 'function') {
                    throw new TypeError('predicate must be a function');
                }
                var list = Object(this);
                var length = list.length >>> 0;
                var thisArg = arguments[1];
                var value;

                for (var i = 0; i < length; i++) {
                    value = list[i];
                    if (predicate.call(thisArg, value, i, list)) {
                        return value;
                    }
                }
                return undefined;
            }
        });
    }
    // http://paulirish.com/2011/requestanimationframe-for-smart-animating/
    // http://my.opera.com/emoller/blog/2011/12/20/requestanimationframe-for-smart-er-animating
    // requestAnimationFrame polyfill by Erik Möller. fixes from Paul Irish and Tino Zijdel
    // MIT license
    (function () {
        var lastTime = 0;
        var vendors = ['ms', 'moz', 'webkit', 'o'];
        for (var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
            window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
            window.cancelAnimationFrame = window[vendors[x] + 'CancelAnimationFrame']
                || window[vendors[x] + 'CancelRequestAnimationFrame'];
        }

        if (!window.requestAnimationFrame)
            window.requestAnimationFrame = function (callback, element) {
                var currTime = new Date().getTime();
                var timeToCall = Math.max(0, 16 - (currTime - lastTime));
                var id = window.setTimeout(function () { callback(currTime + timeToCall); },
                    timeToCall);
                lastTime = currTime + timeToCall;
                return id;
            };

        if (!window.cancelAnimationFrame)
            window.cancelAnimationFrame = function (id) {
                clearTimeout(id);
            };
    } ());
    if (!Object.is) {
        Object.is = function (x, y) {
            // SameValue algorithm
            if (x === y) { // Steps 1-5, 7-10
                // Steps 6.b-6.e: +0 != -0
                return x !== 0 || 1 / x === 1 / y;
            } else {
                // Step 6.a: NaN == NaN
                return x !== x && y !== y;
            }
        };
    }
}
)(window);

fg.System =
    {
        context: null,
        defaultSide: 46,//24
        searchDepth: 16,//16
        canvas: null,
        platform: {},
        init: function () {
            this.canvas = fg.$("#main");
            this.context = this.canvas.getContext("2d");
            this.platform.iPhone = /iPhone/i.test(navigator.userAgent);
            this.platform.iPad = /iPad/i.test(navigator.userAgent);
            this.platform.android = /android/i.test(navigator.userAgent);
            this.platform.iOS = this.platform.iPhone || this.platform.iPad;
            this.platform.mobile = this.platform.iOS || this.platform.android;
            //if (this.platform.mobile) this.renderMobileInput();
        },
        renderMobileInput: function () {
            var auxCanvas = document.createElement('canvas');
            auxCanvas.width = 64;
            auxCanvas.height = 64;
            var auxCanvasCtx = auxCanvas.getContext('2d');

            var imgLeft = document.getElementById("btnMoveLeft");
            auxCanvasCtx.beginPath();
            auxCanvasCtx.fillStyle = "#aaaaaa";
            auxCanvasCtx.fillRect(0, 0, auxCanvas.width, auxCanvas.height);
            auxCanvasCtx.fillStyle = "#000000";
            auxCanvasCtx.moveTo(48, 16);
            auxCanvasCtx.lineTo(48, 48);
            auxCanvasCtx.lineTo(16, 32);
            auxCanvasCtx.fill();
            imgLeft.src = auxCanvas.toDataURL("image/png");

            var imgRight = document.getElementById("btnMoveRight");
            auxCanvasCtx.beginPath();
            auxCanvasCtx.fillStyle = "#aaaaaa";
            auxCanvasCtx.fillRect(0, 0, auxCanvas.width, auxCanvas.height);
            auxCanvasCtx.fillStyle = "#000000";
            auxCanvasCtx.moveTo(16, 16);
            auxCanvasCtx.lineTo(16, 48);
            auxCanvasCtx.lineTo(48, 32);
            auxCanvasCtx.fill();
            imgRight.src = auxCanvas.toDataURL("image/png");

            var imgJump = document.getElementById("btnJump");
            auxCanvasCtx.beginPath();
            auxCanvasCtx.fillStyle = "#aaaaaa";
            auxCanvasCtx.fillRect(0, 0, auxCanvas.width, auxCanvas.height);
            auxCanvasCtx.fillStyle = "#000000";
            auxCanvasCtx.arc(auxCanvas.width / 2, auxCanvas.height / 2, 16, 0, 2 * Math.PI);
            auxCanvasCtx.fill();
            imgJump.src = auxCanvas.toDataURL("image/png");
        }
    }


fg.Camera = {
    following: null,
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    dampX: 0,
    dampY: 0,
    dampRatio: 0.96,
    position: 0,
    init: function () {
        if (this.following) {
            fg.Game.screenOffsetX = this.following.x;
            fg.Game.screenOffsetY = this.following.y;
        } else {
            fg.Game.screenOffsetX = -6;
            fg.Game.screenOffsetY = -6;
        }
    },
    follow: function (obj) {
        this.following = obj;
    },
    moveTo: function (position) { },
    update: function () {
        if (this.following) {

            this.dampX = ((this.following.x - fg.Game.screenOffsetX) - ((fg.System.canvas.width / 2) - (this.following.width / 2))) - (Math.abs(this.following.speedX) >= this.following.maxSpeedX * 0.9 ? this.following.speedX * fg.Timer.deltaTime * 2 : 0);
            this.dampY = ((this.following.y - fg.Game.screenOffsetY) - ((fg.System.canvas.height / 2) - (this.following.height / 2)));

            if (Math.abs(this.dampX) > 0.1) this.dampX *= this.dampRatio;
            if (Math.abs(this.dampY) > 0.1) this.dampY *= this.dampRatio;

            var posX = Math.min(Math.max(((this.following.x) + (this.following.width / 2) - (fg.System.canvas.width / 2)) - this.dampX, 0), fg.Game.currentLevel.width - fg.System.canvas.width);
            var posY = Math.min(Math.max(((this.following.y - this.dampY) + (this.following.height / 2) - (fg.System.canvas.height / 2)), 0), fg.Game.currentLevel.height - fg.System.canvas.height);
            fg.Game.screenOffsetX = Math.round(posX);// this.following.speedX >= 0 ? Math.floor(posX) : Math.ceil(posX);
            fg.Game.screenOffsetY = Math.round(posY);//this.following.speedY <= 0 ? Math.ceil(posY) : Math.round(posY) ;
        }
        this.left = fg.Game.screenOffsetX;
        this.top = fg.Game.screenOffsetY;
        this.right = fg.Game.screenOffsetX + fg.System.canvas.width;
        this.bottom = fg.Game.screenOffsetY + fg.System.canvas.height;
    }
}

fg.protoLevel = {
    name: "",
    loaded: false,
    height: 0,
    width: 0,
    purgeLevel: false,
    randomEntities: true,
    bgImagePath: "resources/bg.png",
    bgImage: null,
    loadSettings: function () {
        if (window[this.name].levelSwiches)
            this.levelSwiches = window[this.name].levelSwiches;
        if (window[this.name].movingPlatforms)
            this.movingPlatforms = window[this.name].movingPlatforms;
        if (window[this.name].customProperties)
            this.customProperties = window[this.name].customProperties;
        if (window[this.name].warpDecks)
            this.warpDecks = window[this.name].warpDecks;
    },
    createEntities: function (init) {
        var rows = window[this.name].tiles.split('\n');
        for (var i = 0, row; row = rows[i]; i++) {
            if (!this.entities[i]) this.entities[i] = [];
            for (var k = 0, col; col = row[k]; k++) {
                if (this.randomEntities || !col.match(/[ #\d]/g)) {
                    var cx = 0, cy = 0, idx = 0;
                    if (this.randomEntities || ((!row[k + 1] || !row[k + 1].match(/[\d]/g)) && (!rows[i + 1] || !rows[i + 1][k].match(/[\d]/g)))) {
                        this.addEntity(row, !this.randomEntities ? col : this.getRandomEntity(), i, k, cx, cy, idx);
                    }
                    else {
                        if ((row[k + 1] && !!row[k + 1].match(/[\d]/g)) && (!rows[i + 1] || !rows[i + 1][k].match(/[\d]/g))) //multiply rows                            
                            this.addEntityColumn(row, col, i, k, cx, cy, idx);
                        else if ((rows[i + 1] && !!rows[i + 1][k].match(/[\d]/g)) && (!row[k + 1] || !row[k + 1].match(/[\d]/g))) //multiply columns                            
                            this.addEntityRow(rows, row, col, i, k, cx, cy, idx);
                        else
                            this.addEntityArea(rows, row, col, i, k, cx, cy, idx);
                    }
                }
            }
        }
        if(init) this.loadLevelCompleted()
    },
    getRandomEntity: function () {
        var color = Math.round(Math.random() * 6);
        switch (color) {
            case 0:
                return TYPE.GREENGEM;//4
            case 1:
                return TYPE.REDGEM;//9
            case 2:
                return TYPE.YELLOWGEM;//13
            case 3:
                return TYPE.PURPLEGEM;//9
            case 4:
                return TYPE.BLUEGEM;//11
            case 5:
                return TYPE.WHITEGEM;//13
            case 6:
                return TYPE.ORANGEGEM;//5
        }
    },
    getEntitySettings: function (type, id) {
        var settings = undefined;
        switch (type) {
            case TYPE.PLATFORM:
                settings = (this.movingPlatforms.find(function (e) { return e.id == id }) || {}).settings;
                break;
            case TYPE.SWITCH:
                settings = (this.levelSwiches.find(function (e) { return e.id == id }) || {}).settings;
                break;
            case TYPE.WARPDECK:
                settings = (this.warpDecks.find(function (e) { return e.id == id }) || {}).settings;
                break;
            default:
                settings = (this.customProperties.find(function (e) { return e.id == id }) || {}).settings;
                break;
        }
        return settings;
    },
    applyFeaturesToEntity: function (entity) {
        var features = undefined;
        switch (entity.type) {
            case TYPE.PLATFORM:
                features = (this.movingPlatforms.find(function (e) { return e.id == entity.id }) || {}).features;
                break;
            case TYPE.SWITCH:
                features = (this.levelSwiches.find(function (e) { return e.id == entity.id }) || {}).features;
                break;
            default:
                break;
        }
        if (features) Object.assign(entity, features);
        return entity;
    },
    load: function () {
        fg.loadScript('levels/', this.name,
            function (self) { self.loadSettings(); self.createEntities(true); }, this);
    },
    loadLevelCompleted: function () {
        if(this.purgeLevel) window[this.name] = null;
        this.loaded = true;
        this.height = this.entities.length * fg.System.defaultSide;
        this.width = this.entities[0].length * fg.System.defaultSide;
        while (this.marioBuffer.length > 0) {
            this.marioBuffer[this.marioBuffer.length - 1].setSubTiles();
            if (this.marioBuffer[this.marioBuffer.length - 1].tileSet == "00010203" || this.marioBuffer[this.marioBuffer.length - 1].tileSet == "30313233") {
                if (this.marioBuffer[this.marioBuffer.length - 1].tileSet == "00010203") {
                    fg.Render.marioCache[this.marioBuffer[this.marioBuffer.length - 1].tileSet] = 0;
                    this.marioBuffer[this.marioBuffer.length - 1].cacheX = fg.Render.marioCache[this.marioBuffer[this.marioBuffer.length - 1].tileSet];
                } else {
                    fg.Render.marioCache[this.marioBuffer[this.marioBuffer.length - 1].tileSet] = fg.System.defaultSide * 3;
                    this.marioBuffer[this.marioBuffer.length - 1].cacheX = fg.System.defaultSide * 3;
                }
            } else {
                if (!fg.Render.marioCache[this.marioBuffer[this.marioBuffer.length - 1].tileSet]) fg.Render.marioCache[this.marioBuffer[this.marioBuffer.length - 1].tileSet] = (5 + Object.keys(fg.Render.marioCache).length) * fg.System.defaultSide;
                this.marioBuffer[this.marioBuffer.length - 1].cacheX = fg.Render.marioCache[this.marioBuffer[this.marioBuffer.length - 1].tileSet];
            }
            this.marioBuffer.pop();
        }
    },
    init: function (name) {
        this.name = name;
        this.load();
        if (this.bgImagePath) {
            var bg = new Image();
            bg.src = 'resources/bg.png';
            this.bgImage = bg;
        }
    },
    addEntity: function (row, col, i, k, cx, cy, idx) {
        this.entities[i][k] = fg.Entity(i + "-" + k, col, fg.System.defaultSide * k, fg.System.defaultSide * i, 0, 0, 0);
        if (!this.entities[i][k]) return;
        if (this.entities[i][k].setYs) this.entities[i][k].setYs(null, null);
        if (this.entities[i][k].type == TYPE.MARIO) this.marioBuffer.push(this.entities[i][k]);
    },
    addEntityColumn: function (row, col, i, k, cx, cy, idx) {//row-column
        for (var index = 0; index <= row[k + 1]; index++) {
            cx = fg.System.defaultSide;
            if ("╝╚╗╔".indexOf(col) < 0) {
                if (index == 0) idx = 1;
                else if (index == row[k + 1]) cx *= (idx = 3);
                else cx *= (idx = 2);
            } else
                cx = ((parseInt(row[k + 1]) * (parseInt(row[k + 1]) + 1)) / 2 * fg.System.defaultSide) + (index * fg.System.defaultSide);
            this.entities[i][k + index] = fg.Entity(i + "-" + (k + index), col, fg.System.defaultSide * (k + index), fg.System.defaultSide * i, cx, cy, index);
            if (this.entities[i][k + index].setYs)
                this.entities[i][k + index].setYs(row[k + 1], null);

            if (index > 0)
                this.entities[i][k].segments.push({ l: i, c: k + index });
        }
    },
    addEntityRow: function (rows, row, col, i, k, cx, cy, idx) {
        for (var index = 0; index <= rows[i + 1][k]; index++) {
            if (!this.entities[i + index])
                this.entities[i + index] = [];
            cy = fg.System.defaultSide;
            if ("╝╚╗╔".indexOf(col) < 0) {
                if (index == 0) idx = 4;
                else if (index == rows[i + 1][k]) cy *= (idx = (12 / 4));
                else cy *= (idx = (8 / 4));
            } else
                cy = ((parseInt(rows[i + 1][k]) * (parseInt(rows[i + 1][k]) + 1)) / 2 * fg.System.defaultSide) + (index * fg.System.defaultSide);
            this.entities[i + index][k] = fg.Entity((i + index) + "-" + k, col, fg.System.defaultSide * k, fg.System.defaultSide * (i + index), cx, cy, index);
            if (this.entities[i + index][k].setYs)
                this.entities[i + index][k].setYs(null, rows[i + 1][k]);
        }
    },
    addEntityArea: function (rows, row, col, i, k, cx, cy, idx) {
        var computedPos = null;
        for (var kIndex = 0; kIndex <= row[k + 1]; kIndex++) {
            for (var iIndex = 0; iIndex <= rows[i + 1][k]; iIndex++) {
                if (!this.entities[i + iIndex]) this.entities[i + iIndex] = [];
                if (iIndex == 0) {
                    if (kIndex == 0) computedPos = this.computeEntityAreaPos(5, 1, 1);
                    else if (kIndex == row[k + 1]) computedPos = this.computeEntityAreaPos(7, 3, 1);
                    else computedPos = this.computeEntityAreaPos(6, 2, 1);
                } else if (iIndex == rows[i + 1][k]) {
                    if (kIndex == 0) computedPos = this.computeEntityAreaPos(13, 1, 3);
                    else if (kIndex == row[k + 1]) computedPos = this.computeEntityAreaPos(15, 3, 3);
                    else computedPos = this.computeEntityAreaPos(14, 2, 3);
                } else {
                    if (kIndex == 0) computedPos = this.computeEntityAreaPos(9, 1, 2);
                    else if (kIndex == row[k + 1]) computedPos = this.computeEntityAreaPos(11, 3, 2);
                    else computedPos = this.computeEntityAreaPos(10, 2, 2);
                }
                this.entities[i + iIndex][k + kIndex] = fg.Entity((i + iIndex) + "-" + (k + kIndex), col, fg.System.defaultSide * (k + kIndex), fg.System.defaultSide * (i + iIndex), computedPos.cx, computedPos.cy, (iIndex * (parseInt(row[k + 1]) + 1)) + kIndex);
            }
        }
    },
    computeEntityAreaPos: function (idx, xMultiplyer, yMultiplyer) {
        var cx = fg.System.defaultSide * xMultiplyer;
        var cy = fg.System.defaultSide * yMultiplyer;
        return { idx: idx, cx: cx, cy: cy };
    }
}

fg.protoEntity = {
    index: 0,
    width: fg.System.defaultSide,
    height: fg.System.defaultSide,
    cacheWidth: fg.System.defaultSide,
    cacheHeight: fg.System.defaultSide,
    init: function (id, type, x, y, cx, cy, index) {
        this.type = type;
        this.id = id;
        this.color = "black";
        this.x = x;
        this.y = y;
        this.cacheX = cx;
        this.cacheY = cy;
        this.index = index;
        this.collidable = this.type != TYPE.TUNNEL && this.type != TYPE.DARKNESS && this.type != TYPE.SAVE;
        this.segments = [];
        this.backGround = true;
        return this;
    },
    draw: function (foreGround) {
        if (!fg.Render.cached[this.type]) {
            var c = fg.Render.preRenderCanvas();
            var ctx = c.getContext("2d");
            c = this.drawTile(c, ctx);
            if (c)
                fg.Render.draw(fg.Render.cache(this.type, c), this.cacheX, this.cacheY, this.cacheWidth, this.cacheHeight, this.x, this.y);
        }
        else {
            if (!foreGround && !this.backGround || foreGround && !this.foreGround || this.vanished) return;
            fg.Render.draw(fg.Render.cached[this.type], this.cacheX, this.cacheY, this.cacheWidth, this.cacheHeight, this.x, this.y);
        }
        if (fg.Game.showIds) {
            fg.System.context.font = "7px Arial";
            fg.System.context.fillStyle = "white";
            fg.System.context.fillText(this.movingSpeed, this.x - fg.Game.screenOffsetX + 24, this.y + 24 - fg.Game.screenOffsetY);
            fg.System.context.fillText(this.id.split('-')[0], this.x - fg.Game.screenOffsetX + 24, this.y + 31 - fg.Game.screenOffsetY);
            fg.System.context.fillText(this.id.split('-')[1], this.x - fg.Game.screenOffsetX + 24, this.y + 38 - fg.Game.screenOffsetY);
        }
    },
    drawTile: function (c, ctx) {
        c.width = this.width;
        c.height = this.height;
        ctx.fillStyle = 'rgba(0,0,0,.75)';
        ctx.fillRect(0, 0, this.height, this.width);
        return c;
    },
    update: function () { }
}

fg.Entity = function (id, type, x, y, cx, cy, index) {
    switch (type) {
        case TYPE.GREENGEM:
        case TYPE.REDGEM:
        case TYPE.YELLOWGEM:
        case TYPE.PURPLEGEM:
        case TYPE.BLUEGEM:
        case TYPE.WHITEGEM:
        case TYPE.ORANGEGEM:
            return fg.Gem(id, type, x, y, cx, cy, index);
        default:
            return Object.create(fg.protoEntity).init(id, type, x, y, cx, cy, index);
    }
}

fg.Gem = function (id, type, x, y, cx, cy, index) {
    return Object.assign(
        fg.Game.currentLevel.applyFeaturesToEntity(
            Object.create(fg.protoEntity).init(id, type, x, y, cx, cy, index)), fg.Interactive, {
            slope: false,
            backGround: true,
            foreGround: false,
            selected: false,
            movingSpeed: 0.24,//0.06
            cacheWidth: fg.System.defaultSide,
            cacheHeight: fg.System.defaultSide,
            moveTo: [],
            drawTile: function (c, ctx) {
                //Loading of the home test image
                var gem = new Image();

                //drawing of the test image
                gem.onload = function () {
                    //draw background image
                    ctx.drawImage(gem, 0, 0);
                };

                gem.src = 'resources/' + this.getColor() +'gem.png';   
                return c;
            },
            getRow: function(){             
                if(this.movingSpeed > 0)   
                    return Math.floor((this.y) / fg.System.defaultSide);
                else
                    return Math.ceil((this.y) / fg.System.defaultSide);
            },
            getCol: function(){
                if(this.movingSpeed > 0)   
                    return Math.floor((this.x) / fg.System.defaultSide);
                else
                    return Math.ceil((this.x) / fg.System.defaultSide);
            },
            getColor: function () {
                switch (this.type) {
                    case TYPE.GREENGEM:
                        return "green";
                    case TYPE.REDGEM:
                        return "red";
                    case TYPE.YELLOWGEM:
                        return "yellow";
                    case TYPE.PURPLEGEM:
                        return "purple";
                    case TYPE.BLUEGEM:
                        return "blue";
                    case TYPE.WHITEGEM:
                        return "white";
                    case TYPE.ORANGEGEM:
                        return "orange";
                    default:
                        return "black";
                }
            },
            draw: function (foreGround) {
                if (this.selected)
                    this.cacheX = fg.System.defaultSide;
                else
                    this.cacheX = 0;
                fg.protoEntity.draw.call(this, foreGround);
            },
            update: function () {
                if (this.moveTo.length == 0) return;
                if (this.moveTo[0] != this.getRow()) {
                    this.movingSpeed = this.moveTo[0] > this.getRow() ? Math.abs(this.movingSpeed) : -Math.abs(this.movingSpeed);
                    this.y += this.movingSpeed * fg.Timer.deltaTime;
                } else {
                    this.movingSpeed = this.moveTo[1] > this.getCol() ? Math.abs(this.movingSpeed) : -Math.abs(this.movingSpeed);
                    this.x += this.movingSpeed * fg.Timer.deltaTime;
                }
                if (this.moveTo[0] == this.getRow() && this.moveTo[1] == this.getCol()) {
                    this.x = Math.round(this.x);
                    this.y = Math.round(this.y);                    
                    if (!Object.is(fg.Game.currentLevel.entities[this.moveTo[0]][this.moveTo[1]], this)) {
                        var lastRow = parseInt(this.id.split('-')[0]), lastCol = parseInt(this.id.split('-')[1]);
                        var obj = fg.Game.currentLevel.entities[this.moveTo[0]][this.moveTo[1]];
                        obj.draw();
                        obj.id = lastRow + '-' + lastCol;
                        fg.Game.currentLevel.entities[lastRow][lastCol] = obj;
                        this.id = this.moveTo[0] + '-' + this.moveTo[1];
                        fg.Game.currentLevel.entities[this.moveTo[0]][this.moveTo[1]] = this;
                    }
                    this.movingSpeed = Math.abs(this.movingSpeed);
                    return this.moveTo = [];
                }
            }
        }, fg.Game.currentLevel.getEntitySettings(type, id));
}

fg.Interactive = {
    interactive: true,
    interacting: false,
    init: function () { },
    interact: function (obj) {
        this.interactor = obj;
        this.interacting = true;
    },
    update: function () {
        this.interacting = false;
        this.interactor = undefined;
    }
}

fg.Mario = function (id, type, x, y, cx, cy, index) {
    return Object.assign(
        Object.create(fg.protoEntity).init(id, type, x, y, cx, cy, index), {
            cacheX: 0,//Math.round(Math.random() * 4) * fg.System.defaultSide,//cacheX: fg.System.defaultSide * 0,
            edges: undefined,
            tileSet: "",
            cachePosition: [{ x: 12, y: 0 }, { x: 12, y: 12 }, { x: 0, y: 12 }, { x: 0, y: 0 }],
            drawTile: function (c, ctx) {
                c.width = this.width * (5 + Object.keys(fg.Render.marioCache).length);
                c.height = this.height;
                var colorA = "rgb(201,152,86)";
                ctx.fillStyle = colorA;
                ctx.fillRect(0, 0, 72, 24);
                ctx.fillRect(79, 7, 10, 10);
                ctx.fillRect(96, 0, 24, 24);
                //draw speckles
                this.speckles(ctx);
                //draw sides tiles
                this.sides(ctx);
                //draw inner corners
                this.innerCorners(ctx);
                //draw outer corners
                this.outerCorners(ctx);
                //mirror sides
                ctx.save();
                ctx.translate(c.width - (fg.System.defaultSide * ((5 + Object.keys(fg.Render.marioCache).length) - 6)), 0);
                ctx.scale(-1, 1);
                this.sides(ctx);
                ctx.restore();

                for (var i = 0, key; key = Object.keys(fg.Render.marioCache)[i]; i++) {
                    //ctx.drawImage(this.renderSubTile(c, key), fg.Render.marioCache[key], 0);
                    this.renderSubTile(ctx, key);
                }

                return c;
            },
            update: function () {
                if (this.tileSet == "") this.setSubTiles(true);
            },/*
            draw: function (foreGround) {
                if (this.tileSet == "") return;
                fg.protoEntity.draw.call(this, foreGround);
            },*/
            setEdges: function () {
                this.edges = [];
                var i = parseInt(this.id.split('-')[0]), k = parseInt(this.id.split('-')[1]);
                var objs = fg.Game.currentLevel.entities;
                this.edges.push(objs[i - 1] && objs[i - 1][k + 0] && objs[i - 1][k + 0].type == TYPE.MARIO && !objs[i - 1][k + 0].vanished ? 1 : 0);
                this.edges.push(objs[i - 1] && objs[i - 1][k + 1] && objs[i - 1][k + 1].type == TYPE.MARIO && !objs[i - 1][k + 1].vanished ? 1 : 0);
                this.edges.push(objs[i - 0][k + 1] && objs[i - 0][k + 1].type == TYPE.MARIO && !objs[i - 0][k + 1].vanished ? 1 : 0);
                this.edges.push(objs[i + 1] && objs[i + 1][k + 1] && objs[i + 1][k + 1].type == TYPE.MARIO && !objs[i + 1][k + 1].vanished ? 1 : 0);
                this.edges.push(objs[i + 1] && objs[i + 1][k + 0] && objs[i + 1][k + 0].type == TYPE.MARIO && !objs[i + 1][k + 0].vanished ? 1 : 0);
                this.edges.push(objs[i + 1] && objs[i + 1][k - 1] && objs[i + 1][k - 1].type == TYPE.MARIO && !objs[i + 1][k - 1].vanished ? 1 : 0);
                this.edges.push(objs[i - 0][k - 1] && objs[i - 0][k - 1].type == TYPE.MARIO && !objs[i - 0][k - 1].vanished ? 1 : 0);
                this.edges.push(objs[i - 1] && objs[i - 1][k - 1] && objs[i - 1][k - 1].type == TYPE.MARIO && !objs[i - 1][k - 1].vanished ? 1 : 0);
            },
            getSubTiles: function (tileA, tileB, tileC, index) {
                if (tileA == 1 && tileB == 1 && tileC == 1)
                    return "0" + index;
                else if (tileA == 1 && tileB == 0 && tileC == 1)
                    return "2" + (2 + index) % 4;
                else if (tileA == 1 && tileC == 0)
                    return "4" + index;
                else if (tileA == 0 && tileC == 1)
                    return "1" + index;
                else
                    return "3" + index;
            },
            setSubTiles: function (setCacheX) {
                this.setEdges();
                this.tileSet = "";
                for (var i = 0; i <= 6; i += 2)
                    this.tileSet += this.getSubTiles(this.edges[i], this.edges[i + 1], (this.edges[i + 2] === undefined ? this.edges[0] : this.edges[i + 2]), i / 2);
                if (setCacheX)
                    this.cacheX = fg.Render.marioCache[this.tileSet];
            },
            renderSubTile: function (ctx, key) {
                // fg.Render.offScreenRender().width = fg.System.defaultSide;
                // for (var i = 0; i <= 6; i += 2) {
                //     var cacheX = (parseInt(tileSet[i]) * fg.System.defaultSide) + parseInt(this.cachePosition[tileSet[i + 1]].x);
                //     var cacheY = parseInt(this.cachePosition[tileSet[i + 1]].y);
                //     var cacheWidth = fg.System.defaultSide / 2;
                //     var cacheHeight = fg.System.defaultSide / 2;
                //     fg.Render.drawOffScreen(c, cacheX, cacheY, cacheWidth, cacheHeight, this.cachePosition[i / 2].x, this.cachePosition[i / 2].y);
                // }
                // return fg.Render.offScreenRender();
                var posX = fg.Render.marioCache[key];
                for (var i = 0; i <= 6; i += 2) {
                    var cacheX = (parseInt(key[i]) * fg.System.defaultSide) + parseInt(this.cachePosition[key[i + 1]].x);
                    var cacheY = parseInt(this.cachePosition[key[i + 1]].y);
                    var cacheWidth = fg.System.defaultSide / 2;
                    var cacheHeight = fg.System.defaultSide / 2;
                    ctx.drawImage(ctx.canvas, cacheX, cacheY, cacheWidth, cacheHeight, posX + this.cachePosition[i / 2].x, this.cachePosition[i / 2].y, 12, 12);
                }
            },
            drawColor: function (ctx, t_x, t_y, t_w, t_h, color) {
                ctx.fillStyle = color;
                for (var index = 0; index < t_x.length; index++)
                    ctx.fillRect(t_x[index], t_y[index], t_w[index], t_h[index]);
            },
            sides: function (ctx) {
                var colorOne = "rgb(120,105,24)";//DarkBrown
                var t_x = [24, 29, 30, 31, 36, 40, 41, 41],
                    t_y = [17, 0, 7, 16, 6, 12, 5, 17],
                    t_w = [7, 2, 2, 5, 5, 2, 7, 2],
                    t_h = [2, 7, 5, 2, 2, 5, 2, 7];
                this.drawColor(ctx, t_x, t_y, t_w, t_h, colorOne);
                var colorTwo = "rgb(0,201,1)";//LightGreen
                t_x = [24, 25, 36, 43];
                t_y = [19, 0, 1, 12];
                t_w = [12, 4, 12, 4];
                t_h = [4, 12, 4, 12];
                this.drawColor(ctx, t_x, t_y, t_w, t_h, colorTwo);
                var colorThree = "rgb(0,120,72)";//DarkGreen
                t_x = [24, 27, 27, 28, 28, 28, 29, 30, 32, 35, 36, 37, 40, 42, 42, 43, 43, 43, 44, 45];
                t_y = [19, 3, 20, 0, 6, 11, 8, 19, 18, 19, 4, 5, 4, 3, 13, 12, 16, 21, 18, 4];
                t_w = [3, 1, 3, 1, 1, 1, 1, 2, 3, 1, 1, 3, 2, 3, 1, 1, 1, 1, 1, 3];
                t_h = [1, 3, 1, 3, 2, 1, 3, 1, 1, 1, 1, 1, 1, 1, 3, 1, 2, 3, 3, 1];
                this.drawColor(ctx, t_x, t_y, t_w, t_h, colorThree);
                var colorFour = "rgb(0,0,0)";//Black
                t_x = [24, 24, 24, 27, 28, 29, 29, 29, 30, 30, 32, 35, 36, 36, 37, 40, 41, 42, 42, 42, 42, 43, 45, 47];
                t_y = [0, 18, 23, 19, 3, 0, 6, 11, 8, 18, 17, 18, 0, 5, 6, 5, 13, 4, 12, 16, 21, 18, 5, 12];
                t_w = [1, 3, 12, 3, 1, 1, 1, 1, 1, 2, 3, 1, 12, 1, 3, 2, 1, 3, 1, 1, 1, 1, 3, 1];
                t_h = [12, 1, 1, 1, 3, 3, 2, 1, 3, 1, 1, 1, 1, 1, 1, 1, 3, 1, 1, 2, 3, 3, 1, 12];
                this.drawColor(ctx, t_x, t_y, t_w, t_h, colorFour);
            },
            innerCorners: function (ctx) {
                var colorOne = "rgb(120,105,24)";//DarkBrown
                var t_x = [54, 55, 53, 58, 59, 66,],
                    t_y = [7, 6, 10, 18, 5, 11,],
                    t_w = [12, 10, 1, 3, 3, 1,],
                    t_h = [10, 12, 3, 1, 1, 3,];
                this.drawColor(ctx, t_x, t_y, t_w, t_h, colorOne);
                var colorTwo = "rgb(0,201,1)";//LightGreen
                t_x = [56];
                t_y = [8];
                t_w = [8];
                t_h = [8];
                this.drawColor(ctx, t_x, t_y, t_w, t_h, colorTwo);
                var colorThree = "rgb(0,120,72)";//DarkGreen
                t_x = [55, 56, 56, 57, 57, 59, 59, 61, 61, 63, 63, 64];
                t_y = [11, 8, 13, 8, 15, 7, 16, 8, 15, 8, 13, 11];
                t_w = [1, 1, 1, 2, 2, 2, 2, 2, 2, 1, 1, 1];
                t_h = [2, 3, 3, 1, 1, 1, 1, 1, 1, 3, 3, 2];
                this.drawColor(ctx, t_x, t_y, t_w, t_h, colorThree);
                var colorFour = "rgb(0,0,0)";//Black
                t_x = [54, 55, 55, 56, 56, 59, 59, 61, 61, 64, 64, 65];
                t_y = [11, 8, 13, 7, 16, 6, 17, 7, 16, 8, 13, 11];
                t_w = [1, 1, 1, 3, 3, 2, 2, 3, 3, 1, 1, 1];
                t_h = [2, 3, 3, 1, 1, 1, 1, 1, 1, 3, 3, 2];
                this.drawColor(ctx, t_x, t_y, t_w, t_h, colorFour);
            },
            outerCorners: function (ctx) {
                var colorOne = "rgb(120,105,24)";//DarkBrown
                var t_x = [77, 77, 79, 83, 88, 89, 85, 79, 79, 84, 88, 82],
                    t_y = [5, 11, 16, 17, 13, 7, 5, 5, 12, 16, 10, 7],
                    t_w = [3, 2, 4, 6, 3, 2, 4, 6, 1, 2, 1, 2],
                    t_h = [6, 6, 3, 2, 4, 6, 3, 2, 2, 1, 2, 1];
                this.drawColor(ctx, t_x, t_y, t_w, t_h, colorOne);
                var colorTwo = "rgb(0,0,0)";//Black
                t_x = [72, 73, 74, 74, 76, 76, 89, 89, 91, 91, 77, 77, 80, 82, 84, 86, 90, 90];
                t_y = [4, 2, 1, 17, 0, 19, 1, 17, 2, 4, 8, 12, 18, 5, 18, 5, 10, 14];
                t_w = [5, 4, 5, 5, 16, 16, 5, 5, 4, 5, 1, 1, 2, 2, 2, 2, 1, 1];
                t_h = [16, 20, 6, 6, 5, 5, 6, 6, 20, 16, 2, 2, 1, 1, 1, 1, 2, 2];
                this.drawColor(ctx, t_x, t_y, t_w, t_h, colorTwo);
                var colorThree = "rgb(0,120,72)";//DarkGreen
                t_x = [76, 75, 76, 78, 78, 90, 90, 92, 76, 76, 80, 82, 84, 86, 91, 91];
                t_y = [4, 6, 18, 20, 3, 4, 18, 6, 8, 12, 19, 4, 19, 4, 10, 14];
                t_w = [2, 1, 2, 12, 12, 2, 2, 1, 1, 1, 2, 2, 2, 2, 1, 1];
                t_h = [2, 12, 2, 1, 1, 2, 2, 12, 2, 2, 1, 1, 1, 1, 2, 2];
                this.drawColor(ctx, t_x, t_y, t_w, t_h, colorThree);
                var colorFour = "rgb(0,201,1)";//LightGreen
                t_x = [74, 73, 74, 76, 91, 93, 91, 76, 75, 75, 75, 75, 77, 80, 84, 90, 92, 92, 92, 92, 90, 86, 82, 77];
                t_y = [2, 4, 19, 21, 19, 4, 2, 1, 5, 8, 12, 18, 20, 20, 20, 20, 18, 14, 10, 5, 3, 3, 3, 3];
                t_w = [3, 2, 3, 16, 3, 2, 3, 16, 1, 1, 1, 1, 1, 2, 2, 1, 1, 1, 1, 1, 1, 2, 2, 1];
                t_h = [3, 16, 3, 2, 3, 16, 3, 2, 1, 2, 2, 1, 1, 1, 1, 1, 1, 2, 2, 1, 1, 1, 1, 1];
                this.drawColor(ctx, t_x, t_y, t_w, t_h, colorFour);
            },
            speckles: function (ctx) {
                var colorB = "rgba(224,190,80,1)";
                var t_x = [3, 6, 8, 8, 13, 15, 15, 16, 18, 20],
                    t_y = [8, 11, 5, 17, 14, 2, 20, 8, 14, 4],
                    t_w = [1, 2, 2, 1, 1, 1, 1, 2, 2, 1],
                    t_h = [3, 3, 3, 3, 2, 3, 2, 3, 3, 2];
                ctx.fillStyle = colorB;
                for (var t = 0; t < 5; t++)
                    for (var index = 0; index < 10; index++)
                        ctx.fillRect(t_x[index] + (t * this.width), t_y[index], t_w[index], t_h[index]);
            }
        });
}

fg.Level = function (name) {
    var level = Object.create(fg.protoLevel);
    level.levelSwiches = [];
    level.movingPlatforms = [];
    level.customProperties = [];
    level.marioBuffer = [];
    level.entities = [];
    level.init(name);
    return level;
}

fg.Game =
    {
        levels: [],
        currentLevel: null,
        showIds: false,
        screenOffsetX: 0,//5818
        screenOffsetY: 0,//818,5200,72
        increaseX: 0,//0.06666=1
        increaseY: 0,
        currentEntities: [],
        foreGroundEntities: [],
        gravity: 0.012,//0.016,0.012
        actors: [],
        secrets: [],
        loaded: 0,
        paused: false,
        lastPauseState: undefined,
        started: false,
        saving: false,
        fontAnimation: { fadeIn: false, blinkText: 0 },
        totalSecrets: 0,
        debug: false,
        updateWholeScreen: true,
        selectedGem: null,
        loadLevel: function (name) {
            this.levels.push(fg.Level(name));
            return this.levels[this.levels.length - 1];
        },
        screenShot: undefined,
        loadedSaveStations: [],
        mainFontSmall: null,
        mainFontNormal: null,
        start: function () {
            this.mainFontSmall = fg.Font('resources/OldskoolOutline.png');
            this.mainFontNormal = fg.Font('resources/font.png');
            fg.System.init();
            fg.UI.init();
            //fg.Camera.follow(fg.Game.actors[0]);
            fg.Camera.init();
            this.currentLevel = this.loadLevel("levelOne");
            fg.Input.initKeyboard();
            fg.Input.initTouch();
            fg.Input.bind(fg.Input.KEY.UP_ARROW, "up");
            fg.Input.bind(fg.Input.KEY.LEFT_ARROW, "left");
            fg.Input.bind(fg.Input.KEY.RIGHT_ARROW, "right");
            fg.Input.bind(fg.Input.KEY.DOWN_ARROW, "down");
            fg.Input.bind(fg.Input.KEY.A, "left");
            fg.Input.bind(fg.Input.KEY.D, "right");
            fg.Input.bind(fg.Input.KEY.ESC, "esc");
            fg.Input.bind(fg.Input.KEY.ENTER, "enter");
            // if (fg.System.platform.mobile) {
            //     fg.Input.bindTouch(fg.$("#btnMoveLeft"), "left");
            //     fg.Input.bindTouch(fg.$("#btnMoveRight"), "right");
            //     //fg.Input.bindTouch(fg.$("#main"), "esc");
            // }
            this.run();
        },
        drawMap: function () {
            var scale = 4;
            fg.Render.offScreenRender().width = fg.System.searchDepth * scale * 2;
            fg.Render.offScreenRender().height = Math.round(fg.System.searchDepth * (fg.System.canvas.height / fg.System.canvas.width)) * scale * 2;
            var ctx = fg.Render.offScreenRender().getContext('2d');

            for (var i = 0, entity; entity = this.currentEntities[i]; i++) {
                var x = parseInt(entity.id.split('-')[1]) - Math.round(fg.Game.screenOffsetX / fg.System.defaultSide);
                var y = parseInt(entity.id.split('-')[0]) - Math.round(fg.Game.screenOffsetY / fg.System.defaultSide);
                if (entity.type == TYPE.WALL || entity.type == TYPE.PLATFORM)
                    ctx.fillStyle = "black";
                else
                    ctx.fillStyle = "red"
                ctx.fillRect((10 * scale) + (x * scale), (5 * scale) + (y * scale), scale, entity.type == TYPE.PLATFORM ? (scale / 2) : scale);
            }
        },
        run: function () {
            if (fg.Game.currentLevel.loaded) {
                if (!fg.Game.started) {
                    if (Object.keys(fg.Input.actions).length > 0) {
                        fg.Input.actions = {};
                        fg.Game.started = true;
                    }
                    fg.Game.showTitle();
                    fg.Timer.update();
                } else fg.Game.update();
            } else fg.Game.drawLoading(10, fg.System.canvas.height - 20, fg.System.canvas.width - 20, 20);

            requestAnimationFrame(fg.Game.run);
        },
        clearScreen: function () {
            fg.System.context.fillStyle = fg.System.platform.mobile ? "deepSkyBlue" : "rgb(55,55,72)";
            if(!fg.Game.currentLevel.bgImage)
                fg.System.context.fillRect(0, 0, fg.System.canvas.width, fg.System.canvas.height);
            else
                fg.Render.drawImage(fg.Game.currentLevel.bgImage, 0, 0);
        },
        drawLoading: function (x, y, width, height, pos) {
            if (pos) {
                fg.System.context.fillStyle = "black";
                fg.System.context.fillRect(x, y, width, height);
                fg.System.context.fillStyle = "white";
                fg.System.context.fillRect(x + 1, y + 1, (pos * width) - 2, height - 2);
            } else {
                fg.System.context.font = "15px Arial";
                fg.System.context.fillStyle = "black";
                fg.System.context.fillText("Loading...", x, y);
            }
        },
        saveState: function () {
            var curSaveState = localStorage.fallingSaveState ? JSON.parse(localStorage.fallingSaveState) : null;
            var saveStations = curSaveState && curSaveState.saveStations ? curSaveState.saveStations : [];
            var secrets = this.secrets ? this.secrets : [];

            var saveStation = saveStations.find(function (e) { return e.id == fg.Game.curSaveStation.id });
            fg.Game.curSaveStation.drawScreen();
            if (!saveStation)
                saveStations.push({ id: fg.Game.curSaveStation.id, screen: fg.Game.curSaveStation.screen, date: Date.now() });
            else
                saveStations[saveStations.indexOf(saveStation)] = { id: fg.Game.curSaveStation.id, screen: fg.Game.curSaveStation.screen, date: Date.now() };

            var saveState = {
                startPosition: { x: fg.Game.curSaveStation.id.split('-')[0], y: fg.Game.curSaveStation.id.split('-')[1] },
                powerUps: {
                    glove: fg.Game.actors[0].glove,
                    light: fg.Game.actors[0].light,
                    wallJump: fg.Game.actors[0].wallJump,
                    superJump: fg.Game.actors[0].superJump,
                    velocity: fg.Game.actors[0].velocity
                },
                saveStations: saveStations,
                secrets: secrets
            };
            this.loadedSaveStations = saveState.saveStations;
            localStorage.fallingSaveState = JSON.stringify(saveState);
            fg.Game.curSaveStation.screen = fg.System.canvas.toDataURL();
        },
        update: function () {
            if ((fg.Input.actions["esc"] && fg.Input.actions["esc"] != this.lastPauseState) && !this.saving) this.paused = !this.paused;
            this.lastPauseState = fg.Input.actions["esc"];
            if (!this.paused) {
                if(this.updateWholeScreen) this.clearScreen();
                if (this.screenShot) this.screenShot = null;
                this.foreGroundEntities = [];
                this.searchArea(((fg.System.canvas.width / 2) + fg.Game.screenOffsetX),
                    ((fg.System.canvas.height / 2) + fg.Game.screenOffsetY),
                    fg.System.searchDepth, Math.round(fg.System.searchDepth * (fg.System.canvas.height / fg.System.canvas.width)),
                    this.updateEntity);
                for (var index = 0, entity; entity = this.actors[index]; index++)
                    this.updateEntity(entity);
                for (var index = this.foreGroundEntities.length - 1, entity; entity = this.foreGroundEntities[index]; index--) {
                    entity.update(true);
                    entity.draw(true);
                }
                this.mainFontSmall.draw('Elle descend en se tenant aux racines.', 0, 390);
                fg.Camera.update();
                this.saveScreenAnimation = 0;
            } else { 
                if (!this.screenShot) {
                    var img = new Image();
                    img.src = fg.System.canvas.toDataURL();
                    this.screenShot = img;
                }
                fg.Render.drawImage(this.screenShot, 0, 0);
                if (!this.saving) {
                    fg.System.context.fillStyle = "black";
                    this.drawFont("PAUSED", "", (fg.System.canvas.width / 2) - 12, 180);
                } else {
                    fg.UI.update();
                    fg.UI.draw();
                }
            }
            fg.Timer.update();
        },
        touchStart: function(touches){            
            var row = Math.floor((touches[0].pageY+fg.Game.screenOffsetY)/fg.System.defaultSide);
            var col = Math.floor((touches[0].pageX+fg.Game.screenOffsetY)/fg.System.defaultSide);
            if(row >= fg.Game.currentLevel.entities.length || col >= fg.Game.currentLevel.entities[0].length) return;
            var entity = fg.Game.currentLevel.entities[row][col];            
            this.selectedGem = entity;

        },
        touchEnd: function(touches){            
            var row = Math.floor((touches[0].pageY+fg.Game.screenOffsetY)/fg.System.defaultSide);
            var col = Math.floor((touches[0].pageX+fg.Game.screenOffsetY)/fg.System.defaultSide);
            if(row < 0 || col < 0 || row >= fg.Game.currentLevel.entities.length 
            || col >= fg.Game.currentLevel.entities[0].length || (this.selectedGem.getRow() == row && this.selectedGem.getCol() == col)) return;
            if(row != this.selectedGem.getRow() && col != this.selectedGem.getCol()){
                var diffRow = Math.abs(row - this.selectedGem.getRow());
                var diffCol = Math.abs(col - this.selectedGem.getCol());
                if(diffRow > diffCol) {
                    row = this.selectedGem.getRow() + (row > this.selectedGem.getRow() ? 1 : -1);
                    col = this.selectedGem.getCol();
                } else {
                    col = this.selectedGem.getCol() + (col > this.selectedGem.getCol() ? 1 : -1);
                    row = this.selectedGem.getRow();
                }
            } else if(row != this.selectedGem.getRow()){
                row = this.selectedGem.getRow() + (row > this.selectedGem.getRow() ? 1 : -1);
            } else {
                col = this.selectedGem.getCol() + (col > this.selectedGem.getCol() ? 1 : -1);
            }
            var entity = fg.Game.currentLevel.entities[row][col];            
            // entity.selected = !entity.selected;
            this.selectedGem.moveTo.push(row); 
            this.selectedGem.moveTo.push(col);
            entity.moveTo.push(this.selectedGem.getRow());
            entity.moveTo.push(this.selectedGem.getCol());
        },
        outOfScene: function (obj) {
            return obj.x > fg.Camera.right || obj.x + obj.width < fg.Camera.left || obj.y > fg.Camera.bottom || obj.y + obj.height < fg.Camera.top;
        },
        updateEntity: function (obj) {
            if (!fg.Game.outOfScene(obj)) obj.draw();
            if (!obj.foreGround || obj.backGround) obj.update();            
            if (obj.foreGround) fg.Game.foreGroundEntities.push(obj);
        },
        searchArea: function (startX, startY, depthX, depthY, loopCallBack, endLoopCallBack, caller) {
            this.currentEntities = [];
            var mainColumn = Math.round(startX / fg.System.defaultSide);
            var mainRow = Math.round(startY / fg.System.defaultSide);
            var startRowIndex = mainRow - depthY < 0 ? 0 : mainRow - depthY;
            var endRowIndex = mainRow + depthY > fg.Game.currentLevel.entities.length ? fg.Game.currentLevel.entities.length : mainRow + depthY;
            var startColIndex = mainColumn - depthX < 0 ? 0 : mainColumn - depthX;
            var endColIndex = mainColumn + depthX > fg.Game.currentLevel.entities[0].length ? fg.Game.currentLevel.entities[0].length : mainColumn + depthX;

            for (var i = startRowIndex; i < endRowIndex; i++) {
                for (var k = startColIndex, obj; k < endColIndex; k++) {
                    var obj = fg.Game.currentLevel.entities[i][k];
                    if (!obj || obj.type == TYPE.DARKNESS)
                        continue;
                    if (loopCallBack)
                        (!caller ? loopCallBack : loopCallBack.bind(caller))(obj);
                    this.currentEntities.push(obj);
                    if (obj.target && obj.target.segments)
                        for (var index = 0, entity; entity = obj.target.segments[index]; index++)
                            this.currentEntities.push(entity);
                }
            }

            if (endLoopCallBack)
                (!caller ? endLoopCallBack : endLoopCallBack.bind(caller))();

            return this.currentEntities;
        },
        testOverlap: function (a, b) {
            if (a.id == b.id || b.vanished) return false;
            if (a.x > b.x + b.width || a.x + a.width < b.x) return false;
            if (a.x < b.x + b.width &&
                a.x + a.width > b.x &&
                a.y < b.y + b.height &&
                a.height + a.y > b.y) {
                return true;
            }
            return false;
        },
        showTitle: function () {
            var ctx = fg.System.context;
            ctx.fillStyle = 'black';
            ctx.fillRect(0, 0, fg.System.canvas.width, fg.System.canvas.height);
            
            this.mainFontNormal.draw("Shapes Assemble!", 10, 80);

            this.drawFont("Press space...", "", 120, 180);
            /*if (tracks[0].paused) {
                tracks[0].play();
            }*/
        },
        drawFont: function (text, color, x, y) {
            if (fg.Game.fontAnimation.fadeIn)
                fg.Game.fontAnimation.blinkText += 1;
            else
                fg.Game.fontAnimation.blinkText -= 1;

            if (fg.Game.fontAnimation.blinkText >= 100) fg.Game.fontAnimation.fadeIn = false;

            if (fg.Game.fontAnimation.blinkText <= 0) fg.Game.fontAnimation.fadeIn = true;

            fg.System.context.font = "10px Arial";
            fg.System.context.fillStyle = "rgba(255,255,255," + fg.Game.fontAnimation.blinkText / 100 + ")";
            fg.System.context.fillText(text, x, y);
        },
        drawBackGround: function () {
            var bgSize = 4;
            var bgRow = Math.floor(((c.height / 2) + moveDown) * .5 / (defaultHeight * 2));
            var bgColumn = Math.floor(((c.width / 2) + scroller) * .5 / (defaultWidth * 2));

            var bgDrawDepthX = disableBG ? -1 : 4;//6
            var bgDrawDepthY = disableBG ? -1 : 3;//6

            var startBgRowIndex = /*bgRow - bgDrawDepthY < 0 ? 0 :*/ bgRow - bgDrawDepthY;
            var endBgRowIndex = bgRow + bgDrawDepthY;

            var startBgColIndex = /*bgColumn - bgDrawDepthX < 0 ? 0 :*/ bgColumn - bgDrawDepthX;
            var endBgColIndex = bgColumn + bgDrawDepthX;

            for (var i = startBgRowIndex; i <= endBgRowIndex; i++) {
                for (var k = startBgColIndex, obj; k <= endBgColIndex; k++) {
                    var bgRowIndex = (i > 0 ? i : bgSize + i) % bgSize;
                    var bgColIndex = (k > 0 ? k : bgSize + k) % bgSize;
                    obj = BackGround[bgRowIndex][bgColIndex];
                    if (!obj)
                        continue;

                    obj.bgOffSetX = ((Math.floor(k / bgSize) * (defaultWidth * 2) * bgSize)) + (obj.width * 2);
                    obj.bgOffSetY = ((Math.floor(i / bgSize) * (defaultHeight * 2) * bgSize)) + (obj.height);

                    if (obj.isVisible())
                        obj.Draw();
                }
            }
        }
    }
fg.Font = function (path) {
    return Object.create({
        fontImagePath: path,
        fontHeight: 40,
        fontWidth: 20,
        startChar: 32,
        charCodes: [],
        init: function () {
            var fntImage = new Image();
            var fnt = this;
            fntImage.src = this.fontImagePath;
            this.bgImage = fntImage;
            fntImage.onload = function (e) {
                //draw background image
                //ctx.drawImage(gem, 0, 0);
                var i = e;
                fnt.fontWidth = e.target.width / 95;
                fnt.fontHeight = e.target.height;
            };
            return this;
        },
        _getCharCodes: function(text){
            this.charCodes = [];
            for (var i = 0, char; char = text[i]; i++) {
                this.charCodes.push(char.charCodeAt(0) - this.startChar);
            }
        },
        draw: function (text, x, y) {
            this._getCharCodes(text);
            for (var i = 0; i < this.charCodes.length; i++) {
                var code = this.charCodes[i];
                fg.Render.draw(this.bgImage, code * this.fontWidth, 0, this.fontWidth, this.fontHeight, x + (i * (this.fontWidth)), y);
            }
        }
    }).init();
}
fg.UI = {
    closeAll: false,
    init: function () {
        this.mainForm = Object.assign(Object.create(this.control), this.container, this.form, {
            id: "mainForm", active: true, animate: true, showBorder: true, visible: true, width: 100, height: 80, controls: [],
            x: (fg.System.canvas.width / 2) - (100 / 2),
            y: (fg.System.canvas.height / 2) - (80 / 2)
        });
        var buttonList = Object.assign(Object.create(this.control), this.container, {
            id: "buttonList", active: true, animate: false, visible: true, width: 100, height: 80, controls: [], x: 0, y: 0
        });
        var saveStationList = Object.assign(Object.create(this.control), this.container, this.form, {
            id: "saveStationList", active: true, animate: true, showBorder: true, visible: false, width: 240, height: 192, controls: [], x: -70, y: -60
        });
        this.mainForm.addControl(buttonList);
        this.mainForm.addControl(saveStationList);
        saveStationList.addControl(Object.assign(Object.create(this.control), this.container, {
            id: "ssList", active: true, animate: false, showBorder: true, visible: true, width: 232, height: 64, controls: [], x: 4, y: 124
        }));
        buttonList.addControl(Object.assign(Object.create(this.control), this.button, {
            id: "save", text: "SAVE", highlighted: true, controls: [],
            click: function () {
                fg.Game.saveState();
                return true;
            }
        }));
        buttonList.addControl(Object.assign(Object.create(this.control), this.button, {
            id: "warp", controls: [], text: "WARP",
            click: function () {
                var saveStationList = fg.UI.mainForm.controls.find(function (e) { return e.id == "saveStationList" });
                saveStationList.getActiveContainer().controls = [];
                for (var i = 0, ctrl; ctrl = fg.Game.loadedSaveStations[i]; i++) {
                    saveStationList.getActiveContainer().addControl(Object.assign(Object.create(fg.UI.control), fg.UI.button, {
                        id: "ss-" + ctrl.id, text: ctrl.id, highlighted: i == 0, controls: [],
                        image: ctrl.screen, ctrl: ctrl, width: 40,
                        click: function () {
                            fg.Game.warp(fg.Game.actors[0], { y: (parseInt(this.ctrl.id.split("-")[0]) - 1), x: parseInt(this.ctrl.id.split("-")[1]) });
                            fg.UI.closeAll = true;
                            return true;
                        }
                    }));
                }
                saveStationList.visible = true;
                if (fg.Input.actions["up"]) delete fg.Input.actions["up"];
                if (fg.Input.actions["enter"]) delete fg.Input.actions["enter"];
            }
        }));
        buttonList.addControl(Object.assign(Object.create(this.control), this.button, {
            id: "delete", text: "DELETE", controls: [], click: function () {
                if (!fg.UI.mainForm.controls.find(function (e) { return e.id == "confirm" }))
                    fg.UI.mainForm.addControl(Object.assign(Object.create(fg.UI.control), fg.UI.container, fg.UI.form, fg.UI.confirm, {
                        text: "Confirm deletion? (All your progress will be lost!)",
                        id: "confirm",
                        controls: [],
                        x: (this.parent.realX / 2) - (fg.UI.confirm.width / 2),
                        y: (this.parent.realY / 2) - (fg.UI.confirm.height / 2),
                        click: function (result) {
                            if (result) {
                                fg.UI.closeAll = true;
                                delete localStorage.fallingSaveState;
                            }
                            if (fg.Input.actions["up"]) delete fg.Input.actions["up"];
                            if (fg.Input.actions["enter"]) delete fg.Input.actions["enter"];
                            return result;
                        }
                    }));
                else fg.UI.mainForm.controls.find(function (e) { return e.id == "confirm" }).show();
                if (fg.Input.actions["up"]) delete fg.Input.actions["up"];
                if (fg.Input.actions["enter"]) delete fg.Input.actions["enter"];
            }
        }));
    },
    mainForm: undefined,
    form: {
        type: "form",
        draw: function () {
            if (!this.visible) return;
            var fractionX = this.width / this.maxAnimation;
            var fractionY = this.height / this.maxAnimation;
            if (!this.animate) this.curAnimation = this.maxAnimation;
            var width = (fractionX * this.curAnimation);
            var height = (fractionY * this.curAnimation);
            fg.System.context.fillStyle = this.showBorder ? this.borderColor : this.fillColor;
            fg.System.context.fillRect(this.realX + this.x + ((this.width / 2) - (width / 2)), this.realY + this.y + ((this.height / 2) - (height / 2)), width, height);
            if (this.showBorder) {
                fg.System.context.fillStyle = this.fillColor;
                fg.System.context.fillRect(this.realX + this.x + ((this.width / 2) - (width / 2)) + 1, this.realY + this.y + ((this.height / 2) - (height / 2)) + 1, width - 2, height - 2);
            }

            if (this.curAnimation < this.maxAnimation)
                this.curAnimation++;
            else {
                for (var i = 0, ctrl; ctrl = this.controls[i]; i++) ctrl.draw();
            }
        },
    },
    container: {
        type: "container",
        align: "center",
        direction: "vertical",
        positionRelative: false,
        draw: function () {
            if (this.showBorder) {
                fg.System.context.beginPath();
                fg.System.context.fillStyle = this.borderColor;
                fg.System.context.rect(this.realX + this.x, this.realY + this.y, this.width, this.height);
                fg.System.context.stroke();
            }
            for (var i = 0, ctrl; ctrl = this.controls[i]; i++) ctrl.draw();
        },
        update: function () {
            for (var i = 0, ctrl; ctrl = this.controls[i]; i++) ctrl.update();
        },
        addControl: function (obj) {
            var _ctrl = fg.UI.control.addControl.call(this, obj)
            if (this.controls.length == 1) this.setHighlightedControl(obj);
            if (this.align == "center") {
                var totalHeight = 0;
                var totalWidth = 0;
                var startX = 0;
                var startY = 0;
                if (this.direction == "vertical") {
                    for (var i = 0, ctrl; ctrl = this.controls[i]; i++) {
                        if (!ctrl.positionRelative) continue;
                        totalHeight += ctrl.height;
                    }
                    startY = (this.height - totalHeight) / 2;
                    for (var i = 0, ctrl; ctrl = this.controls[i]; i++) {
                        if (!ctrl.positionRelative) continue;
                        ctrl.y = (this.height - startY) - totalHeight;
                        totalHeight -= ctrl.height;
                        ctrl.x = (this.width / 2) - (ctrl.width / 2);
                    }
                } else if (this.direction == "horizontal") {
                    for (var i = 0, ctrl; ctrl = this.controls[i]; i++) {
                        if (!ctrl.positionRelative) continue;
                        totalWidth += ctrl.width;
                    }
                    startX = (this.width - totalWidth) / 2;
                    for (var i = 0, ctrl; ctrl = this.controls[i]; i++) {
                        if (!ctrl.positionRelative) continue;
                        ctrl.x = (this.width - startX) - totalWidth;
                        totalWidth -= ctrl.width;
                        ctrl.y = (this.height / 2) - (ctrl.height / 2);
                    }
                }
            } else if (this.align == "grid") {

            }
        },
        changeHighlighted: function () {
            for (var i = 0, ctrl; ctrl = this.controls[i]; i++) {
                if (ctrl.controls.length > 0) {
                    ctrl.changeHighlighted();
                }
                if (!ctrl.highlighted || !this.active) continue;
                ctrl.highlighted = false;
                if (fg.Input.actions["right"]) {
                    if (this.controls[i + 1])
                        this.controls[i + 1].highlighted = true;
                    else
                        this.controls[0].highlighted = true;
                    delete fg.Input.actions["right"];
                    this.setHighlightedControl(this.controls[i + 1] || this.controls[0]);
                } else {
                    if (this.controls[i - 1])
                        this.controls[i - 1].highlighted = true;
                    else
                        this.controls[this.controls.length - 1].highlighted = true;
                    delete fg.Input.actions["left"];
                    this.setHighlightedControl(this.controls[i - 1] || this.controls[this.controls.length - 1]);
                }
                break;
            }
        },
        setHighlightedControl: function (ctrl) {
            if (this.parent)
                this.parent.setHighlightedControl(ctrl);
            else
                this.highlightedControl = ctrl;
        },
        getActiveContainer: function () {
            return this.controls.find(function (e) { return e.type == "container" && e.active }) || this;
        },
        getHighlightedControl: function () {
            return this.getActiveContainer().controls.find(function (e) { return e.highlighted });
        }
    },
    draw: function () {
        this.mainForm.draw();
    },
    confirm: {
        id: "confirm",
        text: "confirm?",
        width: 180,
        height: 52,
        direction: "horizontal",
        showBorder: true,
        draw: function () {
            if (!this.visible) return;
            if (this.controls.length == 0) this.addButtons();
            fg.UI.form.draw.call(this);
            fg.System.context.textBaseline = "middle";
            fg.System.context.textAlign = "center";
            fg.System.context.font = "8px Arial";
            fg.System.context.fillStyle = "white";
            fg.System.context.fillText(this.text, this.realX + this.x + (this.width / 2), this.realY + this.y + 12 + 1);
        },
        addButtons: function () {
            this.addControl(Object.assign(Object.create(fg.UI.control), fg.UI.button, {
                id: "yes", text: "yes", highlighted: true, controls: [],
                click: function () {
                    this.parent.click(true);
                    return true;
                }
            }));
            this.addControl(Object.assign(Object.create(fg.UI.control), fg.UI.button, {
                id: "no", text: "no", highlighted: false, controls: [],
                click: function () {
                    this.parent.click(false);
                    return true;
                }
            }));
        },
        show: function () { this.visible = true; }
    },
    infoBox: {
        image: fg.$new('img'),
        canvas: fg.$new("canvas"),
        screen: undefined,
        update: function () {
            if (this.screen) {
                this.image.src = this.screen;
            }
        },
        draw: function () {
            var ctx = this.canvas.getContext('2d');
            ctx.drawImage(this.image, this.realX + this.x + 1, this.realY + this.y + 1, 160, 120);
        }
    },
    button: {
        type: "button",
        text: "myButton",
        draw: function () {
            fg.UI.control.draw.call(this);
            fg.System.context.textBaseline = "middle";
            fg.System.context.textAlign = "center";
            fg.System.context.font = "8px Arial";
            fg.System.context.fillStyle = "white";
            fg.System.context.fillText(this.text, this.realX + this.x + (this.width / 2), this.realY + this.y + (this.height / 2) + 1);
        }
    },
    control: {
        active: false,
        showBorder: false,
        animate: false,
        curAnimation: 0,
        maxAnimation: 30,
        fillColor: "black",
        borderColor: "white",
        highlightedColor: "lightGrey",
        index: 0,
        selected: false,
        highlighted: false,
        x: 0,
        y: 0,
        realX: 0,
        realY: 0,
        width: 48,
        height: 12,
        positionRelative: true,
        visible: true,
        draw: function () {
            if (!this.visible) return;
            var startX = this.positionRelative ? this.realX : 0;
            var startY = this.positionRelative ? this.realY : 0;
            fg.System.context.fillStyle = this.highlighted ? this.highlightedColor : this.fillColor;
            fg.System.context.fillRect(startX + this.x, startY + this.y, this.width, this.height);
            fg.System.context.fillStyle = this.fillColor;
            fg.System.context.fillRect(startX + this.x + 1, startY + this.y + 1, this.width - 2, this.height - 2);
        },
        parent: null,
        addControl: function (obj) {
            obj.parent = this;
            obj.realX = this.realX + this.x;
            obj.realY = this.realY + this.y;
            this.controls.push(obj);
            return obj;
        },
        reset: function () {
            this.curAnimation = 0;
        },
        click: function () { }
    },
    close: function () {
        var activeForms = this.mainForm.controls.filter(function (e) { return e.visible });
        if (activeForms.length > 1) {
            if (!fg.UI.closeAll) {
                activeForms[activeForms.length - 1].visible = false;
                activeForms[activeForms.length - 1].curAnimation = 0;
                delete fg.Input.actions["esc"];
                return;
            } else {
                while (this.mainForm.controls.filter(function (e) { return e.visible }).length > 1) {
                    activeForms = this.mainForm.controls.filter(function (e) { return e.visible });
                    activeForms[activeForms.length - 1].visible = false;
                    activeForms[activeForms.length - 1].curAnimation = 0;
                }
            }
        }
        fg.Game.paused = false;
        fg.Game.saving = false;
        this.closeAll = false;
        this.mainForm.reset();
    },
    activeForm: function () {
        return this.mainForm.controls.find(function (e) { return e.type == "form" && e.visible && e.active }) || this.mainForm;
    },
    update: function () {
        var visibleForms = this.mainForm.controls.filter(function (e) { return (e.type == "form" || e.type == "container") && e.visible });
        for (var i = 0, ctrl; ctrl = visibleForms[i]; i++)  ctrl.active = i == visibleForms.length - 1;
        if (fg.Input.actions["esc"]) {
            this.close();
        }
        if (this.mainForm.active) {
            if (fg.Input.actions["right"] || fg.Input.actions["left"]) this.mainForm.changeHighlighted();
            if (fg.Input.actions["enter"] || fg.Input.actions["up"]) {
                if ((this.activeForm().getHighlightedControl() || { click: function () { } }).click()) this.close();
            }
        }
    }
}

fg.Render = {
    marioCache: {},
    cached: {},
    offScreenRender: function () {
        if (!this.hc) {
            this.hc = fg.$new("canvas");
            this.hc.width = fg.System.defaultSide
            this.hc.width = fg.System.defaultSide
            return this.hc;
        }
        else
            return this.hc;
    },
    drawOffScreen: function (data, cacheX, cacheY, width, height, mapX, mapY) {
        this.offScreenRender().getContext('2d').drawImage(data, cacheX, cacheY, width, height, mapX, mapY, width, height);
    },
    drawToCache: function (data, x, y, type) {
        this.cached[type].getContext('2d').drawImage(data, x, y);
    },
    preRenderCanvas: function () { return fg.$new("canvas"); },
    draw: function (data, cacheX, cacheY, width, height, mapX, mapY) {
        fg.System.context.drawImage(data, cacheX, cacheY, width, height,
            Math.floor(mapX - fg.Game.screenOffsetX), Math.floor(mapY - fg.Game.screenOffsetY), width, height);
    },
    drawImage: function (data, x, y) {
        fg.System.context.drawImage(data, x, y);
    },
    cache: function (type, data) {
        this.cached[type] = data;
        return this.cached[type];
    }
}

fg.Input = {
    actions: {},
    bindings: {},
    ongoingTouches: [],
    KEY: { 'MOUSE1': -1, 'MOUSE2': -3, 'MWHEEL_UP': -4, 'MWHEEL_DOWN': -5, 'BACKSPACE': 8, 'TAB': 9, 'ENTER': 13, 'PAUSE': 19, 'CAPS': 20, 'ESC': 27, 'SPACE': 32, 'PAGE_UP': 33, 'PAGE_DOWN': 34, 'END': 35, 'HOME': 36, 'LEFT_ARROW': 37, 'UP_ARROW': 38, 'RIGHT_ARROW': 39, 'DOWN_ARROW': 40, 'INSERT': 45, 'DELETE': 46, '_0': 48, '_1': 49, '_2': 50, '_3': 51, '_4': 52, '_5': 53, '_6': 54, '_7': 55, '_8': 56, '_9': 57, 'A': 65, 'B': 66, 'C': 67, 'D': 68, 'E': 69, 'F': 70, 'G': 71, 'H': 72, 'I': 73, 'J': 74, 'K': 75, 'L': 76, 'M': 77, 'N': 78, 'O': 79, 'P': 80, 'Q': 81, 'R': 82, 'S': 83, 'T': 84, 'U': 85, 'V': 86, 'W': 87, 'X': 88, 'Y': 89, 'Z': 90, 'NUMPAD_0': 96, 'NUMPAD_1': 97, 'NUMPAD_2': 98, 'NUMPAD_3': 99, 'NUMPAD_4': 100, 'NUMPAD_5': 101, 'NUMPAD_6': 102, 'NUMPAD_7': 103, 'NUMPAD_8': 104, 'NUMPAD_9': 105, 'MULTIPLY': 106, 'ADD': 107, 'SUBSTRACT': 109, 'DECIMAL': 110, 'DIVIDE': 111, 'F1': 112, 'F2': 113, 'F3': 114, 'F4': 115, 'F5': 116, 'F6': 117, 'F7': 118, 'F8': 119, 'F9': 120, 'F10': 121, 'F11': 122, 'F12': 123, 'SHIFT': 16, 'CTRL': 17, 'ALT': 18, 'PLUS': 187, 'COMMA': 188, 'MINUS': 189, 'PERIOD': 190 },
    keydown: function (event) {
        if (fg.Input.bindings[event.keyCode]) {
            fg.Input.actions[fg.Input.bindings[event.keyCode]] = true;
        }
    },
    keyup: function (event) {
        if (fg.Input.bindings[event.keyCode]) {
            delete fg.Input.actions[fg.Input.bindings[event.keyCode]];
        }
    },
    initTouch: function () {
        fg.System.canvas.addEventListener("touchstart", this.handleStart, false);
        fg.System.canvas.addEventListener("touchend", this.handleEnd, false);
        fg.System.canvas.addEventListener("touchcancel", this.handleCancel, false);
        fg.System.canvas.addEventListener("touchmove", this.handleMove, false);
        this.log("initialized.");
    },
    handleStart: function (evt) {
        evt.preventDefault();
        fg.Input.log("touchstart.");
        var touches = evt.changedTouches;
        for (var i = 0; i < touches.length; i++) {
            fg.Input.log("touchstart:" + i + "...");
            fg.Input.ongoingTouches.push(fg.Input.copyTouch(touches[i]));
            var color = fg.Input.colorForTouch(touches[i]);
            fg.System.context.beginPath();
            fg.System.context.arc(touches[i].pageX-2, touches[i].pageY-3, 4, 0, 2 * Math.PI, false);  // a circle at the start
            fg.System.context.fillStyle = color;
            fg.System.context.fill();
            fg.Input.log("touchstart:" + i + ".");
        }
        fg.Game.updateWholeScreen = false;
        fg.Game.touchStart(touches);
        if(!fg.Game.started) fg.Game.started = true;
    },
    handleEnd: function (evt) {
        evt.preventDefault();
        fg.Input.log("touchend");
        var touches = evt.changedTouches;

        for (var i = 0; i < touches.length; i++) {
            var color = fg.Input.colorForTouch(touches[i]);
            var idx = fg.Input.ongoingTouchIndexById(touches[i].identifier);

            if (idx >= 0) {
                fg.System.context.lineWidth = 4;
                fg.System.context.fillStyle = color;
                fg.System.context.beginPath();
                fg.System.context.moveTo(fg.Input.ongoingTouches[idx].pageX, fg.Input.ongoingTouches[idx].pageY);
                fg.System.context.lineTo(touches[i].pageX, touches[i].pageY);
                fg.System.context.fillRect(touches[i].pageX - 4, touches[i].pageY - 4, 8, 8);  // and a square at the end
                fg.Input.ongoingTouches.splice(idx, 1);  // remove it; we're done
            } else {
                fg.Input.log("can't figure out which touch to end");
            }
        }
        fg.Game.touchEnd(touches);
        fg.Game.updateWholeScreen = true;
    },
    handleCancel: function (evt) {
        evt.preventDefault();
        fg.Input.log("touchcancel.");
        var touches = evt.changedTouches;

        for (var i = 0; i < touches.length; i++) {
            var idx = fg.Input.ongoingTouchIndexById(touches[i].identifier);
            fg.Input.ongoingTouches.splice(idx, 1);  // remove it; we're done
        }
    },
    handleMove: function (evt) {
        evt.preventDefault();
        var touches = evt.changedTouches;

        for (var i = 0; i < touches.length; i++) {
            var color = fg.Input.colorForTouch(touches[i]);
            var idx = fg.Input.ongoingTouchIndexById(touches[i].identifier);

            if (idx >= 0) {
                fg.Input.log("continuing touch " + idx);
                fg.System.context.beginPath();
                fg.Input.log("ctx.moveTo(" + fg.Input.ongoingTouches[idx].pageX + ", " + fg.Input.ongoingTouches[idx].pageY + ");");
                fg.System.context.moveTo(fg.Input.ongoingTouches[idx].pageX, fg.Input.ongoingTouches[idx].pageY);
                fg.Input.log("ctx.lineTo(" + touches[i].pageX + ", " + touches[i].pageY + ");");
                fg.System.context.lineTo(touches[i].pageX, touches[i].pageY);
                fg.System.context.lineWidth = 4;
                fg.System.context.strokeStyle = color;
                fg.System.context.stroke();
                fg.Input.ongoingTouches.splice(idx, 1, fg.Input.copyTouch(touches[i]));  // swap in the new touch record
                fg.Input.log(".");
            } else {
                fg.Input.log("can't figure out which touch to continue");
            }
        }
    },
    copyTouch: function (touch) {
        return { identifier: touch.identifier, pageX: touch.pageX, pageY: touch.pageY };
    },
    ongoingTouchIndexById: function (idToFind) {
        for (var i = 0; i < this.ongoingTouches.length; i++) {
            var id = this.ongoingTouches[i].identifier;

            if (id == idToFind) {
                return i;
            }
        }
        return -1;    // not found
    },
    colorForTouch: function (touch) {
        var r = touch.identifier % 16;
        var g = Math.floor(touch.identifier / 3) % 16;
        var b = Math.floor(touch.identifier / 7) % 16;
        r = r.toString(16); // make it a hex digit
        g = g.toString(16); // make it a hex digit
        b = b.toString(16); // make it a hex digit
        var color = "#" + r + g + b;
        //console.log("color for touch with identifier " + touch.identifier + " = " + color);
        console.log(touch.identifier);
        return color;
    },
    initKeyboard: function () {
        window.addEventListener('keydown', this.keydown, false);
        window.addEventListener('keyup', this.keyup, false);
    },
    bind: function (key, action) {
        this.bindings[key] = action;
    },
    bindTouch: function (element, action) {
        element.addEventListener('touchstart', function (e) { fg.Input.touchStart(e, action); }, false);
        element.addEventListener('touchend', function (e) { fg.Input.touchEnd(e, action); }, false);
    },
    touchStart: function (e, action) {
        fg.Input.actions[action] = true;
        e.stopPropagation();
        e.preventDefault();
    },
    touchEnd: function (e, action) {
        delete fg.Input.actions[action]
        e.stopPropagation();
        e.preventDefault();
    },
    log: function (msg) {
        // var p = document.getElementById('log');
        // p.innerHTML = msg + "\n" + p.innerHTML;
    }
}

fg.Timer = {
    showFPS: true,
    currentTime: null,
    lastTime: null,
    deltaTime: null,
    totalTime: 0,
    ticks: 0,
    fps: 0,
    timeInteval: 16,
    update: function () {
        var d = new Date();
        this.currentTime = d.getTime();
        if (!this.lastTime)
            this.lastTime = this.currentTime - 15;
        if (this.showFPS) {
            this.totalTime += Math.round(1000 / ((this.currentTime - this.lastTime)));
            if (this.ticks % 50 == 0) {
                this.fps = this.totalTime / 50;
                this.totalTime = 0;
            }

            fg.System.context.font = "10px Arial";
            fg.System.context.textAlign = "left";
            if (fg.Game.paused) {
                fg.System.context.textBaseline = "alphabetic";
                fg.System.context.fillStyle = "black";
                fg.System.context.fillRect(9, 1, 30, 10);
            }
            fg.System.context.fillStyle = "white";
            fg.System.context.fillText(this.fps, 10, 10);
        }
        this.deltaTime = this.timeInteval;//Math.floor((Math.max(this.currentTime - this.lastTime, 15) <= 30 ? this.currentTime - this.lastTime : 30) / 2) * 2;//16
        this.lastTime = this.currentTime;
        this.ticks++;
    }
}

var TYPE = {
    GREENGEM: "G",
    REDGEM: "R",
    YELLOWGEM: "Y",
    PURPLEGEM: "P",
    BLUEGEM: "B",
    WHITEGEM: "W",
    ORANGEGEM: "O",
}

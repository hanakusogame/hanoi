"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
//メインのゲーム画面
var MainGame = /** @class */ (function (_super) {
    __extends(MainGame, _super);
    function MainGame(scene) {
        var _this = this;
        var tl = require("@akashic-extension/akashic-timeline");
        var timeline = new tl.Timeline(scene);
        var sizeW = 500;
        var sizeH = 360;
        _this = _super.call(this, { scene: scene, x: 0, y: 0, width: sizeW, height: sizeH, touchable: true }) || this;
        var base = new g.Sprite({
            scene: scene,
            src: scene.assets["waku"]
        });
        _this.append(base);
        var waku = new g.Sprite({
            scene: scene,
            src: scene.assets["wakuf"]
        });
        _this.append(waku);
        //土台
        var dodai = new g.Sprite({
            scene: scene,
            src: scene.assets["base"],
            y: 300
        });
        base.append(dodai);
        //棒
        var bars = [];
        var sprBars = [];
        for (var i = 0; i < 3; i++) {
            var e = new g.E({
                scene: scene,
                x: ((sizeW / 3) * i) + (sizeW / 3) / 2,
                y: 300
            });
            base.append(e);
            bars.push(e);
            var bar = new g.FrameSprite({
                scene: scene,
                src: scene.assets["bar"],
                x: -10,
                y: -220,
                width: 20,
                height: 220,
                frames: [0, 1]
            });
            e.append(bar);
            sprBars.push(bar);
        }
        //ゴースト用
        var ghost = new g.FilledRect({
            scene: scene,
            width: 100,
            height: 30,
            cssColor: "white",
            opacity: 0.3
        });
        base.append(ghost);
        //スタック
        var stack = [];
        for (var i = 0; i < 3; i++) {
            stack.push([]);
        }
        //クリア
        var sprClear = new g.Sprite({
            scene: scene,
            src: scene.assets["clear"],
            width: 216,
            height: 80,
            x: (sizeW - 216) / 2,
            y: 150
        });
        _this.append(sprClear);
        sprClear.hide();
        //枚数選択用
        var panelBase = new g.E({ scene: scene });
        _this.append(panelBase);
        //ラベル
        var sprLabel = new g.Sprite({
            scene: scene,
            src: scene.assets["label1"],
            x: 150,
            y: 5
        });
        panelBase.append(sprLabel);
        //選択パネル
        var panels = [];
        var _loop_1 = function (i) {
            var x = i % 3;
            var y = Math.floor(i / 3);
            var width = sizeW / 3;
            var height = sizeH / 2;
            var panel = new g.Sprite({
                scene: scene,
                src: scene.assets["select"],
                x: x * 160 + 10,
                y: y * 160 + 35,
                width: 160,
                height: 160,
                srcX: x * 160,
                srcY: y * 160,
                touchable: true
            });
            panelBase.append(panel);
            panel.pointDown.add(function () {
                if (!scene.isStart || isSelect)
                    return;
                diskNum = i + 2;
                cursor.show();
                cursor.moveTo(panel.x, panel.y);
                cursor.modified();
                scene.playSound("se_finish");
                isSelect = true;
                timeline.create().every(function (a, b) {
                    cursor.opacity = 1 - ((b * 2) % 1);
                    cursor.modified();
                }, 300).wait(700).call(function () {
                    scene.setStage(diskNum);
                    panelBase.hide();
                    next();
                });
            });
        };
        for (var i = 0; i < 6; i++) {
            _loop_1(i);
        }
        //選択カーソル
        var cursor = new g.Sprite({
            scene: scene,
            src: scene.assets["cursor"],
            x: 10,
            y: 35
        });
        panelBase.append(cursor);
        var nowDisk;
        var bkPos = 0;
        var goalPos = 0;
        var tekazu = 0;
        var isStop = false;
        var isSelect = false;
        _this.pointDown.add(function (e) {
            if (!scene.isStart || isStop)
                return;
            if (nowDisk === undefined) {
                var i = Math.floor(e.point.x / (sizeW / 3));
                if (stack[i].length !== 0) {
                    nowDisk = stack[i].pop();
                    ghost.show();
                    ghost.x = bars[i].x - (ghost.width / 2);
                    ghost.y = bars[i].y - (30 * (stack[i].length + 1));
                    ghost.width = nowDisk.w;
                    ghost.modified();
                    nowDisk.y = 40;
                    nowDisk.modified();
                    bkPos = i;
                }
            }
        });
        _this.pointMove.add(function (e) {
            if (!scene.isStart || isStop)
                return;
            if (nowDisk !== undefined) {
                nowDisk.x = e.point.x + e.startDelta.x;
                var i = Math.floor((e.point.x + e.startDelta.x) / (sizeW / 3));
                if (i >= 0 && i < 3) {
                    ghost.x = bars[i].x - (ghost.width / 2);
                    ghost.y = bars[i].y - (30 * (stack[i].length + 1));
                    ghost.modified();
                }
                nowDisk.modified();
            }
        });
        _this.pointUp.add(function (e) {
            if (!scene.isStart || isStop)
                return;
            if (nowDisk !== undefined) {
                var i = Math.floor((e.point.x + e.startDelta.x) / (sizeW / 3));
                if (!(i >= 0 && i < 3) || !(stack[i].length === 0 || stack[i][stack[i].length - 1].tag > nowDisk.tag) || i === bkPos) {
                    i = bkPos;
                    scene.playSound("se_miss");
                }
                else {
                    scene.playSound("se_move");
                    tekazu++;
                    scene.setTekazu(tekazu);
                }
                stack[i].push(nowDisk);
                nowDisk.moveTo(bars[i].x, bars[i].y - (30 * stack[i].length));
                ghost.hide();
                //クリアしたとき
                if (stack[goalPos].length === diskNum) {
                    sprClear.show();
                    scene.addScore((Math.pow(2, diskNum)) * 100);
                    isStop = true;
                    scene.playSound("se_clear");
                    timeline.create().every(function (a, b) {
                        for (var j = 0; j < stack[goalPos].length; j++) {
                            stack[goalPos][j].opacity = 1 - ((b * 2) % 1);
                            stack[goalPos][j].modified();
                        }
                    }, 300).wait(1700).call(function () {
                        sprClear.hide();
                        panelBase.show();
                        tekazu = 0;
                        scene.setTekazu(0);
                        scene.setSaitan(0);
                        isSelect = false;
                    });
                }
            }
            nowDisk = undefined;
        });
        //次のステージ
        var diskNum = 0;
        var next = function () {
            for (var i = 0; i < 3; i++) {
                for (var j = 0; j < stack[i].length; j++) {
                    base.remove(stack[i][j]);
                    stack[i][j].destroy();
                }
                stack[i].length = 0;
            }
            var startPos = scene.random.get(0, 2);
            for (var i = 0; i < diskNum; i++) {
                var w = 150 - (120 / diskNum) * i;
                var disk = new Disk(scene, w, diskNum - i, (diskNum - 2) % 6);
                stack[startPos].push(disk);
                disk.moveTo(bars[startPos].x, bars[startPos].y - (30 * (i + 1)));
                disk.modified();
                base.append(disk);
            }
            for (var i = 0; i < 3; i++) {
                var bar = sprBars[goalPos];
                bar.frameNumber = 0;
                bar.modified();
            }
            while (true) {
                goalPos = scene.random.get(0, 2);
                if (goalPos !== startPos) {
                    var bar = sprBars[goalPos];
                    bar.frameNumber = 1;
                    bar.modified();
                    break;
                }
            }
            isStop = false;
            scene.setSaitan((Math.pow(2, diskNum)) - 1);
        };
        //リセット
        _this.reset = function () {
            diskNum = 2;
            tekazu = 0;
            isSelect = false;
            if (nowDisk !== undefined) {
                base.remove(nowDisk);
                nowDisk.destroy();
            }
            nowDisk = undefined;
            ghost.hide();
            cursor.hide();
            panelBase.show();
        };
        return _this;
    }
    return MainGame;
}(g.E));
exports.MainGame = MainGame;
//円盤クラス
var Disk = /** @class */ (function (_super) {
    __extends(Disk, _super);
    function Disk(scene, w, num, colorNum) {
        var _this = _super.call(this, {
            scene: scene
        }) || this;
        _this.w = w;
        _this.tag = num;
        var diskLeft = new g.Sprite({
            scene: scene,
            src: scene.assets["disk"],
            width: w - 25,
            height: 30,
            x: -(w / 2),
            srcY: colorNum * 30
        });
        var diskRight = new g.Sprite({
            scene: scene,
            src: scene.assets["disk"],
            width: 25,
            height: 30,
            x: (-(w / 2) + (w - 25)),
            srcX: 160 - 25,
            srcY: colorNum * 30
        });
        _this.append(diskLeft);
        _this.append(diskRight);
        return _this;
    }
    return Disk;
}(g.E));

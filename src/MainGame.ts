import { MainScene } from "./MainScene";
declare function require(x: string): any;

//メインのゲーム画面
export class MainGame extends g.E {
	public reset: () => void;
	public setMode: (num: number) => void;

	constructor(scene: MainScene) {
		const tl = require("@akashic-extension/akashic-timeline");
		const timeline = new tl.Timeline(scene);
		const sizeW = 500;
		const sizeH = 360;
		super({ scene: scene, x: 0, y: 0, width: sizeW, height: sizeH, touchable: true });

		const base = new g.Sprite({
			scene: scene,
			src: scene.assets["waku"]
		});
		this.append(base);

		const waku = new g.Sprite({
			scene: scene,
			src: scene.assets["wakuf"]
		});
		this.append(waku);

		//土台
		const dodai = new g.Sprite({
			scene: scene,
			src: scene.assets["base"],
			y: 300
		});
		base.append(dodai);

		//棒
		const bars: g.E[] = [];
		const sprBars: g.FrameSprite[] = [];
		for (let i = 0; i < 3; i++) {
			const e = new g.E({
				scene: scene,
				x: ((sizeW / 3) * i) + (sizeW / 3) / 2,
				y: 300
			});
			base.append(e);
			bars.push(e);

			const bar = new g.FrameSprite({
				scene: scene,
				src: scene.assets["bar"] as g.ImageAsset,
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
		const ghost = new g.FilledRect({
			scene: scene,
			width: 100,
			height: 30,
			cssColor: "white",
			opacity: 0.3
		});
		base.append(ghost);

		//スタック
		const stack: Disk[][] = [];
		for (let i = 0; i < 3; i++) {
			stack.push([]);
		}

		//クリア
		const sprClear = new g.Sprite({
			scene: scene,
			src: scene.assets["clear"],
			width: 216,
			height: 80,
			x: (sizeW - 216) / 2,
			y: 150
		});
		this.append(sprClear);
		sprClear.hide();

		//枚数選択用
		const panelBase = new g.E({ scene: scene });
		this.append(panelBase);

		//ラベル
		const sprLabel = new g.Sprite({
			scene: scene,
			src: scene.assets["label1"],
			x: 150,
			y: 5
		});
		panelBase.append(sprLabel);

		//選択パネル
		const panels: g.Sprite[] = [];
		for (let i = 0; i < 6; i++) {
			const x = i % 3;
			const y = Math.floor(i / 3);
			const width = sizeW / 3;
			const height = sizeH / 2;
			const panel = new g.Sprite({
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

			panel.pointDown.add(() => {
				if (!scene.isStart || isSelect) return;
				diskNum = i + 2;
				cursor.show();
				cursor.moveTo(panel.x, panel.y);
				cursor.modified();
				scene.playSound("se_finish");
				isSelect = true;
				timeline.create().every((a: number, b: number) => {
					cursor.opacity = 1 - ((b * 2) % 1);
					cursor.modified();
				}, 300).wait(700).call(() => {
					scene.setStage(diskNum);
					panelBase.hide();
					next();
				});
			});
		}

		//選択カーソル
		const cursor = new g.Sprite({
			scene: scene,
			src: scene.assets["cursor"],
			x: 10,
			y: 35
		});
		panelBase.append(cursor);

		let nowDisk: Disk;
		let bkPos: number = 0;
		let goalPos: number = 0;
		let tekazu = 0;
		let isStop = false;
		let isSelect = false;
		this.pointDown.add((e) => {
			if (!scene.isStart || isStop) return;
			if (nowDisk === undefined) {
				const i = Math.floor(e.point.x / (sizeW / 3));
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

		this.pointMove.add((e) => {
			if (!scene.isStart || isStop) return;
			if (nowDisk !== undefined) {
				nowDisk.x = e.point.x + e.startDelta.x;
				const i = Math.floor((e.point.x + e.startDelta.x) / (sizeW / 3));

				if (i >= 0 && i < 3) {
					ghost.x = bars[i].x - (ghost.width / 2);
					ghost.y = bars[i].y - (30 * (stack[i].length + 1));
					ghost.modified();
				}

				nowDisk.modified();
			}
		});

		this.pointUp.add((e) => {
			if (!scene.isStart || isStop) return;
			if (nowDisk !== undefined) {
				let i = Math.floor((e.point.x + e.startDelta.x) / (sizeW / 3));
				if (!(i >= 0 && i < 3) || !(stack[i].length === 0 || stack[i][stack[i].length - 1].tag > nowDisk.tag) || i === bkPos) {
					i = bkPos;
					scene.playSound("se_miss");
				} else {
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
					timeline.create().every((a: number, b: number) => {
						for (let j = 0; j < stack[goalPos].length; j++) {
							stack[goalPos][j].opacity = 1 - ((b * 2) % 1);
							stack[goalPos][j].modified();
						}
					}, 300).wait(1700).call(() => {
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
		let diskNum = 0;
		const next = () => {
			for (let i = 0; i < 3; i++) {
				for (let j = 0; j < stack[i].length; j++) {
					base.remove(stack[i][j]);
					stack[i][j].destroy();
				}
				stack[i].length = 0;
			}

			const startPos = scene.random.get(0, 2);
			for (let i = 0; i < diskNum; i++) {
				const w = 150 - (120 / diskNum) * i;
				const disk = new Disk(scene, w, diskNum - i, (diskNum - 2) % 6);
				stack[startPos].push(disk);
				disk.moveTo(bars[startPos].x, bars[startPos].y - (30 * (i + 1)));
				disk.modified();
				base.append(disk);
			}

			for (let i = 0; i < 3; i++) {
				const bar = sprBars[goalPos];
				bar.frameNumber = 0;
				bar.modified();
			}

			while (true) {
				goalPos = scene.random.get(0, 2);
				if (goalPos !== startPos) {
					const bar = sprBars[goalPos];
					bar.frameNumber = 1;
					bar.modified();
					break;
				}
			}

			isStop = false;

			scene.setSaitan((Math.pow(2, diskNum)) - 1);
		};

		//リセット
		this.reset = () => {
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

	}
}

//円盤クラス
class Disk extends g.E {
	public resize: (w: number) => void;
	public w: number;
	constructor(scene: g.Scene, w: number, num: number, colorNum: number) {
		super({
			scene: scene
		});

		this.w = w;

		this.tag = num;

		const diskLeft = new g.Sprite({
			scene: scene,
			src: scene.assets["disk"],
			width: w - 25,
			height: 30,
			x: - (w / 2),
			srcY: colorNum * 30
		});

		const diskRight = new g.Sprite({
			scene: scene,
			src: scene.assets["disk"],
			width: 25,
			height: 30,
			x: (-(w / 2) + (w - 25)),
			srcX: 160 - 25,
			srcY: colorNum * 30
		});

		this.append(diskLeft);
		this.append(diskRight);
	}
}

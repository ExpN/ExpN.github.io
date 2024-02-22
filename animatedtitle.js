const TitleText = "SOLIPSISTIC.NET";
const TitleFont = "https://solipsistic.net/Fonts/ZenDots.ttf";
const TitleFontSizeREM = 5.0;
const TitleStrokeWidth = 15;
const TitleGlyphDrawTime = 2.0;
const TitleGylphDrawEasing = 4;
const TitleGlyphDelay = 0.075;

(() => {
	var CalculatedFontSize = 0;
	var LoadedFont = null;
	var TitleGlyphs = null;
	var GlyphPaths = null;
	var GlyphSteps = null;
	var GlyphLengths = null;
	var CanvasContext = null;
	var AnimStartTime = null;

	function lineSplitTo(ctx, x0, y0, x1, y1, t) {
		if (t >= 1.0) {
			ctx.lineTo(x1, y1);
		}
		else if (t > 0.0) {
			let px = Lerp(x0, x1, t);
			let py = Lerp(y0, y1, t);
			
			ctx.lineTo(px, py);
		}
	}

	function setupPaths() {
		GlyphSteps = [];
		GlyphLengths = [];
		for (let i = 0; i < GlyphPaths.length; i++) {
			let path = GlyphPaths[i];
			GlyphSteps.push([]);
			let lastPoint = {x: 0, y: 0};
			let totalLength = 0;
			for (let j = 0; j < path.commands.length; j++) {
				let cmd = path.commands[j];
				if (cmd.type !== 'Z') {
					if (cmd.type !== 'M') {
						let length = (cmd.type === 'Q' ? QuadraticLength(lastPoint.x, lastPoint.y, cmd.x1, cmd.y1, cmd.x, cmd.y) :
							(cmd.type === 'C' ? BezierLength(lastPoint.x, lastPoint.y, cmd.x1, cmd.y1, cmd.x2, cmd.y2, cmd.x, cmd.y) :
								(LineLength(lastPoint.x, lastPoint.y, cmd.x, cmd.y))
							)
						);
						length = Math.ceil(length);
						if (length > 0.0) {
							GlyphSteps[i].push({cmd: j, offset: totalLength, length: length});
							totalLength += length;
						}
					}
					lastPoint.x = cmd.x; lastPoint.y = cmd.y;
				}
			}
			GlyphLengths.push(totalLength);
		}
	}

	function drawFrame(ctx, timeStamp) {
		let animTime = (timeStamp - AnimStartTime) / 1000.0;
		
		ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
		
		for (let i = 0; i < GlyphPaths.length; i++) {
			let steps = GlyphSteps[i];
			let path = GlyphPaths[i];
			let glyphLength = GlyphLengths[i];
			
			if (steps.length === 0) continue;
			
			let currentStep = 0;
			let glyphBegin = i * TitleGlyphDelay;
			let glyphProgress = Math.min(Math.max(animTime - glyphBegin, 0.0) / TitleGlyphDrawTime, 1.0);
			glyphProgress = 1 - Math.pow(1 - glyphProgress, TitleGylphDrawEasing);
			glyphProgress *= glyphLength;
			
			if (glyphProgress <= 0.0) continue;
			while (currentStep < steps.length - 1 && glyphProgress > (steps[currentStep].offset + steps[currentStep].length)) currentStep++;
			
			let stepProgress = Math.min(glyphProgress - steps[currentStep].offset, steps[currentStep].length);
			let t = stepProgress / steps[currentStep].length;
			let toCmd = steps[currentStep].cmd;
			let lastPoint = {x: 0, y: 0};
			
			ctx.beginPath();
			for (let j = 0; j <= toCmd; j++) {
				let cmd = path.commands[j];
				if (cmd.type === 'M') {
					ctx.moveTo(cmd.x, cmd.y);
					lastPoint.x = cmd.x; lastPoint.y = cmd.y;
				}
				else if (cmd.type === 'L') {
					if (j === toCmd) {
						lineSplitTo(ctx, lastPoint.x, lastPoint.y, cmd.x, cmd.y, t);
					}
					else {
						ctx.lineTo(cmd.x, cmd.y);
						lastPoint.x = cmd.x; lastPoint.y = cmd.y;
					}
				}
				else if (cmd.type === 'Q') {
					if (j === toCmd) {
						ctx.quadraticCurveTo(...QuadraticSplit(lastPoint.x, lastPoint.y, cmd.x1, cmd.y1, cmd.x, cmd.y, t));
					}
					else {
						ctx.quadraticCurveTo(cmd.x1, cmd.y1, cmd.x, cmd.y);
						lastPoint.x = cmd.x; lastPoint.y = cmd.y;
					}
				}
				else if (cmd.type === 'C') {
					if (j === toCmd) {
						ctx.bezierCurveTo(...BezierSplit(lastPoint.x, lastPoint.y, cmd.x1, cmd.y1, cmd.x2, cmd.y2, cmd.x, cmd.y, t));
					}
					else {
						ctx.bezierCurveTo(cmd.x1, cmd.y1, cmd.x2, cmd.y2, cmd.x, cmd.y);
						lastPoint.x = cmd.x; lastPoint.y = cmd.y;
					}
				}
			}
			
			ctx.strokeStyle = '#FFFFFF';
			ctx.lineWidth = 2;
			ctx.stroke();
			ctx.closePath();
		}
	}

	function updateTitleAnim(timeStamp) {
		if (AnimStartTime === null) {
			AnimStartTime = timeStamp;
		}
		drawFrame(CanvasContext, timeStamp);
		requestAnimationFrame(updateTitleAnim);
	}

	async function loadFont(url) {
		var buffer = await fetch(url).then(res => res.arrayBuffer());
		var font = opentype.parse(buffer);
		return font;
	}

	window.addEventListener("load", (event) => {
		var canvas = document.getElementById("title");
		var ctx = canvas.getContext("2d");
		
		CalculatedFontSize = Math.floor(TitleFontSizeREM * parseFloat(getComputedStyle(document.documentElement).fontSize));
		
		loadFont(TitleFont).then(function(font) {
			CanvasContext = ctx;
			LoadedFont = font;
			TitleGlyphs = font.stringToGlyphs(TitleText);
			let fontBounds = MeasureFont(font, CalculatedFontSize, TitleText);
			canvas.width = fontBounds.width + 4;
			canvas.height = fontBounds.height + 4;
			GlyphPaths = font.getPaths(TitleText, 2, fontBounds.baseline + 2, CalculatedFontSize);
			setupPaths();
			setTimeout(() => requestAnimationFrame(updateTitleAnim), 500);
		});
	});
})();

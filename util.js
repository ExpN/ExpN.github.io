function Lerp(from, to, alpha) {
    return ((1.0 - alpha) * from) + (alpha * to);
}

function QuadraticSplit(x0, y0, cx, cy, x1, y1, t) {
	if (t >= 1.0) {
		return [cx, cy, x1, y1];
	}
	else if (t <= 0.0) {
		return [x0, y0, x0, y0];
	}
	else {
		let px0 = Lerp(x0, cx, t);
		let py0 = Lerp(y0, cy, t);
		
		let t00 = t * t;
		let t01 = 1.0 - t;
		let t02 = t01 * t01;
		let t03 = 2.0 * t * t01;
		
		let px1 = t02 * x0 + t03 * cx + t00 * x1;
		let py1 = t02 * y0 + t03 * cy + t00 * y1;
		
		return [px0, py0, px1, py1];
	}
}

function BezierSplit(x0, y0, cx0, cy0, cx1, cy1, x1, y1, t) {
	if (t >= 1.0) {
		return [cx0, cy0, cx1, cy1, x1, y1];
	}
	else if (t <= 0.0) {
		return [x0, y0, x0, y0, x0, y0];
	}
	else {
		let px0 = Lerp(x0, cx0, t);
		let py0 = Lerp(y0, cy0, t);
		
		let px1 = Lerp(cx0, cx1, t);
		let py1 = Lerp(cy0, cy1, t);
		
		let px2 = Lerp(cx1, x1, t);
		let py2 = Lerp(cy1, y1, t);
		
		let px3 = Lerp(px0, px1, t);
		let py3 = Lerp(py0, py1, t);
		
		let px4 = Lerp(px1, px2, t);
		let py4 = Lerp(py1, py2, t);
		
		let px5 = Lerp(px3, px4, t);
		let py5 = Lerp(py3, py4, t);
		
		return [px0, py0, px3, py3, px5, py5];
	}
}

function LineLength(x0, y0, x1, y1) {
	return Math.sqrt(Math.pow(x1 - x0, 2) + Math.pow(y1 - y0, 2));
}

function QuadraticLength(x0, y0, cx, cy, x1, y1) {
	let lastPoint = {x: x0, y: y0};
	let length = 0;
	
	for (let i = 0; i < 10; i++) {
		let t = i / (10 - 1);
		let points = QuadraticSplit(x0, y0, cx, cy, x1, y1, t);
		length += Math.sqrt(Math.pow(points[2] - lastPoint.x, 2) + Math.pow(points[3] - lastPoint.y, 2));
		lastPoint.x = points[2];
		lastPoint.y = points[3];
	}
	
	return length;
}

function BezierLength(x0, y0, cx0, cy0, cx1, cy1, x1, y1) {
	let lastPoint = {x: x0, y: y0};
	let length = 0;
	
	for (let i = 0; i < 10; i++) {
		let t = i / (10 - 1);
		let points = BezierSplit(x0, y0, cx0, cy0, cx1, cy1, x1, y1, t);
		length += Math.sqrt(Math.pow(points[4] - lastPoint.x, 2) + Math.pow(points[5] - lastPoint.y, 2));
		lastPoint.x = points[4];
		lastPoint.y = points[5];
	}
	
	return length;
}

function MeasureFont(font, fontSize, text) {
	var totalWidth = 0;
	var scale = (1 / font.unitsPerEm) * fontSize;
	var glyphs = font.stringToGlyphs(text);

	for (let i = 0; i < glyphs.length; i++) {
		var glyph = glyphs[i];
		if (glyph.advanceWidth) {
			totalWidth += glyph.advanceWidth * scale;
		}
		if (i < glyphs.length - 1) {
			let kerningValue = font.getKerningValue(glyph, glyphs[i + 1]);
			totalWidth += kerningValue * scale;
		}
	}

	return {
		baseline: Math.round(font.ascender * scale),
		width: totalWidth,
		height: Math.ceil((font.ascender * scale) - (font.descender * scale))
	};
}
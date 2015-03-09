// Global Constants
var G_MARG = {'top': 60, 'bottom': 80, 'left': 60, 'right': 20};
var G_CRAD = 3.4;
var G_CLICKED = 0;
var G_CLICKED_POINTS = [];
var distinctColours = [
	'#000000', '#FF34FF', '#FF4A46', '#008941', '#006FA6', '#A30059',
	'#7A4900', '#0000A6', '#B79762', '#004D43', '#8FB0FF', '#997D87',
	'#5A0007', '#809693', '#1B4400', '#4FC601', '#3B5DFF', '#4A3B53',
	'#FF2F80', '#61615A', '#BA0900', '#6B7900', '#00C2A0', '#FFAA92',
	'#FF90C9', '#B903AA', '#D16100', '#000035', '#7B4F4B', '#A1C299',
	'#300018', '#0AA6D8', '#013349', '#00846F', '#372101', '#FFB500',
	'#A079BF', '#CC0744', '#C0B9B2', '#001E09', '#00489C', '#6F0062',
	'#0CBD66', '#456D75', '#B77B68', '#7A87A1', '#788D66', '#885578',
	'#FF8A9A', '#D157A0', '#BEC459', '#456648', '#0086ED', '#886F4C',
	'#34362D', '#B4A8BD', '#00A6AA', '#452C2C', '#636375', '#A3C8C9',
	'#FF913F', '#938A81', '#575329', '#B05B6F', '#8CD0FF', '#3B9700',
	'#04F757', '#C8A1A1', '#1E6E00', '#7900D7', '#A77500', '#6367A9',
	'#A05837', '#6B002C', '#772600', '#D790FF', '#9B9700', '#549E79',
	'#201625', '#72418F', '#BC23FF', '#3A2465', '#922329', '#5B4534',
	'#404E55', '#0089A3', '#CB7E98', '#A4E804', '#324E72', '#6A3A4C',
	'#83AB58', '#001C1E', '#004B28', '#A3A489', '#806C66', '#222800',
	'#BF5650', '#E83000', '#66796D', '#DA007C', '#FF1A59', '#1E0200',
	'#5B4E51', '#C895C5', '#320033', '#FF6832', '#D0AC94', '#7ED379'];

var distinctLightColours = [
	'#FFFF00', '#1CE6FF', '#FFDBE5', '#63FFAC', '#FEFFE6', '#DDEFFF', 
	'#C2FFED', '#C2FF99', '#EEC3FF', '#FAD09F', '#00FECF', '#FFF69F',
	'#99ADC0', '#FDE8DC', '#D1F7CE', '#C8D0F6', '#8ADBB4', '#66E1D3'];

// Timing functions
function beep() {
	console.time('Time');
}

function boop() {
	console.timeEnd('Time');
}

// Function to find the maximum and minimum values of a data array
function findLim(data, key) {
	var lim = d3.extent(data.map( function (d) { return d[key]; }));

	return { max: Number(lim[1]), min: Number(lim[0]) };
}

// Function to extract the numerical portion of a '#px' string
function pxToNum(str) {
	return Number(str.substr(0, str.length - 2));
}

// Function to generate the string for performing translation transforms
function trans(top, left) {
	return 'translate(' + top + ', ' + left + ')';
}

// Function to generating class string for MA plot points
function tagMA(d) {
	var str = 'ma_' + d.symb;
    return (d.col == 'black') ? str + ' insig' : str + ' sig';
}

// Function for calculating radius of points on MA plot
function radMA(d, rad) {
	return (d.col == 'black') ? 0.6 * rad : rad;
}

// Function for calculating x and y coordinates on points
function calcPositionsMA(d, type, xScl, yScl) {
	if (type === 'limma') {
		var xvals = d.map(function (w) { return xScl(w.AvgExpr); });
		var yvals = d.map(function (w) { return yScl(w.LogFC); });
		for (var i = 0; i<d.length; i++) {
			d[i]['x'] = xvals[i];
			d[i]['y'] = yvals[i];
		}
	}
}

// Function to calculate colour of MA plot point
function maCol(col) {
	var cols = {'green': '#A8243E', 
				'red': '#5571A2', 
				'black': '#858585'};
	return cols[col];
}

// Function to generate axis lines
function drawAxis(targetSvg, xScl, yScl, svgh, svgw, transition) {
	transition = transition || false;

	var xAxis = d3.svg.axis().scale(xScl).orient('bottom');
	var top = pxToNum(svgh) - G_MARG.bottom;
	var yAxis = d3.svg.axis().scale(yScl).orient('left');

	if (targetSvg.select('.axis').node() == null) {
		var xg = targetSvg.append('g')
							.attr('class', 'axis x')
							.attr('transform', trans(G_MARG.left, top));

		var yg = targetSvg.append('g')
			  				.attr('class', 'axis y')
			  				.attr('transform', trans(G_MARG.left, G_MARG.top));
	} else {
		xg = targetSvg.select('.x');
		yg = targetSvg.select('.y');
	}

	xg.call(xAxis);
	if (transition) {
		// d3.select('.plot.dot')
		// 	.select('.axis.y')
		// 	.selectAll('text')
		// 	.transition().style('opacity', 0);
		// setTimeout(function() { yg.call(yAxis); }, 200);
		// d3.select('.plot.dot')
		// 	.select('.axis.y')
		// 	.selectAll('text')
		// 	.transition().delay(200).style('opacity', 1);
		yg.transition().call(yAxis);
	} else {
		yg.call(yAxis);
	}
	
}

// Function to create x axis label
function xLabel(svg, text, yoffset) {
	var svgh = pxToNum(svg.style('height'));
	var svgw = pxToNum(svg.style('width'));
	var yoff = yoffset || (svgh - 10)

  	svg.append('text')
  		.classed('axis_text', true)
        .attr('x', (svgw)/2)
        .attr('y', svgh - 10)
        .text(text);
}

// Function to create y axis label
function yLabel(svg, text, yoffset) {
	var svgh = svg.style('height');
	var svgh = Number(svgh.substr(0, svgh.length - 2));
	var svgw = svg.style('width');
	var svgw = Number(svgw.substr(0, svgw.length - 2));
	var yoff = yoffset || 15

 	svg.append('text')
 		.classed('axis_text', true)
	    .attr('transform', 'rotate(-90)')
	    .attr('y', yoff)
	    .attr('x', 0 - svgh / 2)
	    .text(text);
}

// Function to create title for plot
function plotTitle(svg, text) {
	var svgh = svg.style('height');
	var svgh = Number(svgh.substr(0, svgh.length - 2));
	var svgw = svg.style('width');
	var svgw = Number(svgw.substr(0, svgw.length - 2));

	svg.append('text')
	      .attr('class', 'title')
	      .attr('x', svgw / 2)
	      .attr('y', G_MARG.top / 2)
	      .attr('contentEditable', 'true')
	      .text(text);
}

// Function to generate text content of tooltip on main plot
function tooltipStringMain(d) {
	var symb = d.symb.bold();
	var avgexp = d.AvgExpr;
	var logfc = d.LogFC;
	var pval = d.pval;
	if (Number(pval) < 0.00001) {
		pval = '<0.00001';
	}
	var web = '<center><a href="http://www.ncbi.nlm.nih.gov/gene/?term=' + dataGID[d.symb] + '" ' + 
				'target="_blank"' + '>More...</a></center>';

	var out = '<center>' + symb + '</center>' +
				'<table>' +
				'<tr><td>AvgExpr:</td>' + '<td>' + avgexp + '</td></tr>' +
				'<tr><td>LogFC:</td>' + '<td>' + logfc + '</td></tr>' +
				'<tr><td>P-Value:</td>' + '<td>' + pval + '</td></tr>' +
				'</table>' + web;


	return out;
}

// Function to generate path and content for main tooltip
function populateMainTooltip(node) {
	var d = node.data()[0];
	var tooltip = d3.select('.tooltip_main');
	var path = d3.select('.main_path');
	var str = tooltipStringMain(d);

	tooltip.style('display', 'block')
			.html(str);

	var svg = d3.select('svg')
	var divh = pxToNum(tooltip.style('height')) +
				2 * pxToNum(tooltip.style('padding'));
	var divw = pxToNum(tooltip.style('width')) +
				2 * pxToNum(tooltip.style('padding'));
	var plotw = pxToNum(d3.select('.plot_div').style('width'));

	var str = 'M ' + d.x + ' ' + d.y + ' L ' + (plotw - divw - 60) + ' ' + (divh - 60);
	path.attr('d', str);
}

// Function to display tooltip for main plot
function mainTooltipOn() {
	var tooltip = d3.select('.tooltip_main');
	var path = d3.select('.main_path');

	tooltip.style('display', 'block');
	path.style('display', 'block');
}

// Function to hide tooltip for main plot
function mainTooltipOff() {
	var tooltip = d3.select('.tooltip_main');
	var path = d3.select('.main_path');

	tooltip.style('display', 'none');
	path.style('display', 'none');
}

// Function to toggle visibility of tooltip and path on main plot
function toggleMainTooltip() {
	var tooltip = d3.select('.tooltip_main');
	var button = d3.select('.tooltip_button');
	var circle = d3.select('.front_circle');

	if (circle.node() == null) {
		return;
	}

	if (tooltip.style('display') == 'none') {
		mainTooltipOn();
		button.html('Tooltip Off');
	} else if (tooltip.style('display') == 'block') {
		mainTooltipOff();
		button.html('Tooltip On');
	}
}

// Function to perform actions on mouseover/clicking points on MA plot
function togglePointMA(node, action) {
	// Get data, front svg, front circle and dot plot svg.
	var d = node.data()[0];
	var front = d3.select('.front')
	var circle = d3.selectAll('.front_circle');
	var dotDiv = d3.select('.side_plot');

	if (action == 'on') {
		// First remove old front circle
		circle.remove();

		// Draw tooltip and show it
		populateMainTooltip(node);
		mainTooltipOn();

		// Draw front circle and bind data
		front.append('circle')
			.classed('front_circle ma front_' + d.GeneID, true)
			.attr('cx', d.x)
			.attr('cy', d.y)
			.attr('r', 5.4)
			.style('fill', maCol(d.col));

		// Draw dot plot, transition animations depending on global clicked status
		if (G_CLICKED == 1) {
			// Alter plot with transitions
			dotPlot(dotDiv, d.GeneID, true);
		} else {
			// Alter plot without transitions
			dotPlot(dotDiv, d.GeneID, false);
		}
	} else if (action == 'off') {
		// Remove front circle and hide tooltip
		circle.remove();
		mainTooltipOff();
	}
}

// Function to operate main plot click response
function mainClick(node) {
	if (node.attr('clicked') == 0) {
		while (n = G_CLICKED_POINTS.pop()) {
			togglePointSA(n, 'off');
			n.attr('clicked', 0);
		}
		G_CLICKED_POINTS.push(node);
		G_CLICKED = 1;
		node.attr('clicked', 1);
		togglePointMA(node, 'on');
		togglePointSA(node, 'on');
	} else {
		G_CLICKED = 0;
		node.attr('clicked', 0);
		togglePointMA(node, 'off');
		togglePointSA(node, 'off');
	}
}

// Function to display insignificant points
function showInsignificant() {
	d3.selectAll('.insig').style('display', 'block');
	G_INSIG = 1;
}

// Function to hide insignificant points
function hideInsignificant() {
	d3.selectAll('.insig').style('display', 'none');
	G_INSIG = 0;
}

function toggleInsignificant() {
	if (typeof G_INSIG == 'undefined') {
		G_INSIG = 1;
	}

	if (G_INSIG == 0) {
		showInsignificant();
	} else if (G_INSIG == 1) {
		hideInsignificant();
	}
}

// Function to operate main plot mouseover response
function mainMOver(node) {
	if (G_CLICKED == 0) {
		togglePointMA(node, 'on');
		togglePointSA(node, 'on');
	}
}

// Function to operate main plot mouseout response
function mainMOut(node) {
	if (G_CLICKED == 0) {
		togglePointMA(node, 'off');
		togglePointSA(node, 'off');
	}
}

// Function to bind operations to buttons above main plot
function bindMainButtons() {
	var tooltip_button = d3.select('.tooltip_button');
	var insig_button = d3.select('.insig_button');

	tooltip_button.on('click', function () { toggleMainTooltip(); });
	insig_button.on('click', function () { toggleInsignificant(); });
}

// Function to toggle visible plot on side
function toggleSidePlot() {
	var side_plot = d3.select('.side_plot.base');
	var side_plot_alt = d3.select('.side_plot.alt');

	if (typeof G_SIDE_PLOT == 'undefined') {
		G_SIDE_PLOT = 1;
	}

	if (G_SIDE_PLOT == 1) {
		side_plot.style('visibility', 'hidden');
		side_plot_alt.style('visibility', 'visible');
		G_SIDE_PLOT = 2;
	} else if (G_SIDE_PLOT == 2) {
		side_plot.style('visibility', 'visible');
		side_plot_alt.style('visibility', 'hidden');
		G_SIDE_PLOT = 1;
	}
}

// Function to bind operations to buttons above main plot
function bindSideButtons() {
	var toggle_side = d3.select('.toggle_side');

	toggle_side.on('click', function () { toggleSidePlot(); });
}

// Function to draw MA plot in a target div
function maPlot(targetDiv, data) {
	var limX = findLim(data, 'AvgExpr');
	var limY = findLim(data, 'LogFC');

	var svgh = targetDiv.style('height');
	var plth = pxToNum(svgh) - G_MARG.top - G_MARG.bottom;
	var svgw = targetDiv.style('width');
	var pltw = pxToNum(svgw) - G_MARG.left - G_MARG.right;

	var xadj = (limX.max - limX.min) * 0.05;
	var yadj = (limY.max - limY.min) * 0.05;

	var xmin = limX.min - xadj;
	var xmax = limX.max + xadj;

	var ymin = limY.min - yadj;
	var ymax = limY.max + yadj;

	var xScl = d3.scale.linear().domain([xmin, xmax]).range([0, pltw]);
	var yScl = d3.scale.linear().domain([ymin, ymax]).range([plth, 0]);

	calcPositionsMA(data, 'limma', xScl, yScl);

	var svgMA = targetDiv.append('svg')
							.classed('plot ma', true);

	var plotWindow = svgMA.append('g')
							.classed('plot_window', true)
							.attr('transform', trans(G_MARG.top, G_MARG.left));

	var cirContain = plotWindow.append('g')
								.classed('circles_container', true);

	plotWindow.append('g').classed('main_paths', true)
							.append('path')
							.classed('main_path', true);
	plotWindow.append('g').classed('front', true);

	var circlesMA = cirContain.selectAll('circle')
								.data(data);

	circlesMA.enter()
				.append('circle')
				.attr('class', function (d) { return tagMA(d); })
				.attr('r', function (d) { return G_CRAD * 0.6; })
				.attr('cx', function (d) { return d.x; })
				.attr('cy', function (d) { return d.y; })
				.attr('clicked', 0)
				.attr('moused', 0)
				.style('fill', function (d) { return maCol('black'); })
				.style('opacity', 1)
				.style('cursor', 'pointer')
				.on('click', function (d) { mainClick(d3.select(this)); })
				.on('mouseover', function (d) { mainMOver(d3.select(this)); })
				.on('mouseout', function (d) { mainMOut(d3.select(this)); });

	var guideLinesMA = plotWindow.append('g').classed('guide_container', true);
	// Draw guide lines at -1, 0, 1
	for (var i = -1; i <= 1; i++) {
		var leftEdge = String(xScl(xmin));
		var rightEdge = String(xScl(xmax));
		var yCoord = String(yScl(i));

		var pathStr = "M " + leftEdge + " " + yCoord + " L " + rightEdge + " " + yCoord;
		var path = guideLinesMA.append('path')
								.classed('guide_line', true)
								.attr('d', pathStr);

		if (i == 0) {
			path.attr('stroke', 'blue');
		} else {
			path.attr('stroke', 'lightblue');
		}
	}

	d3.selectAll('.sig')
		.transition()
		.delay(250)
		.duration(1500)
		.attr('r', function (d) { return radMA(d, G_CRAD); })
		.style('fill', function (d) { return maCol(d.col); })

	drawAxis(svgMA, xScl, yScl, svgh, svgw);
	xLabel(svgMA, 'Average Expression');
	yLabel(svgMA, 'LogFC');
	plotTitle(svgMA, 'MA Plot');
}

// Function to generate tooltip string for side plot
function tooltipStringSide(d, type) {
	var name = d.sample;
	var cpm = d.value;

	var maxlen = 24;

	if (type == 'short' && name.length > maxlen) {
		var head = name.substr(0, maxlen/2);
		var tail = name.substr(name.length - maxlen/2, name.length - 1);
		var name = head + '...' + tail;
	}
	return name.bold() + '<br />' + cpm;
}

// Function to generate content for side plot tooltip
function populateSideTooltip(node) {
	var d = node.data()[0];
	var tooltip = d3.select('.tooltip_side');
	var str = tooltipStringSide(d, 'short');
	var div = d3.select('.plot_div');
	var divw = pxToNum(div.style('width'));
	var middle = (divw - G_MARG.left - G_MARG.right) / 2;

	var node_x = Number(node.attr('x')) + G_MARG.left;
	var node_y = Number(node.attr('y')) + G_MARG.top;
	
	var tooltip = d3.select('.tooltip_side');
	
	if (node_x < middle) {
		tooltip.style('top', node_y + 'px')
				.style('right', null)
				.style('left', node_x + 15 + 'px');
	} else {
		tooltip.style('top', node_y + 'px')
				.style('left', null)
				.style('right', divw - node_x + 5 + 'px');
	}
	
	tooltip.style('display', 'block')
			.html(str);

}

// Function to make tooltip on dot plot visible
function sideTooltipOn() {
	d3.select('.tooltip_side').style('display', 'block');
}

// Function to make tooltip on dot plot hidden
function sideTooltipOff() {
	d3.select('.tooltip_side').style('display', 'none');
}

// Function to set mouseover behaviour for side plot
function mouseoverSide(node) {
	populateSideTooltip(node);
	sideTooltipOn();
}

// Function to set mouseout behaviour for side plot
function mouseoutSide(node) {
	sideTooltipOff();
}

// Function to draw dot plot in target div
function dotPlot(targetDiv, geneID, transition) {
	var rectSize = G_CRAD * 2;
	var svgh = targetDiv.style('height');
	var plth = pxToNum(svgh) - G_MARG.top - G_MARG.bottom;
	var svgw = targetDiv.style('width');
	var pltw = pxToNum(svgw) - G_MARG.left - G_MARG.right;

	var limY = findLim(dataDot[geneID], 'value');
	var yAdj = (limY.max - limY.min) * 0.05;
	limY.max += yAdj;
	limY.min -= yAdj;

	var xScl = d3.scale.ordinal()
						.domain(dataFact)
						.rangePoints([0, pltw], 1);

	var yScl = d3.scale.linear()
						.domain([limY.min, limY.max])
						.range([plth, 0]);

	if (d3.select('.dot').node() == null) {
		var svgDot = targetDiv.append('svg')
								.classed('plot dot', true);

		var plotWindow = svgDot.append('g')
								.classed('plot_window', true)
								.attr('transform', trans(G_MARG.top, G_MARG.left));

		var dotContain = plotWindow.append('g')
									.classed('dot_container', true);

		plotWindow.append('g').classed('front', true);
	} else {
		var svgDot = d3.select('.dot');
		var plotWindow = svgDot.select('.plot_window');
		var dotContain = plotWindow.select('.dot_container');
	}

	var dots = dotContain.selectAll('rect')
								.data(dataDot[geneID]);

	dots.enter().append('rect')
				.style('fill', function (d, i) { return distinctColours[i]; });
				

	if (transition == true){
		dots.transition()
		.attr('height', rectSize)
		.attr('width', rectSize)
		.attr('x', function (d) { return xScl(d.group) - rectSize/2; })
		.attr('y', function (d) { return yScl(d.value) - rectSize/2; });
	} else {
		dots.attr('height', rectSize)
		.attr('width', rectSize)
		.attr('x', function (d) { return xScl(d.group) - rectSize/2; })
		.attr('y', function (d) { return yScl(d.value) - rectSize/2; });
	}

	dots.on('mouseover', function (d) { mouseoverSide(d3.select(this)); })
		.on('mouseout', function (d) { mouseoutSide(d3.select(this)); });
	
	drawAxis(svgDot, xScl, yScl, svgh, svgw, transition);
	svgDot.select('.y').style('font-size', 14);

	svgDot.select('.axis.x').selectAll('text')
			.style('text-anchor', 'end')
			.style('font-size', '0.8em')
			.attr('dx', '-0.8em')
			.attr('dy', '0.15em')
			.attr('transform', 'rotate(-35)');

	if (svgDot.select('.axis_text').node() == null) {
		// xLabel(svgDot, 'Group');
		yLabel(svgDot, 'Expression');
		plotTitle(svgDot, 'Sample LogCPM');
	}
}

// Function to create path string from object
function makePath(data, xScale, yScale) {
	var pathStartX = String(xScale(data[0].x));
	var pathStartY = String(yScale(data[0].y));

	var path = 'M ' + pathStartX + ' ' + pathStartY;

	for (i = 1; i < data.length; i++) {
		var x = String(xScale(data[i].x));
		var y = String(yScale(data[i].y));

		// Append next point to path
		path += ' L '+ x + ' ' + y;
	}
	return path;
}

// Function to toggle point in SA plot
function togglePointSA(node, action) {
	// Select point of interest
	var d = node.data()[0];
	var target = '.sa_' + d.GeneID;
	var point = d3.select(target);
	// Get coordinate data of point
	var cx = point.attr('cx');
	var cy = point.attr('cy');

	// Select front section of SA plot
	front = d3.select('.plot.sa').select('.front')
	
	// Remove old point
	front.select('circle').remove()

	// Toggle point on the front of SA plot
	if (action == 'on') {
		// Colour and enlarge point
		front.append('circle')
				.classed('front_circle', true)
				.attr('r', G_CRAD * 1.5)
				.attr('cx', cx)
				.attr('cy', cy)
				.style('fill', '#A8243E');
	}
}

// Function to draw SA plot in target div
function saPlot(targetDiv, data, trendData) {
	// Find target window size
	var svgh = targetDiv.style('height');
	var svgw = targetDiv.style('width');
	// Generate plot area dimensions
	var plth = pxToNum(svgh) - G_MARG.top - G_MARG.bottom;
	var pltw = pxToNum(svgw) - G_MARG.left - G_MARG.right;

	// Find maximum and minimum x and y values
	var limX = findLim(data, 'AvgExpr');
	var limY = findLim(data, 'Log2Sigma');

	// Adjust maximum and minimum values
	var xadj = (limX.max - limX.min) * 0.05;
	var yadj = (limY.max - limY.min) * 0.05;

	var xmin = limX.min - xadj;
	var xmax = limX.max + xadj;

	var ymin = limY.min - yadj;
	var ymax = limY.max + yadj;

	// Generate scalers
	var xScl = d3.scale.linear().domain([xmin, xmax]).range([0, pltw]);
	var yScl = d3.scale.linear().domain([ymin, ymax]).range([plth, 0]);

	// Generate or select plot window
	if (d3.select('.sa').node() == null) {
		var svgSA = targetDiv.append('svg')
								.classed('plot sa', true);

		var plotWindow = svgSA.append('g')
								.classed('plot_window', true)
								.attr('transform', trans(G_MARG.top, G_MARG.left));
		var saContain = plotWindow.append('g')
									.classed('sa_container', true);

		plotWindow.append('g').classed('front', true);
	} else {
		var svgSA = d3.select('.sa');
		var plotWindow = svgSA.select('.plot_window');
		var saContain = plotWindow.select('.sa_container');
	}

	// Extract only relevant information
	var dataSA = data.map(function (d) {
		return {'AvgExpr': d.AvgExpr, 
				'Log2Sigma': d.Log2Sigma, 
				'symb': d.symb,
				'GeneID': d.GeneID};
	});

	// Draw points
	var points = saContain.selectAll('circle')
							.data(dataSA);

	points.enter().append('circle')
			.attr('class', function (d) { return 'sa_' + d.GeneID; })
			.attr('r', G_CRAD * 0.4)
			.attr('cx', function (d) { return xScl(d.AvgExpr); })
			.attr('cy', function (d) { return yScl(d.Log2Sigma); })
			.style('fill', maCol('black'));

	// Draw line
	tagwise_path = makePath(trendData, xScl, yScl);

	plotWindow.append('path')
				.classed('tagwise_sa', true)
				.attr('d', tagwise_path);

	// Draw title and axis
	drawAxis(svgSA, xScl, yScl, svgh, svgw);
	xLabel(svgSA, 'AvgExpr (CPM)');
	yLabel(svgSA, 'Log2Sigma');
	plotTitle(svgSA, 'SA Plot');
	
}

// Function to find gene based on gene symbol and highlight on ma plot
function findGeneAndHighlight(symb) {
	// Select node based on symbol
	if (symb) {
		var selectedNode = d3.select('.ma_' + symb);
	} else {
		return;
	}
	
	// If valid node then call toggle on selected node
	if (selectedNode.attr('clicked') == 0) {
		mainClick(selectedNode);
	}
}

// Set up gene search field
function setupSearchField() {
	var bodySelect = d3.select('.bot_div').select('.buttons_container');
	var uiWidget = bodySelect.append('p');//.attr('class', 'ui-widget');

	uiWidget.append('label')
		.attr('for', 'geneSym')
		.html('Gene Symbol: ');

	uiWidget.append('input')
		.attr('type', 'text')
		.attr('id', 'geneSym');

	uiWidget.append('button')
		.attr('class', 'gene_search')
		.attr('id', 'geneSearch')
		.attr('onclick', 'findGeneAndHighlight($(\'#geneSym\').val())')
		.html('Highlight!');

	// jquery autocomplete code
	$('#geneSym').keyup(function(event) {
		if (event.keyCode == 13) {
		    $('#geneSearch').click();
		}
	});

	// Autocomplete code
	$(function() {
		$('#geneSym').autocomplete({
			source: availableTags
		});
		$('#geneSym').autocomplete( 'option', 'autoFocus', true );
		$('#geneSym').autocomplete( 'option', 'minLength', 2 );
	});
}

// Function to hide loading spinner
function hideLoad() {
  d3.select('.load_screen').style('display', 'none');
}

// Function to show loading spinner
function showLoad() {
  d3.select('.load_screen').style('display', 'block');
}

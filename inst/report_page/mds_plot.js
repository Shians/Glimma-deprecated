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

// Function to perform actions when mouse over MDS plot
function MDSMOver(node) {
	var d = node.data()[0];

	var x = node.attr('cx');
	var y = node.attr('cy');

	console.log(x);
	console.log(y);
}

// Function to draw MDS plot
function mdsPlot(targetDiv, data, dim1, dim2, colOpt) {

	if (dim1 > dim2 || dim1 < 1 || dim2 > 10) {
		return;
	}

	// Set default colour option
	colOpt = colOpt || 'col';

	// Get dimension data
	var dim = divDim(targetDiv);

	// Find limits of dataset
	var limX = findLim(data, dim1);
	var limY = findLim(data, dim2);

	var adj = (limX.max/2 - limX.min/2) * 0.05;
	limX.max += adj;
	limX.min -= adj

	adj = (limY.max/2 - limY.min/2) * 0.05;
	limY.max += adj;
	limY.min -= adj;

	// Generate scalers
	var xScl = d3.scale.linear().domain([limX.min, limX.max])
								.range([0, dim.pltw]);
	var yScl = d3.scale.linear().domain([limY.min, limY.max])
								.range([0, dim.plth]);

	// Generate or select plot window
	if (d3.select('.mds').node() == null) {
		var svgMDS = targetDiv.append('svg')
								.classed('plot mds', true);

		var plotWindow = svgMDS.append('g')
								.classed('plot_window', true)
								.attr('transform', trans(G_MARG.left, G_MARG.top));
		var mdsContain = plotWindow.append('g')
									.classed('mds_container', true);

		plotWindow.append('g').classed('front', true);
	} else {
		var svgMDS = d3.select('.mds');
		var plotWindow = svgMDS.select('.plot_window');
		var mdsContain = plotWindow.select('.mds_container');
	}
	
	// Attach points
	var points = mdsContain.selectAll('.point')
							.data(data);

	points.enter().append('circle');
	points.attr('class', 'point')
			.attr('r', 6)
			.style('fill', function (d) { return d[colOpt]; })
			.on('mouseover', function (d) { return MDSMOver(d3.select(this)); });

	points.transition()
			.attr('cx', function (d) { return xScl(d[dim1]); })
			.attr('cy', function (d) { return yScl(d[dim2]); });
			

	drawAxis(svgMDS, xScl, yScl, dim.svgh, dim.svgw);
	xLabel(svgMDS, 'Dimension ' + String(dim1));
	yLabel(svgMDS, 'Dimension ' + String(dim2));
}

function skreeClick(i) {
	var mdsDiv = d3.select('.plot_div.left');
	var colOpt = 'col';
	mdsPlot(mdsDiv, dataMDS, i, i+1);
}

// Function to draw skree plot
function skreePlot(targetDiv, data) {
	var marg = {'top': 20, 'bottom': 50, 'left': 60, 'right': 10};

	// Get dimension data
	var dim = divDim(targetDiv, marg);

	// Find limits of dataset
	var limY = d3.extent(data);

	// Generate scalers
	var xScl = d3.scale.ordinal().domain(d3.range(1,11))
    								.rangeRoundBands([0, dim.pltw], .1);
	var yScl = d3.scale.linear().domain([limY[1], limY[0]])
								.range([0, dim.plth]);

	// Generate window and containers for plot
	var svgSkree = targetDiv.append('svg')
								.classed('plot skree', true);

	var plotWindow = svgSkree.append('g')
								.classed('plot_window', true)
								.attr('transform', trans(marg.left, marg.top));

	var barContainer = plotWindow.append('g')
									.classed('bar_container', true);

	// Attach data
	var bars = barContainer.selectAll('.bar')
							.data(data);

	// Draw bars
	bars.enter()
		.append('rect')
		.attr('class', 'bar')
		.attr('x', function (d, i) { return xScl(i + 1); })
		.attr('y', function (d) { return yScl(d); })
		.attr('height', function (d) { return dim.plth - yScl(d); })
		.attr("width", xScl.rangeBand())
		.on('click', function(d, i) { skreeClick(i+1) ;});


	xAxis(svgSkree, xScl, dim.svgh, dim.svgw, marg);
	yAxis(svgSkree, yScl, dim.svgh, dim.svgw, marg);
	xLabel(svgSkree, 'Dimension');
	yLabel(svgSkree, 'Magnitude');
}

function updateCircleRad(size) {
	d3.select('.mds_container')
		.selectAll('.point')
		.attr('r', size/10);
}
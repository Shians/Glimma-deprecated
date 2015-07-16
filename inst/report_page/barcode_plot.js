var G_MARG = {'top': 60, 'bottom': 60, 'left': 60, 'right': 60};

// Function to highlight bar on plot
function highlightBar(node) {
	var front = d3.select('.barcode.plot').select('.front');

	front.append('rect')
			.attr('class', 'front_bar')
			.attr('x', node.attr('x') - 1)
			.attr('y', node.attr('y') - 1)
			.attr('height', Number(node.attr('height')) + 2)
			.attr('width', 4)
			.style('fill', 'orangered');

	// node.attr('x', Number(node.attr('x')) - 1)
	// 	.attr('width', 4)
	// 	.style('fill', 'orangered');

	populateBarcodeTooltip(node);
	positionBarcodeTooltip(node);
	showBarcodeTooltip();
}

// Function to de-highlight bar on plot
function lowlightBar(node) {
	d3.select('.front_bar').remove();
	// node.attr('x', Number(node.attr('x')) + 1)
	// 	.attr('width', 2)
	// 	.style('fill', 'black');

	hideBarcodeTooltip();
}

// Function to generate the string for tooltip
function barcodeTooltipString(d) {
	var stat = d.stat;
	var symb = d.Gene;

	var web = '<center><a href="http://www.ncbi.nlm.nih.gov/gene/?term=' + symb + '" ' + 
				'target="_blank"' + '>Search online</a></center>'

	var out = '<center><b>' + symb + '</b>' + 
				'<table>' +
				'<tr><td>' + barcodeStatName + ': </td><td>' + stat + '</td>' +
				'</table>' + '</center>' + web;

	return out;
}

// Function to populate the tooltip
function populateBarcodeTooltip(node) {
	var tooltip = d3.select('.tooltip_barcode');
	var data = node.data()[0];

	var str = barcodeTooltipString(data);

	tooltip.html(str);
}

// Function to position barcode tooltip
function positionBarcodeTooltip(node) {
	var tooltip = d3.select('.tooltip_barcode');
	var parentDiv = d3.select('.barcode.plot');
	var dim = divDim(parentDiv);

	var tooltipWidth = pxToNum(tooltip.style('width'));

	var centered = G_MARG.left + Number(node.attr('x')) - tooltipWidth / 2;

	if (centered < 0) {
		tooltip.style('left', '0px')
				.style('right', null);
	} else if (centered > dim.pltw - 20) { // TODO: Fix magic number
		tooltip.style('right', '0px')
				.style('left', null);
	} else {
		tooltip.style('left', centered + 'px')
				.style('right', null);
	}
	
}

// Function to show the tooltip
function showBarcodeTooltip() {
	var tooltip = d3.select('.tooltip_barcode');

	tooltip.style('display', 'block');
}

// Function to hide the tooltip
function hideBarcodeTooltip() {
	var tooltip = d3.select('.tooltip_barcode');

	tooltip.style('display', 'none');
}

// Function to perform mouse over actions for bar plot
function barMouseOver(node, i) {
	escAction();
	highlightBar(node);
	G_CLICKED = i;
}

// Function to perform mouse out actions for bar plot
function barMouseOut(node) {
	lowlightBar(node);

	hideBarcodeTooltip();
}

// Function to create path string for barcode plot bars
function makeBarPath(stat, xScl, yScl) {
	var s = "M " + xScl(stat) + " " + yScl(0) + " ";
	var f = "L " + xScl(stat) + " " + yScl(0.975);
	return s + f;
}

// Global variables for bar selection
var G_SELECTION = -1;

// Function to perform escape key action
function escAction() {
	if (G_SELECTION != -1) {
		var bars = d3.selectAll('.bars');
		var barSelect = bars.filter(function (d, i) { return i == G_SELECTION; });
		hideBarcodeTooltip();
		lowlightBar(barSelect);
		G_SELECTION = -1;
	}
}

// Function to get quantiles of the barcode statistics
function getStatQuantiles(data) {
	var data = data.map(function(d) { return d.stat; });
	var len = data.length;
	var r = d3.range(9);
	// Return a list of the (i/9)th percentiles rounded to 2 decimal places
	return r.map(function(d) {
		if (d != r.length - 1) {
			x = data[Math.round(d * len / (r.length - 1))];	
		} else {
			x = data[len - 1];
		}
		return Math.round(x*100)/100; 
	});
}

// Function to perform left arrow action
function leftArrowAction() {
	// Deslect all bars
	// escAction()
	var bars = d3.selectAll('.bars');
	// If no bar currently selected
	if (G_SELECTION == -1) {
		// Select and highlight last bar
		var barSelect = bars.filter(function (d, i) { return i == bars[0].length - 1; });
		highlightBar(barSelect);
		G_SELECTION = bars[0].length - 1;
	} else {
		// De-highlight previous bar
		var barSelect = bars.filter(function (d, i) { return i == G_SELECTION; });
		lowlightBar(barSelect);
		// Highlight new bar
		var newSelection = G_SELECTION - 1 < 0 ? bars[0].length - 1 : G_SELECTION - 1;
		var barSelect = bars.filter(function (d, i) { return i == newSelection; });
		highlightBar(barSelect);
		G_SELECTION = newSelection;
	}
}

// Function to perform right arrow action
function rightArrowAction () {
	// Deslect all bars
	// escAction()
	var bars = d3.selectAll('.bars');
	// If no bar currently selected
	if (G_SELECTION == -1) {
		// Select and highlight last bar
		var barSelect = bars.filter(function (d, i) { return i == 0; });
		highlightBar(barSelect);
		G_SELECTION = 0;
	} else {
		// De-highlight previous bar
		var barSelect = bars.filter(function (d, i) { return i == G_SELECTION; });
		lowlightBar(barSelect);
		// Highlight new bar
		var newSelection = G_SELECTION + 1 > bars[0].length - 1 ? 0 : G_SELECTION + 1;
		var barSelect = bars.filter(function (d, i) { return i == newSelection; });
		highlightBar(barSelect);
		G_SELECTION = newSelection;
	}
}

// Function to bind actions to arrow keys
function bindArrowActions() {
	$(document).keydown( function (e) {
		if (e.which == 27) {
			escAction();
		}

		if (e.which == 37) {
			leftArrowAction();
		}

		if (e.which == 39) {
			rightArrowAction();
		}
	});
}

function barcodeYLabels(targetSvg, left, right) {
	var group = targetSvg.append('g')
							.attr('transform', 'rotate(-90)');
	group.append('text')
		 		.classed('axis_text', true)
			    .attr('x', -150)
			    .attr('y', 20)
				.attr('text-anchor', 'middle')
			    .text(left);

	group.append('text')
		 		.classed('axis_text', true)
			    .attr('x', -150)
			    .attr('y', 1080)
				.attr('text-anchor', 'middle')
			    .text(right);

}

// Function to draw barcode plot
function barcodePlot(targetDiv, data) {
	// if (wantWorm) {
	// 	if (dualPlot) { // Two plots with worms

	// 	} else { // Single plot with worm

	// 	}
	// } else {
	// 	if (dualPlot) { // Two plots without worm

	// 	} else { // Single plot without worm

	// 	}
	// }

	// Get dimension data
	var dim = divDim(targetDiv);

	// Find limits of dataset
	var limX = findLim(data, 'stat');
	var limY = {'min': 0, 'max': 1};

	var adj = (limX.max/2 - limX.min/2) * 0.05;

	// Get quantiles for data, create dummy scale for labeling
	var quantiles = getStatQuantiles(data);
	var labelScl = d3.scale.ordinal().domain(quantiles)
										.rangePoints([0, dim.pltw]);

	// Generate scalers
	var xScl = d3.scale.ordinal().domain(d3.range(dataBarcode.length))
								.rangePoints([0, dim.pltw]);
	var yScl = d3.scale.linear().domain([limY.min, limY.max])
								.range([0, dim.plth]);

	// Generate window and containers for plot
	var svgBarcode = targetDiv.append('svg')
								.classed('plot barcode', true);
	var plotWindow = svgBarcode.append('g')
								.classed('plot_window', true)
								.attr('transform', trans(G_MARG.left, G_MARG.top));

	var background = plotWindow.append('g')
								.classed('back barcode', true);

	var barContainer = plotWindow.append('g')
									.classed('bar_container', true);

	plotWindow.append('g').classed('front', true);

	// Filter data down to the subset selected
	data = data.filter(function (d, i) { return barcodeSubset.indexOf(i) > -1; });
	var bars = barContainer.selectAll('path')
							.data(data);

	// Draw pink background section
	var pinkRect = background.append('rect')
				.classed('back', true)
				.attr('x', 0)
				.attr('y', dim.plth * 0.975)
				.attr('width', xScl(barcodeQuantiles[0]))
				.attr('height', 0)
				.style('fill', 'pink');

	// Draw grey background section
	var greyRect = background.append('rect')
				.classed('back', true)
				.attr('x', xScl(barcodeQuantiles[0]))
				.attr('y', dim.plth * 0.975)
				.attr('width', xScl(barcodeQuantiles[1]) - xScl(barcodeQuantiles[0]))
				.attr('height', 0)
				.style('fill', 'lightgrey');

	// Draw blue background section
	var blueRect = background.append('rect')
				.classed('back', true)
				.attr('x', xScl(barcodeQuantiles[1]))
				.attr('y', dim.plth * 0.975)
				.attr('width', dim.pltw - xScl(barcodeQuantiles[1]))
				.attr('height', 0)
				.style('fill', 'lightblue');

	// Animate pink background section
		pinkRect.transition()
				.attr('y', dim.plth / 2)
				.attr('width', xScl(barcodeQuantiles[0]))
				.attr('height', dim.plth / 2 * 0.95)
				.style('fill', 'pink');

	// Animate grey background section
		greyRect.transition()
				.delay(60)
				.attr('y', dim.plth / 2)
				.attr('width', xScl(barcodeQuantiles[1]) - xScl(barcodeQuantiles[0]))
				.attr('height', dim.plth / 2 * 0.95)
				.style('fill', 'lightgrey');

	// Animate blue background section
		blueRect.transition()
				.delay(120)
				.attr('y', dim.plth / 2)
				.attr('width', dim.pltw - xScl(barcodeQuantiles[1]))
				.attr('height', dim.plth / 2 * 0.95)
				.style('fill', 'lightblue');

	//** OLD CODE FOR DRAWING BARS AS PATHS **//
	// Draw bars
	// bars.enter()
	// 	.append('path')
	// 	.classed('bars', true)
	// 	.attr('d', function (d) { return makeBarPath(d.stat, xScl, yScl); })
	// 	.on('mouseover', function (d) { barMouseOver(d3.select(this)); })
	// 	.on('mouseout', function (d) { barMouseOut(d3.select(this)); })
	// 	.style('stroke', 'black')
	// 	.style('stroke-width', '2');
	bars.enter()
		.append('rect')
		.attr('class', function (d, i ) { return 'bars'; }) // Keep as function for flexibility
		.attr('x', function (d, i) { return xScl(d.rank) - 1; })
		.attr('y', yScl(0.15))
		.attr('width', 2)
		.attr('height', dim.plth * 0.975 - yScl(0.15))
		.style('fill', 'black');
		// .on('mouseover', function (d, i) { barMouseOver(d3.select(this)); })
		// .on('mouseout', function (d) { barMouseOut(d3.select(this)); });

	// Add plot and axis labels
	// plotTitle(svgBarcode, 'Barcode Plot')
	barcodeYLabels(svgBarcode, barcodeLabels[0], barcodeLabels[1]);
	xAxis(svgBarcode, labelScl, dim.svgh, dim.svgw);
	xLabel(svgBarcode, barcodeStatName);
	
	// Bind actions to arrow keys
	bindArrowActions()
}
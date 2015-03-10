function mdsPlot(targetDiv, data) {
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
	var xScl = d3.scale.linear().domain([limX.min, limX.max])
								.rangePoints([0, dim.pltw]);
	var yScl = d3.scale.linear().domain([limY.min, limY.max])
								.range([0, dim.plth]);

	// Generate or select plot window
	if (d3.select('.mds').node() == null) {
		var svgMDS = targetDiv.append('svg')
								.classed('plot mds', true);

		var plotWindow = svgMDS.append('g')
								.classed('plot_window', true)
								.attr('transform', trans(G_MARG.top, G_MARG.left));
		var mdsContain = plotWindow.append('g')
									.classed('mds_container', true);

		plotWindow.append('g').classed('front', true);
	} else {
		var svgMDS = d3.select('.mds');
		var plotWindow = svgMDS.select('.plot_window');
		var mdsContain = plotWindow.select('.mds_container');
	}

	
}
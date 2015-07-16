// Global Constants
var G_MARG = {'top': 60, 'bottom': 60, 'left': 60, 'right': 20};
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

// Function to obtain the width and height of the svg as well as plotting area
function divDim(div, marg) {
	var marg = marg || G_MARG;
	var svgh = div.style('height');
	var plth = pxToNum(svgh) - marg.top - marg.bottom;
	var svgw = div.style('width');
	var pltw = pxToNum(svgw) - marg.left - marg.right;

	return {'svgh': svgh, 'svgw': svgw, 'plth': plth, 'pltw': pltw};
}

// Function to find the maximum and minimum values of a data array
function findLim(data, key) {
	var lim = d3.extent(data.map( function (d) { return d[key]; }));

	return { min: Number(lim[0]), max: Number(lim[1]) };
}

// Function to extract the numerical portion of a '#px' string
function pxToNum(str) {
	return Number(str.substr(0, str.length - 2));
}

// Function to generate the string for performing translation transforms
function trans(top, left) {
	return 'translate(' + top + ', ' + left + ')';
}

// Function to draw x axis
function xAxis(targetSvg, xScl, svgh, svgw, marg) {
	var marg = marg || G_MARG;
	var xAxis = d3.svg.axis().scale(xScl).orient('bottom');	
	
	var top = pxToNum(svgh) - marg.bottom;
	var xg = targetSvg.append('g')
							.attr('class', 'axis x')
							.attr('transform', trans(marg.left, top));
	xg.call(xAxis);
}

// Function to draw y axis
function yAxis(targetSvg, yScl, svgh, svgw, marg) {
	var marg = marg || G_MARG;
	var yAxis = d3.svg.axis().scale(yScl).orient('left');
	var yg = targetSvg.append('g')
			  				.attr('class', 'axis y')
			  				.attr('transform', trans(marg.left, marg.top));
	yg.call(yAxis);
}

// Function to create x axis label
function xLabel(svg, text, yoffset) {
	var svgh = pxToNum(svg.style('height'));
	var svgw = pxToNum(svg.style('width'));
	var yoff = yoffset || (svgh - 10);

	if (svg.select('.axis_text.x') != null) {
		svg.select('.axis_text.x').remove();
	}

  	svg.append('text')
  		.classed('axis_text x', true)
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
	var yoff = yoffset || 15;

	if (svg.select('.axis_text.y') != null) {
		svg.select('.axis_text.y').remove();
	}

 	svg.append('text')
 		.classed('axis_text y', true)
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


// Function to hide loading spinner
function hideLoad() {
  d3.select('.load_screen').style('display', 'none');
}

// Function to show loading spinner
function showLoad() {
  d3.select('.load_screen').style('display', 'block');
}

var margin = {top: 60, right: 10, bottom: 50, left: 60};
var svgDim = {width: 500, height: 500};
var circleRadius = 3.4;
var selectCount = 0;

var selectedSym = 'None';
var sPoints  = [];

// Colours for points on MA plot
var maCol = {
            'green': '#A8243E', 
            'red': '#5571A2', 
            'black': '#858585'
            };

String.prototype.printf = function (obj) {
  var useArguments = false;
  var _arguments = arguments;
  var i = -1;
  if (typeof _arguments[0] == "string") {
    useArguments = true;
  }
  if (obj instanceof Array || useArguments) {
    return this.replace(/\%s/g,
    function (a, b) {
      i++;
      if (useArguments) {
        if (typeof _arguments[i] == 'string') {
          return _arguments[i];
        }
        else {
          throw new Error("Arguments element is an invalid type");
        }
      }
      return obj[i];
    });
  }
  else {
    return this.replace(/{([^{}]*)}/g,
    function (a, b) {
      var r = obj[b];
      return typeof r === 'string' || typeof r === 'number' ? r : a;
    });
  }
};

// Timing functions
function beep() {
  console.time('Time');
}

function boop() {
  console.timeEnd('Time');
}

// Function to find the maxmimum and minimum values of a specific key
// in some array of objects.
function findLim(data, key) {
  var lim = d3.extent(data.map( function (d) { return d[key]; }));

  return { max: lim[1], min: lim[0] };
}

// Function to find x and y limits of MA plot
function findLimMA(data) {
  var logFCLim = findLim(data, 'LogFC');
  var avgExprLim = findLim(data, 'AvgExpr');

  return {
      'xMax': avgExprLim.max,
      'yMax': logFCLim.max,
      'xMin': avgExprLim.min,
      'yMin': logFCLim.min
      };
}

// Function to find the limit of data for dot plot
function findLimDot(data) {
  var valueLim = findLim(data, 'value');

  return { 'min': valueLim.min, 'max': valueLim.max };
}

// Function to round value to nth decimal place
function decRound(val, n) {
  return (Math.round(val * Math.pow(10, n))/Math.pow(10, n));
}


// Function to take log 2 of some number
function log2(n) {
  return (Math.log(n) / Math.log(2));
}

// Function to create path string from object
function makePath(data, xScale, yScale) {
  var pathStartX = String(xScale(data[0].x));
  var pathStartY = String(yScale(data[0].y));

  var path = 'M %s %s'.printf(pathStartX, pathStartY);
  
  for (i = 1; i < data.length; i++) {
    var x = String(xScale(data[i].x));
    var y = String(yScale(data[i].y));

    // Append next point to path
    path += ' L %s %s'.printf(x, y);
  }
  return path;
}

// Function to create x axis label
function xLabel(svg, text, yoffset) {
  yoff = yoffset || (svgDim.height - 10)
  svg.append('text')
        .attr('x', (svgDim.width)/2)
        .attr('y', svgDim.height - 10)
        .style('text-anchor', 'middle')
        .style('font-weight', 'bold')
        .style('font-size', 15)
        .text(text);
}

// Function to create y axis label
function yLabel(svg, text, yoffset) {
  yoff = yoffset || 20;
  svg.append('text')
    .attr('transform', 'rotate(-90)')
    .attr('y', yoff)
    .attr('x', 0 - (svgDim.height / 2))
    .style('text-anchor', 'middle')
    .style('font-weight', 'bold')
    .style('font-size', 15)
    .text(text);
}

// Function to scale value towards -Inf
function limScaleLower(n, factor) {
  f = factor || 0.05;
  f = (f > 1) ? f - 1 : f;

  return ( (n < 0) ? n * (1 + f) : n * (1 - f) );
}

// Function to scale value towards Inf
function limScaleUpper(n, factor) {
  f = factor || 0.05;
  f = (f > 1) ? f - 1 : f;

  return ( (n < 0) ? n * (1 - f) : n * (1 + f) );
}

// Function to display dot plot in secondary window
function toggleDot() {
  var svgDot = d3.select('.svg_dot');
  var svgSA = d3.select('.svg_sa');
  var divDot = d3.select('.plot_dot_container');
  var divSA = d3.select('.plot_sa_container');

  svgDot.style('display', 'block');
  divDot.style('pointer-events', 'auto');

  svgSA.style('display', 'none');
  divSA.style('pointer-events', 'none');
}

// Function to toggle display SA plot in secondary window
function toggleSA() {
  var svgDot = d3.select('.svg_dot');
  var svgSA = d3.select('.svg_sa');
  var divDot = d3.select('.plot_dot_container');
  var divSA = d3.select('.plot_sa_container');

  svgDot.style('display', 'none');
  divDot.style('pointer-events', 'none');

  svgSA.style('display', 'block');
  divSA.style('pointer-events', 'auto');
}

// Function to toggle tooltip
function toggleToolTipMA() {
  tooltip = d3.select('.tooltip_ma');
  line = d3.select('.lines_ma').select('*');

  if (tooltip.html() == '') {
    return;
  }

  if (tooltip.style('opacity') == 1) {
    tooltip.style('opacity', 0);
    line.style('opacity', 0);
  } else {
    tooltip.style('opacity', 1);
    line.style('opacity', 1);
  }
}

// Function to hide loading spinner
function hideSpinner () {
  d3.select('.loading_div').style('display', 'none');
  d3.select('.spinner').style('display', 'none');
}

// Function to show loading spinner
function showSpinner () {
  d3.select('.loading_div').style('display', 'block');
  d3.select('.spinner').style('display', 'block');
}

// Function to set up button tray in HTML document
function setupButtonTray() {

  // Function to add spinner icon
  // Sourced from http://tobiasahlin.com/spinkit/
  function addSpinner(target) {
    var spDiv = target.append('div');
    spDiv.attr('class', 'spinner')
        .style('display', 'none');

    spDiv.append('div')
        .attr('class', 'bounce1');

    spDiv.append('div')
        .attr('class', 'bounce2');

    spDiv.append('div')
        .attr('class', 'bounce3');
  }

  var bodySelect = d3.select('body');

  var topBar = bodySelect.append('div')
            .attr('class', 'top_bar')
            .style('height', '50px')
            .style('width', '1040px');

  var buttonTrayLeft = topBar.append('div')
              .attr('class', 'button_tray')
              .style('position', 'relative')
              .style('height', '100%')
              .style('width', '300px')
              .style('float', 'left');

  var buttonTrayRight = topBar.append('div')
              .attr('class', 'button_tray')
              .style('position', 'relative')
              .style('height', '100%')
              .style('width', '300px')
              .style('float', 'right');

  // Button to toggle visibility of MA plot tooltip
  buttonTrayLeft.append('button')
        .attr('class', 'ma_tooltip_button')
        .attr('type', 'button')
        .attr('onclick', 'toggleToolTipMA()')
        .html('Toggle Tooltip')
        .style('float', 'left')

  // Button to toggle visibility MA plot insignificant points
  buttonTrayLeft.append('button')
        .attr('class', 'ma_insig_button')
        .attr('type', 'button')
        .attr('onclick', 'toggleInsigMAWrap(showSpinner, hideSpinner)')
        .html('Signficant Only')
        .style('float', 'left')

  // Add spinning loading icon
  addSpinner(buttonTrayLeft);

  // Button to switch to SA plot on secondary window
  buttonTrayRight.append('button')
      .attr('class', 'sa_plot_button')
      .attr('type', 'button')
      .attr('onclick', 'toggleSA()')
      .html('SA Plot')
      .style('float', 'right');

  // Button to switch to cpm plot on secondary window
  buttonTrayRight.append('button')
      .attr('class', 'dot_plot_button')
      .attr('type', 'button')
      .attr('onclick', 'toggleDot()')
      .html('CPM Plot')
      .style('float', 'right');
}

// Function to set up plot windows
function setupPlots() {
  
  var bodySelect = d3.select('body');

  // Setup main plot container
  var plotSelect = bodySelect.append('div')
          .attr('class', 'main_plots')
          .style('height', '500px')
          .style('width', '1040px')
          .style('overflow', 'hidden');

  var leftTrans = String(margin.left);
  var topTrans = String(margin.top);
  var trans = 'translate(%s, %s)'.printf(leftTrans, topTrans);

  function setupMA() {
    var divMA = plotSelect.append('div')
                .attr('class', 'plot_ma_container')
                .style('height', '100%')
                .style('width', svgDim.width + 'px')
                .style('float', 'left');

    var svgMA = divMA.append('svg')
              .attr('class', 'svg_ma')
              .attr('height', svgDim.height)
              .attr('width', svgDim.width)
              .style('float', 'left');

    var windowMA = svgMA.append('g')
              .attr('class', 'window_ma')
              .attr('transform', trans);

    windowMA.append('g').attr('class', 'circles_ma');

    windowMA.append('g').attr('class', 'lines_ma');

    windowMA.append('g').attr('class', 'front_ma')
              .append('circle')
              .attr('class', 'front_circle_ma')
              .style('opacity', 0);

    plotSelect.append('div')
                    .attr('class', 'tooltip_ma')
                    .style('opacity', 0);
  }
  
  function addSeparator() {
      plotSelect.append('div')
              .attr('class', 'plot_separator')
              .style('height', '100%')
              .style('width', '40px')
              .style('float', 'left');
  }

  function setupDot() {
    var divDot = plotSelect.append('div')
              .attr('class', 'plot_dot_container')
              .style('height', '100%')
              .style('width', svgDim.width + 'px')
              .style('position', 'relative')
              .style('float', 'left')
              .style('left', '0px');

    var svgDot = divDot.append('svg')
            .attr('class', 'svg_dot')
            .attr('height', svgDim.height)
            .attr('width', svgDim.width)
            .style('float', 'left');

    var windowDot = svgDot.append('g')
            .attr('class', 'window_dot')
            .attr('transform', trans);
  }

  function setupSA() {
    var divSA = plotSelect.append('div')
              .attr('class', 'plot_sa_container')
              .style('height', '100%')
              .style('width', svgDim.width + 'px')
              .style('pointer-events', 'none')
              .style('position', 'relative')
              .style('float', 'left')
              .style('top', '-500px')
              .style('left', '540px');

    var svgSA = divSA.append('svg')
              .attr('class', 'svg_sa')
              .attr('height', svgDim.height)
              .attr('width', svgDim.width)
              .style('float', 'left')
              .style('display', 'none');

    var windowSA = svgSA.append('g')
            .attr('class', 'window_sa')
            .attr('transform', trans);
  }

  setupMA();
  addSeparator();
  setupDot();
  setupSA();

}

function setupSearchTray() {
  var bodySelect = d3.select('body');
  var uiWidget = bodySelect.append('p').attr('class', 'ui-widget')

  uiWidget.append('label')
      .attr('for', 'geneSym')
      .html('Gene Symbol: ');

  uiWidget.append('input')
      .attr('type', 'text')
      .attr('id', 'geneSym');

  uiWidget.append('button')
      .attr('id', 'geneSearch')
      .attr('onclick', 'findGeneAndHighlight($(\'#geneSym\').val())')
      .html('Highlight!');

  // jquery autocomplete code
  $('#geneSym').keyup(function(event){
        if(event.keyCode == 13 && $('#geneSym').val() != selectedSym){
            $('#geneSearch').click();
        }
    });
}

// Function to create MA plot
function maPlot(svg, data) {
  
  function tagMA(d) {
    return (d.col == 'black') ? 'ma_' + d.symb + ' insig' : 'ma_' + d.symb ;
  }

  // Get limits for x and y values
  var limits = findLimMA(data);
  
  var xDomMin = limits.xMin;
  var xDomMax = limits.xMax;
  var yDomMin = limits.yMin;
  var yDomMax = limits.yMax;

  var xRangeMax = svgDim.width - margin.right - margin.left;
  var yRangeMax = svgDim.height - margin.top - margin.bottom;

  // Generate scalers
  var xScale = d3.scale.linear()
              .domain([xDomMin, xDomMax])
              .range([0, xRangeMax]);

  var yScale = d3.scale.linear()
            .domain([yDomMin, yDomMax])
            .range([yRangeMax, 0]);

  // Rescale such that there is 10 pixel space between the center
  // of any point and the axis, prevents intersection of axis and points.
  var xScaleFactor = xScale(1) - xScale(0);
  var sFactorX = 10/xScaleFactor;
  var yScaleFactor = yScale(0) - yScale(1);
  var sFactorY = 10/yScaleFactor;

  xDomMin = limits.xMin - sFactorX;
  xDomMax = limits.xMax + sFactorX;
  yDomMin = limits.yMin - sFactorY;
  yDomMax = limits.yMax + sFactorY;

  xScale = d3.scale.linear()
            .domain([xDomMin, xDomMax])
            .range([0, xRangeMax]);

  yScale = d3.scale.linear()
            .domain([yDomMin, yDomMax])
            .range([yRangeMax, 0]);
  
  var svgMA = d3.select('.svg_ma');

  var circleContainerMA = d3.select('.circles_ma');

  var circleMA = circleContainerMA.selectAll('circle')
                                  .data(data);

  var mouseOverEnabled = true;

  circleMA.enter()
      .append('circle')
      .attr('r', function (d) {
        if (d.col == 'black') {
          return (circleRadius * 0.6);
        } else {
          return circleRadius;
        }
      })
      .attr('cx', function (d) { return xScale(d.AvgExpr); })
      .attr('cy', function (d) { return yScale(d.LogFC); })
      .attr('class', function (d) { tagMA(d); })
      .attr('status', 0)
      .style('fill', function (d) { return maCol[d.col]; })
      .style('opacity', 1)
      .on('click', function (d, i) {
        var circle = d3.select(this);

        highlightPointMA(circle);
      })
      .on('mouseover', function (d) {
        if (!mouseOverEnabled) {
          return;
        }
        var circle = d3.select(this);
        var circleData = circle.data()[0];

        mouseOverMA(circle, circleData);
      })
      .on('mouseout', function (d) {
        if (!mouseOverEnabled) {
          return;
        }
        var circle = d3.select(this);

        mouseOutMA(circle);
      });

  var guidelinesMA = svg.append('g')
                          .attr('class', 'baseline_container');

  var divMA = d3.select('.plot_ma_container');
  divMA.append('div')
        .attr('class', 'loading_div')
        .style('display', 'none');

  for (var i = -1; i <= 1; i++) {
    var leftEdge = String(xScale(xDomMin));
    var rightEdge = String(xScale(xDomMax));
    var yCoord = String(yScale(i));

    var pathStr = "M %s %s L %s %s".printf(leftEdge, yCoord, rightEdge, yCoord)
    var path = guidelinesMA.append('path')
                            .attr('d', pathStr)
                            .attr('stroke-width', '1')
                            .style("stroke-dasharray", ("3, 3"));

    if (i==0) {
      path.attr('stroke', 'blue');
    } else {
      path.attr('stroke', 'lightblue');
    }
  };

  // create title
  svg.append('g')
      .attr('class', 'title_ma')
      .append('text')
      .attr('x', (svgDim.width / 2) - 50)             
      .attr('y', 0 - (margin.top / 2))
      .attr('text-anchor', 'middle')  
      .style('font-size', '16px') 
      .style('text-decoration', 'underline')  
      .text('MA Plot');

  // setup x
  var xAxis = d3.svg.axis().scale(xScale).orient('bottom');

  // x-axis
  var yTrans = String(svgDim.height - margin.top - margin.bottom);
  var trans = 'translate(0, %s)'.printf(yTrans);
  svg.append('g')
     .attr('class', 'axis x')
     .attr('transform', trans)
     .call(xAxis);

  // x-axis text
  xLabel(svgMA, 'Average Expression (LogCPM)');

      // setup y
  var yAxis = d3.svg.axis().scale(yScale).orient('left');

  // y-axis
  svg.append('g')
      .attr('class', 'axis y')
      .call(yAxis);

  // y-axix text
  yLabel(svgMA, 'LogFC');

  // Function to highlight a selected gene
  findGeneAndHighlight = function (geneSym) {
    if (availableTags.indexOf(geneSym) != -1) {

      highlightMAWrap(geneSym);

      var circle = d3.select('.' + 'sa_' + geneSym);
      var allCircles = d3.select('.circles_sa').selectAll('circle');
      var circleData = circle.data()[0];

      highlightPointSA(allCircles, circle, circleData);       
    }
  }

  highlightMAWrap = function (geneSym) {
      var circle = d3.select('.ma_' + geneSym);

      highlightPointMA(circle);
  }

  // Function to highlight a particular point on MA plot
  highlightPointMA = function (selectedPoint) {
    var data = selectedPoint.data()[0];

    var svgDot = d3.select('.svg_dot');
    var tooltipMA = d3.select('.tooltip_ma');
    var frontCircle = d3.select('.front_circle_ma');

    selectedSym = data.symb; // global selectSym

    if (d3.select('.lines_ma').select('path')) {
      d3.select('.lines_ma').select('path').remove();
    }

    if (selectedPoint.attr('status') == 0) {

      mouseOverEnabled = false; // Global mouseOverEnabled

      for (i=0; i<sPoints.length; i++) {
        sPoints.pop()
            .attr('status', 0);
      }
      sPoints.push(selectedPoint);
      selectedPoint.attr('status', 1);

      var lineStart = { 
              x: xScale(data.AvgExpr), 
              y: yScale(data.LogFC) 
              };

      linePath = 'M ' + lineStart.x + ' ' + lineStart.y + 
            ' L 322 64';

      tooltipMA.style('opacity', 1);

      var symb = String(data.symb).bold();
      var avgexp = String(data.AvgExpr);
      var logfc = String(data.LogFC);
      var pval = String(data.pval);

      if (pval < 0.0001) {
          pval = '<0.0001';
      }

      tooltipMA.html( symb + '<br />' + 
          'AvgExpr: ' + avgexp + '<br />' +
          'LogFC: ' + logfc + '<br />' +
          'P-Value: ' + pval)

      tooltipMA.style('left', (svgDim.width - 110) + 'px')
                .style('top', (margin.top + 7 + 50) + 'px');

      var linesMA = d3.select('.lines_ma');
      linesMA.append('path')
                .attr('d', linePath)
                .attr('id', data.symb + '_line')
                .style('stroke', 'black')
                .style('stroke-dasharray', ('3, 3'))
                .style('color', 'lightblue');

      frontCircle.attr('r', circleRadius + 2)
                  .attr('cx', xScale(data.AvgExpr))
                  .attr('cy', yScale(data.LogFC))
                  .attr('stroke', 'white')
                  .attr('stroke-width', '2')
                  .style('fill', maCol[data.col])
                  .style('opacity', 1);

      var tooltipDot = d3.select('tooltip_dot');
      var windowDot = d3.select('.window_dot');

      // (Re)draw dot plot for gene
      svgDot.selectAll('.dotAxis').remove();
      svgDot.selectAll('text').remove();
      tooltipDot.remove();
      windowDot.selectAll('*').remove();

      dotPlot(windowDot, data.GeneID);

    } else if (selectedPoint.attr('status') == 1) {
      
      mouseOverEnabled = true; // Global mouseOverEnabled

      tooltipMA.style('opacity', 0);

      frontCircle.style('opacity', 0);

      selectedPoint.attr('status', 0);
    }
  }

  // Function to highlight a particular point on MA plot when hovered over
  mouseOverMA = function (selectedPoint, data) {
    
    var svgDot = d3.select('.svg_dot');
    var tooltipMA = d3.select('.tooltip_ma');
    
    selectedSym = data.symb; // global selectSym

    if (d3.select('.lines_ma').select('path')) {
      d3.select('.lines_ma').select('path').remove();
    }

    var lineStart = { 
            x: xScale(data.AvgExpr), 
            y: yScale(data.LogFC) 
            };

    linePath = 'M ' + lineStart.x + ' ' + lineStart.y + 
          ' L 322 64';

    tooltipMA.style('opacity', 1);

    var symb = String(data.symb).bold();
    var avgexp = String(data.AvgExpr);
    var logfc = String(data.LogFC);
    var pval = String(data.pval);

    if (pval < 0.0001) {
        pval = '<0.0001';
    }

    tooltipMA.html( symb + '<br />' + 
        'AvgExpr: ' + avgexp + '<br />' +
        'LogFC: ' + logfc + '<br />' +
        'P-Value: ' + pval)

    tooltipMA.style('left', (svgDim.width - 110) + 'px')
              .style('top', (margin.top + 7 + 50) + 'px');

    d3.select('.lines_ma').append('path')
              .attr('d', linePath)
              .attr('id', data.symb + '_line')
              .style('stroke', 'black')
              .style('stroke-dasharray', ('3, 3'))
              .style('color', 'lightblue');

    d3.select('.front_circle_ma').attr('r', circleRadius + 2)
          .attr('cx', xScale(data.AvgExpr))
          .attr('cy', yScale(data.LogFC))
          .attr('stroke', 'white')
          .attr('stroke-width', '2')
          .style('fill', maCol[data.col])
          .style('opacity', 1);

    var windowDot = d3.select('.window_dot');
    var tooltipDot = d3.select('.tooltip_dot');

    // (Re)draw dot plot for gene
    svgDot.selectAll('.dotAxis').remove();
    svgDot.selectAll('text').remove();
    tooltipDot.remove();
    windowDot.selectAll('*').remove();

    dotPlot(windowDot, data.GeneID);
  }

  mouseOutMA = function (selectedPoint) {
    var tooltipMA = d3.select('.tooltip_ma');
    var frontCircle = d3.select('.front_circle_ma');

    var svgDot = d3.select('.svg_dot');
    var tooltipDot = d3.select('.tooltip_dot');
    var windowDot =d3.select('.window_dot');
    
    selectedSym = data.symb; // global selectSym

    if (d3.select('.lines_ma').select('path')) {
      d3.select('.lines_ma').select('path').remove();
    }

    // (Re)draw dot plot for gene
    svgDot.selectAll('.dotAxis').remove();
    svgDot.selectAll('text').remove();
    tooltipDot.remove();
    windowDot.selectAll('*').remove();

    mouseOverEnabled = true; // Global mouseOverEnabled

    tooltipMA.style('opacity', 0);

    frontCircle.style('opacity', 0);

    selectedPoint.attr('status', 0);
  }

  // Wrapper for toggle insiginficant points
  toggleInsigMAWrap = function (show, hide) {
    setTimeout(function () {show();}, 0);
    setTimeout(function () {toggleInsigMA( hide ); }, 0);
  }

  // Function to toggle visibility of insignificant points
  toggleInsigMA = function (hide) {

    var points = d3.selectAll('.insig');

    var status = points[0][0].style.opacity;
    if (Number(status) > 0) {
      points.style('opacity', 0)
          .attr('clickable', 0)
          .attr('pointer-events', 'none');
    } else {
      points.style('opacity', 1)
          .attr('clickable', 1)
          .attr('pointer-events', 'auto');
    }
    setTimeout( function() { hide(); }, 500);
  }

  // toggleInsigMAWrap();
  // toggleInsigMAWrap();
}

// Function to make dot plot
function dotPlot(svg, geneID) {
  var rectSize = circleRadius * 2
  // Get limits for x values
  var limY = findLimDot(dataDot[geneID]);

  // Create scaling objects
  var xRangeMax = svgDim.width - margin.left - margin.right;
  var yRangeMax = svgDim.height - margin.top - margin.bottom;

  // Note the the inversion of the Y range produce graph consistent
  // with conventional mathematical coordinates.
  var xScale = d3.scale.ordinal()
            .domain([1, 2])
            .rangePoints([0, yRangeMax], 1);
  var yScale = d3.scale.linear()
            .domain([limY.min, limY.max])
            .range([yRangeMax, 0]);

  // Rescale such that points do not intersect plot axis
  var yScaleFactor = yScale(0) - yScale(1);
  var sFactorY = 10/yScaleFactor;

  var yDomMin = limY.min - sFactorY;
  var yDomMax = limY.max + sFactorY;

  var yScale = d3.scale.linear()
            .domain([yDomMin, yDomMax])
            .range([yRangeMax, 0]);

  // Create container for circles
  var circleContainerDot = svg.append('g')
                  .attr('class', 'rect_dot');

  var circleDot = circleContainerDot.selectAll('rect')
                    .data(dataDot[geneID]);

  var plotSelect = d3.select('.main_plots');

  var tooltipDot = plotSelect.append('div')
                .attr('class', 'tooltip_dot')
                .style('opacity', 0);

  circleDot.enter().append('rect')
      .attr('width', rectSize)
      .attr('height', rectSize)
      .attr('x', function (d) {
        return xScale(d.group) - rectSize / 2; 
      })
      .attr('y', function (d) {
        return yScale(d.value) - rectSize / 2;
      })
      .on('mouseover', function (d) {
        var thisDot = d3.select(this);
        var newX = Number(thisDot.attr('x')) - rectSize / 2;
        var newY = Number(thisDot.attr('y')) - rectSize / 2;
        var newH = Number(thisDot.attr('height')) * 2;
        var newW = Number(thisDot.attr('height')) * 2;
        thisDot.attr('x', newX)
            .attr('y', newY)
            .attr('height', newH)
            .attr('width', newW);

        tooltipDot.style('opacity', 1);

        cpm = decRound(d.value, 2);
        sample = d.sample.bold();

        // Tooltips spawn to the left of point hovered
        tooltipDot.html(sample + '<br />' + cpm)
              .style('left', (d3.event.pageX - 64) + 'px')
              .style('top', (d3.event.pageY - 5) + 'px');
      })
      .on('mouseout', function (d) {
        // +(str) casts strings into floats
        var thisDot = d3.select(this);
        var newX = Number(thisDot.attr('x')) + rectSize / 2;
        var newY = Number(thisDot.attr('y')) + rectSize / 2;
        var newH = Number(thisDot.attr('height')) / 2;
        var newW = Number(thisDot.attr('height')) / 2;

        thisDot.attr('x', newX)
            .attr('y', newY)
            .attr('height', newH)
            .attr('width', newW);

        tooltipDot.style('opacity', 0);
      });

  // create title
  svg.append('g')
      .attr('class', 'title_dot')
      .append('text')
      .attr('x', (svgDim.width / 2))             
      .attr('y', 0 - (margin.top / 2))
      .attr('text-anchor', 'middle')  
      .style('font-size', '16px') 
      .style('text-decoration', 'underline')  
      .text('Sample LogCPM');

  var svgDot = d3.select('.svg_dot');

  // setup x
  var xAxis = d3.svg.axis().scale(xScale).orient('bottom');

  // x-axis
  var yTrans = svgDim.height - margin.top - margin.bottom;
  svg.append('g')
      .attr('class', 'x axis dot')
      .attr('transform', 'translate(0, '+ yTrans + ')')
      .call(xAxis);

  xLabel(svgDot, 'Group');

      // setup y
  var yAxis = d3.svg.axis().scale(yScale).orient('left');

  // y-axis
    svg.append('g')
        .attr('class', 'y axis dot')
        .call(yAxis);

    yLabel(svgDot, 'LogCPM', 12);
}


// Function to findthe limit of data for SA plot
function findLimSA(data) {

  // The x axis will be average expression
  var xLim = findLim(data, 'AvgExpr');
  // The y axis will be the Log2Sigma values
  var yLim = findLim(data, 'Log2Sigma');

  return { 
      xMax: xLim.max, 
      xMin: xLim.min,
      yMax: yLim.max, 
      yMin: yLim.min
      };
}


// Function to create SA plot
  function saPlot(svg, data, circleRadius) {
    // Get limit values for x and y (AvgExpr and Log2Sigma)
    var limits = findLimSA(data);

    // Create scaling objects
    var xMax = limits.xMax;
    var xMin = limits.xMin;
    var yMax = limits.yMax;
    var yMin = limits.yMin;

    var xRangeMax = svgDim.width + circleRadius - margin.right - 
            margin.left;
    var yRangeMax = svgDim.height - circleRadius - 2 - margin.top - 
            margin.bottom;

    // Note the the inversion of the Y range produce graph consistent
    // with conventional mathematical coordinates.
    var xScale = d3.scale.linear()
            .domain([xMin, xMax])
            .range([0, xRangeMax]);
    var yScale = d3.scale.linear()
            .domain([yMin, yMax])
            .range([yRangeMax, 0]);


    var svgSA = d3.select('.svg_sa');
    var circleSAContainer = svg.append('g')
                  .attr('class', 'circles_sa');
    var circleSA = circleSAContainer.selectAll('circle')
                    .data(data);

    circleSA.enter().append('circle')
          .attr('r', circleRadius)
          .attr('cx', function (d) { return xScale(d.AvgExpr); })
          .attr('cy', function (d) { return yScale(d.Log2Sigma); })
          .attr('class', function (d) { return 'sa_' + d.symb; })
          .style('fill', maCol['black']);

    var windowSA = d3.select('.window_sa');
    windowSA.append('g').attr('class', 'front_sa')
          .append('circle')
          .attr('class', 'front_circle_sa')
          .style('opacity', 0);

    tagwise_path = makePath(dataSA, xScale, yScale);
    svg.append('path')
        .attr('class', 'tagwise_sa')
        .attr('d', tagwise_path)
        .attr('stroke', 'red')
        .attr('stroke-width', '2')
        .attr('fill', 'none');

    /**
     * Apparently nobody cares about the trendline for the prior
     * easy to reintegrate into code is necessary
     */
    // var sum = 0;
    // for (var i = dataSA.length - 1; i >= 0; i--) {
    //   sum += dataSA[i].y;
    // };
    
    // var meanSA = sum/dataSA.length;

    // yTrend = yScale(meanSA)
    // windowWidth = svgDim.width + circleRadius - margin.right - margin.left;
    // trend_path = 'M 0 ' + yTrend + ' L ' + windowWidth + ' ' + yTrend;
    // svg.append('path')
    //     .attr('class', 'trend_sa')
    //     .attr('d', trend_path)
    //     .attr('stroke', 'blue')
    //     .attr('stroke-width', '2')
    //     .attr('fill', 'none');

    // create title
    svg.append('g')
      .attr('class', 'title_sa')
       .append('text')
        .attr('x', (svgDim.width / 2) - 50)             
          .attr('y', 0 - (margin.top / 2))
          .attr('text-anchor', 'middle')  
          .style('font-size', '16px') 
          .style('text-decoration', 'underline')  
          .text('SA Plot');

    // setup x
    var xAxis = d3.svg.axis().scale(xScale).orient('bottom');

    // x-axis
    trans = 'translate(0, '+ (svgDim.height - margin.top - margin.bottom) + ')'
    svg.append('g')
       .attr('class', 'axis x sa')
       .attr('transform', trans)
       .call(xAxis);

    // x-axis text
    xLabel(svgSA, 'Average Expression (LogCPM)');

        // setup y
    var yAxis = d3.svg.axis().scale(yScale).orient('left');

    // y-axis
      svg.append('g')
          .attr('class', 'axis y sa')
          .call(yAxis);

      // y-axis text
      yLabel(svgSA, 'log2(Sigma)', 12);

      // Function to highlight a particular point on SA plot
    highlightPointSA = function (allCircles, selectedPoint, data) {
      cRad = selectedPoint.attr('r');

      selectedPoint.attr('r', 4)
              .style('color', 'red');

      d3.select('.front_circle_sa').attr('r', 5)
              .attr('cx', xScale(data.AvgExpr))
              .attr('cy', yScale(data.Log2Sigma))
              .attr('stroke', 'white')
              .attr('stroke-width', '2')
              .style('fill', 'red')
              .style('opacity', 1);
    
    }
  }

function setupPage() {
  var bodySelect = d3.select('body');
  bodySelect.attr('bgcolor', '#FAFAFA');

  setupButtonTray();
  setupPlots();
  setupSearchTray();

  var windowMA = d3.select('.window_ma');
  maPlot(windowMA, dataMA);

  var windowSA = d3.select('.window_sa');
  saPlot(windowSA, dataMA, circleRadius * 0.6);
}

// Autocomplete code
$(function() {
  $( "#geneSym" ).autocomplete({
    source: availableTags
  });
  $( "#geneSym" ).autocomplete( "option", "autoFocus", true );
  $( "#geneSym" ).autocomplete( "option", "minLength", 3 );
});

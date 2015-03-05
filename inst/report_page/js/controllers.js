var app = angular.module('cellscape', ['ngGrid']);

/* -----------------------------------------------------
Directive to show model dialog - from http://jsbin.com/aDuJIku/2/edit
----------------------------------------------------- */
app.directive('modalDialog', function() {
  return {
    restrict: 'E',
    scope: {
      show: '='
    },
    replace: true, // Replace with the template below
    transclude: true, // we want to insert custom content inside the directive
    link: function(scope, element, attrs) {
      scope.dialogStyle = {};
      if (attrs.width)
        scope.dialogStyle.width = attrs.width;
      if (attrs.height)
        scope.dialogStyle.height = attrs.height;
      scope.hideModal = function() {
        scope.show = false;
      };
    },
    template: "<div class='ng-modal' ng-show='show'><div class='ng-modal-overlay' ng-click='hideModal()'></div><div class='ng-modal-dialog' ng-style='dialogStyle'><div class='ng-modal-close' ng-click='hideModal()'>X</div><div class='ng-modal-dialog-content' ng-transclude></div></div></div>"
  };
});

/* -----------------------------------------------------
Factory used to emit and receive messages between controllers - from https://gist.github.com/turtlemonvh/10686980/038e8b023f32b98325363513bf2a7245470eaf80
----------------------------------------------------- */
app.factory('msgBus', ['$rootScope', function($rootScope) {
    var msgBus = {};
    msgBus.emitMsg = function(msg, data) {
        data = data || {};
        $rootScope.$emit(msg, data);
    };
    msgBus.onMsg = function(msg, func, scope) {
        var unbind = $rootScope.$on(msg, func);
        if (scope)
            scope.$on('$destroy', unbind);
    };
    return msgBus;
}]);

/* -----------------------------------------------------
Factory used for page navigation
----------------------------------------------------- */
app.factory('PageFactory', function() {
	return { currentPage:'HomePage' };
// 	return { currentPage:'DiffExpPage' };
});

/* -----------------------------------------------------
DatasetService is used by multiple controllers to access a singleton Dataset instance
----------------------------------------------------- */
// Note that by assigning getDataset() function to a getDataset variable, we avoid running
// the function multiple times if multiple controllers are calling it.
app.service('DatasetService', function() {
	var self = this;
	
	var getDataset = function() {
		showLoadingIcon();
		new Dataset(function(dataset) {
			//console.log("new dataset", dataset);	// check to see how often this function is called
			self.dataset = dataset;
			hideLoadingIcon();
			return self.dataset;
		});
	};
	
	self.topTable = function(x) {
		return [{"geneSymbol":x, "geneId":"id", "logFC":0, "adjP":0}];
	};
	
	self.getDataset = getDataset();
	self.selectedDatasetName;
});

app.service('SampleDataService', function() {
	var self = this;
	self.sampleTable = {};
	
	var getSampleTable = function(datasetName, callback) {
		showLoadingIcon();
		new SampleTable(datasetName, function(sampleTable) {
			hideLoadingIcon();
			self.sampleTable[datasetName] = sampleTable;
			callback(sampleTable);
		});
	};
	
	self.getSampleTable = function(datasetName, callback) {
		if (datasetName in self.sampleTable) {
			callback(self.sampleTable[datasetName]);
		} else {
			getSampleTable(datasetName, callback);
		}
	};
});

/* -----------------------------------------------------
Home page controller
----------------------------------------------------- */
app.controller('HomePageController', ['$scope', 'PageFactory', 'DatasetService', function ($scope, PageFactory, DatasetService) {
	$scope.pageFactory = PageFactory;
	DatasetService.getDataset;	// call this once here to run getDataset() method of DatasetService once, so that all other controllers can use DatasetService and its dataset instance without calling this again
}]);

/* -----------------------------------------------------
Dataset Browse page controller
----------------------------------------------------- */
app.controller('DatasetBrowsePageController', ['$scope', 'msgBus', 'PageFactory', 'DatasetService', function ($scope, msgBus, PageFactory, DatasetService) {	
	$scope.pageFactory = PageFactory;
	$scope.datasetService = DatasetService;
	$scope.tableGrid = { data: 'datasetService.dataset.datasetsTable',
								enableCellSelection: true,
								enableRowSelection: false,
								columnDefs:[{field:'name', cellTemplate:'<div class="ngCellText" ng-class="col.colIndex()"><a ng-click="showSampleInfo(row.getProperty(\'name\'));" href="#">{{row.getProperty("name")}}</a></div>'},
											{field:'type', width:80},
											{field:'species', width:80},
											{field:'description', width:400, cellTemplate:'<div class="ngCellText" ng-class="col.colIndex()" ng-click="editTableCell(row.entity, row.getProperty(col.field), col.field)">{{row.getProperty(col.field)}}</div>'},
											{field:'actions', cellTemplate:'<div class="ngCellText" ng-class="col.colIndex()"><a ng-click="editDataset(row.getProperty(\'name\'))" href="#">edit</a> &#47; <a ng-click="deleteDataset(row.getProperty(\'name\'))" href="#">delete</a></div>'}]
						};
	$scope.showDatasetEdit = false;
	$scope.selectedDatasetProperties = {};
	$scope.newDatasetProperties = {};
	
// 	$scope.$on('ngGridEventEndCellEdit', function(event) {
// 		console.log(event.targetScope.row.entity);
// 	}, $scope);
  	$scope.editDataset = function (datasetName) 
  	{
console.log('######', DatasetService.dataset.allSpecies);
  		// show the dialog for editing dataset properties
  		var table = $scope.datasetService.dataset.datasetsTable;
  		for (var i=0; i<table.length; i++) {
  			if (table[i]['name']==datasetName)
  				$scope.selectedDatasetProperties = {'name': datasetName, 'species': table[i]['species']};
  		}
		if (!$scope.$$phase) $scope.$apply();
  		$scope.showDatasetEdit = true;
    };
  
  	$scope.updateDatasetInfo = function()
  	{
  		console.log(JSON.stringify($scope.newDatasetProperties));
  	}
  	
  	// function to rename an existing dataset
	$scope.renameDataset = function(oldname)
	{
		var newname = prompt("Enter a new name for the dataset", oldname);
		if (newname==null || oldname==newname) return;
		showLoadingIcon();
		$scope.datasetService.dataset.renameDataset(oldname, newname, 
			function() { 
				$scope.$apply();
			},
			function(error) {
				alert("Server error: " + error);
			},
			function() {
				hideLoadingIcon();
		});
	}

	$scope.deleteDataset = function(datasetName)
	{
		if (confirm('Are you sure you want to delete the dataset named "' + datasetName + '"?' )==true) {
			showLoadingIcon();
			$scope.datasetService.dataset.deleteDataset(datasetName, 
				function() { 
					$scope.$apply();
				},
				function(error) {
					alert("Server error: " + error);
				},
				function() {
					hideLoadingIcon();
			});
		}
	}

	$scope.showSampleInfo = function(datasetName)
	{
		$scope.pageFactory.currentPage = 'DatasetSamples';
		msgBus.emitMsg('ShowSamples', {	'datasetName':datasetName } );
	}
}]);

/* -----------------------------------------------------
Dataset Samples page controller
----------------------------------------------------- */
app.controller('DatasetSamplesPageController', ['$scope', 'msgBus', 'PageFactory', 'DatasetService', 'SampleDataService',
	function ($scope, msgBus, PageFactory, DatasetService, SampleDataService) 
{	
	$scope.pageFactory = PageFactory;
	$scope.datasetService = DatasetService;
	$scope.sampleDataService = SampleDataService;
	$scope.selectedDatasetName;
	$scope.selectedTableCell;
    $scope.selectedTableRow;
    $scope.selectedTableColumn;
    $scope.sampleTable = {};
	$scope.colDefs = [];
	$scope.tableGrid = { data: 'sampleTable.table', 
						enableCellSelection: true,
						enableRowSelection: false,
						columnDefs: 'colDefs'
						};
	
	msgBus.onMsg('ShowSamples', function(event, data) {
		$scope.selectedDatasetName = data["datasetName"];
		$scope.showTable();
	}, $scope);
 
	$scope.showTable = function() {
		showLoadingIcon();		
		$scope.sampleDataService.getSampleTable($scope.selectedDatasetName, function(sampleTable) {
			$scope.sampleTable = sampleTable;
			for (key in $scope.sampleTable.table[0]) {
				var def = {"field":key};
				if (key!="sampleId") 
					def["cellTemplate"] = '<div class="ngCellText" ng-class="col.colIndex()" ng-click="editSampleTableCell(row.entity, row.getProperty(col.field), col.field)">{{row.getProperty(col.field)}}</div>';
				$scope.colDefs.push(def);
			}
			if (!$scope.$$phase) $scope.$apply();
			hideLoadingIcon();
		});
	}
	
  	$scope.editTableCell = function (row, cell, column) {
		$scope.selectedTableCell = cell;
		$scope.selectedTableRow = row;
		$scope.selectedTableColumn = column;
    };

	$scope.updateTableCell = function(){
        $scope.selectedTableRow[$scope.selectedTableColumn] = $scope.selectedTableCell;
    };

	$scope.uploadSampleFile = function()
	{
		var file = $("#sampleFile")[0].files[0];
		if ($scope.selectedDatasetName==null) {
			alert("Select a dataset first.");
			return;
		}
		else if (file==null) {
			alert("Select a file first.");
			return;
		}
		$scope.sampleTable.uploadSampleTableFile($scope.selectedDatasetName, file,
			function(sampleTable) {
				$scope.$apply(function() {
					$scope.sampleTable = sampleTable;					
				});
		});
	}
}]);


/* -----------------------------------------------------
Dataset Upload page controller
----------------------------------------------------- */
app.controller('DatasetUploadPageController', ['$scope', 'PageFactory', 'DatasetService', function ($scope, PageFactory, DatasetService) {
	$scope.pageFactory = PageFactory;
	$scope.dataset = DatasetService.dataset;

	$scope.newDatasetName;
	$scope.newDatasetType = 'rna-seq';
	$scope.newDatasetSpecies = 'MusMusculus';
	$scope.newDatasetDescription = '';

	$scope.uploadData = function()
	{
		//arguments
		var expressionFile = $("#expressionFile")[0].files[0];
		var datasetName = $scope.newDatasetName;

		if (!expressionFile) {
			alert("No expression file specified.");
			return;
		}
		else if (datasetName=="") {
			alert("No dataset name specified.");
			return;
		}
		else if ($scope.datasetService.dataset.allDatasetNames.indexOf(datasetName)!=-1) {
			alert("A dataset with this name already exists.");
			return;
		}

		showLoadingIcon();

		$scope.datasetService.dataset.uploadData(datasetName, expressionFile, $scope.newDatasetType, $scope.newDatasetSpecies, $scope.newDatasetDescription,
			function(session) {
				$scope.$apply();
			},
			function(error) {
				alert("Server error: " + error);
			},
			function() {
				hideLoadingIcon();
		});
	}	
}]);

/* -----------------------------------------------------
Dataset Gene Search page controller
----------------------------------------------------- */
app.controller('DatasetGeneSearchController', ['$scope', 'PageFactory', 'DatasetService', function ($scope, PageFactory, DatasetService) {
	$scope.pageFactory = PageFactory;
	$scope.dataset = DatasetService.dataset;
	$scope.searchString;
	$scope.search = function()
	{
		console.log($scope.searchString);
	}
	$scope.tableGrid = { data: 'datasetService.dataset.datasetsTable',
						};
						
// 	var req = ocpu.rpc("cs.cmdscale", {
// 	datasetName : "An"
// 	}, function(output){
// 		console.log(JSON.stringify(output));
// 	});
	
}]);

/* -----------------------------------------------------
Diff Exp page controller
----------------------------------------------------- */
app.controller('DiffExpPageController', ['$scope', 'msgBus', 'PageFactory', 'DatasetService', 'SampleDataService', '$http',
	function ($scope, msgBus, PageFactory, DatasetService, SampleDataService, $http) 
{
	$scope.pageFactory = PageFactory;
	$scope.datasetService = DatasetService;
	$scope.selectedMethod = "differential expression";
	var colDefs = [	{field:'$row', displayName:'feature', cellTemplate:'<div class="ngCellText" ng-class="col.colIndex()"><a href="http://www.ncbi.nlm.nih.gov/sites/entrez?db=gene&term={{row.getProperty(\'$row\')}}" target="_blank">{{row.getProperty("$row")}}</a></div>'},
					{field:'logFC', width:70},
					{field:'adjP', displayName:'adj-p', width:70},
					{field:'AveExpr', width:70, cellTemplate:'<div class="ngCellText" ng-class="col.colIndex()"><a href="#" ng-click="showExpressionProfile(selectedDatasetName, row.getProperty(\'$row\'))">{{row.getProperty("AveExpr")}}</a></div>'}
					];

	$scope.tableGrid = { data: 'genesetTable',
						  enableRowSelection: false,
						  columnDefs: colDefs
						};
	$scope.heatmapTitle = 'Heatmap';
	$scope.toptableTitle = 'Top differentially expressed genes';
	$scope.logFC = 'logFC>=0';
	$scope.topTableResult = {};
	$scope.positiveSignificantCount;
	$scope.negativeSignificantCount;
	
	$scope.setSampleGroups = function()
	{
		if (!$scope.selectedDatasetName) {
			$scope.allSampleGroups = ["[select sample group]"];
			$scope.selectedSampleGroup = $scope.allSampleGroups[0];
			$scope.sampleGroupItems = ["[group1]", "[group2]"];
			$scope.selectedSampleGroup = $scope.allSampleGroups[0];
			$scope.group1 = $scope.sampleGroupItems[0];
			$scope.group2 = $scope.sampleGroupItems[1];
			return;
		}
		showLoadingIcon();
		SampleDataService.getSampleTable($scope.selectedDatasetName, function(sampleTable) {
			$scope.allSampleGroups = sampleTable.allSampleGroups();
			$scope.selectedSampleGroup = $scope.allSampleGroups[0];
			$scope.sampleGroupItems = sampleTable.sampleGroupItems($scope.selectedSampleGroup);
			$scope.selectedSampleGroup = $scope.allSampleGroups[0];
			$scope.group1 = $scope.sampleGroupItems[0];
			$scope.group2 = $scope.sampleGroupItems[1];
			hideLoadingIcon();
			if (!$scope.$$phase) $scope.$apply();
		});
	}

	$scope.setSampleGroups();
	
	$scope.showTable = function()
	{
		$scope.genesetTable = ($scope.logFC=='logFC>=0')? $scope.topTableResult["positive"] : $scope.topTableResult["negative"];
		$scope.toptableTitle = 'Showing ' + $scope.genesetTable.length + ' features (' + $scope.positiveSignificantCount + ' logFC>=0, ' + $scope.negativeSignificantCount + ' logFC<0)';
		if (!$scope.$$phase) $scope.$apply();
	}
	
	$scope.showHeatmap = function()
	{
		SampleDataService.getSampleTable($scope.selectedDatasetName, function(sampleTable) {
			var dataMatrix = ($scope.logFC=='logFC>=0')? $scope.topTableResult["positiveCpm"] : $scope.topTableResult["negativeCpm"];
			if ($scope.sortedRowIds) {	// sort dataMatrix according to sortedRowIds
				// first turn dataMatrix into a dictionary keyed on row id
				var dataMatrixAsHash = {};
				for (var i=0; i<dataMatrix.length; i++)
					dataMatrixAsHash[dataMatrix[i]['$row']] = dataMatrix[i];
				// loop through sortedRowIds and insert the corresponding data row
				var newMatrix = [];
				for (var i=0; i<$scope.sortedRowIds.length; i++)
					newMatrix.push(dataMatrixAsHash[$scope.sortedRowIds[i]]);
				if (newMatrix.length>0) dataMatrix = newMatrix;
			}
			$scope.heatmapTitle = $scope.selectedDatasetName + ': ' + $scope.group1 + ' vs ' + $scope.group2 + ' (' + dataMatrix.length + ')';
			var colours = {"hs_proerythroblast_1":"#000000","hs_proerythroblast_2":"#000000","hs_proerythroblast_3":"#000000","hs_early_basophilic_1":"#FF34FF","hs_early_basophilic_2":"#FF34FF","hs_early_basophilic_3":"#FF34FF","hs_late_basophilic_1":"#FF4A46","hs_late_basophilic_2":"#FF4A46","hs_late_basophilic_3":"#FF4A46","hs_polychromatic_1":"#008941","hs_polychromatic_2":"#008941","hs_polychromatic_3":"#008941","hs_orthochromatic_1":"#006FA6","hs_orthochromatic_2":"#006FA6","hs_orthochromatic_3":"#006FA6"};
			//var celltypes = {"hs_proerythroblast_1":"proerythroblast","hs_proerythroblast_2":"proerythroblast","hs_proerythroblast_3":"proerythroblast","hs_early_basophilic_1":"early_baso","hs_early_basophilic_2":"early_baso","hs_early_basophilic_3":"early_baso","hs_late_basophilic_1":"late_baso","hs_late_basophilic_2":"late_baso","hs_late_basophilic_3":"late_baso","hs_polychromatic_1":"polychromatic","hs_polychromatic_2":"polychromatic","hs_polychromatic_3":"polychromatic","hs_orthochromatic_1":"orthochromatic","hs_orthochromatic_2":"orthochromatic","hs_orthochromatic_3":"orthochromatic"};
			//heatmap("#heatmapColumnLabelDiv", "#heatmapMainDiv", dataMatrix, '$row', celltypes, colours);
			heatmap("#heatmapColumnLabelDiv", "#heatmapMainDiv", dataMatrix, '$row', sampleTable.columnFromSampleGroup($scope.sampleGroupShown), colours);
		});
		if (!$scope.$$phase) $scope.$apply();
	}
	
	$scope.run = function()
	{
		showLoadingIcon();

		var req = ocpu.rpc("cs.topTable", {
			datasetName : $scope.selectedDatasetName,
			sampleGroup : $scope.selectedSampleGroup,
			group1 : $scope.group1,
			group2 : $scope.group2
		}, function(output){
			$scope.topTableResult["positiveCpm"] = output["positiveCpm"];
			$scope.topTableResult["negativeCpm"] = output["negativeCpm"];
			// ng-grid does not like the dots in adj.P.Val (as they refer to properties)
			for (var i=0; i<2; i++) {
				var key = (i==0)? "positive" : "negative";
				$scope.topTableResult[key] = [];
				for (var j=0; j<output[key].length; j++) {
					var row = output[key][j];
					row['adjP'] = row['adj.P.Val'];
					delete row['adj.P.Val'];
					$scope.topTableResult[key].push(row);
				}
			}
			$scope.positiveSignificantCount = output["positiveLength"];
			$scope.negativeSignificantCount = output["negativeLength"];
			$scope.sampleGroupShown = $scope.selectedSampleGroup;
			$scope.showTable();
			$scope.showHeatmap();
		});

		req.fail(function() {
			alert("Server error: " + req.responseText);
		});

		req.always(function() {
			hideLoadingIcon();
		});
	}
	
	$scope.$on('ngGridEventSorted', function(event, sortedColumn) {
		var column = sortedColumn['fields'][0];	// name of the clicked column
		var sortDirection = sortedColumn['directions'][0];	// either 'asc' or 'desc'
		// sort heatmap in the same order as the column - it looks like ng-grid sorts a copy of the array though
		// (https://github.com/angular-ui/ng-grid/issues/1056), so I have to work out sorted row ids again 
		var sortedTable = sortByKey($scope.genesetTable, column, sortDirection);
		$scope.sortedRowIds = [];
		for (var i=0; i<sortedTable.length; i++) {
			$scope.sortedRowIds.push(sortedTable[i]['$row']);
		}
		$scope.showHeatmap();
	});

	$scope.showExpressionProfile = function(datasetName, rowId)
	{
		$scope.pageFactory.currentPage = 'ExpProfilePage';
		msgBus.emitMsg('ShowExpressionProfile', { 'datasetName':datasetName, 'rowId':rowId } );
	}
	
	$scope.goAnalysis = function()
	{
		// Create the XHR object.
		function createCORSRequest(method, url) {
		  var xhr = new XMLHttpRequest();
		  if ("withCredentials" in xhr) {
			// XHR for Chrome/Firefox/Opera/Safari.
			xhr.open(method, url, true);
		  } else if (typeof XDomainRequest != "undefined") {
			// XDomainRequest for IE.
			xhr = new XDomainRequest();
			xhr.open(method, url);
		  } else {
			// CORS not supported.
			xhr = null;
		  }
		  return xhr;
		}
		//var url = 'http://updates.html5rocks.com';
		var url = 'http://cbl-gorilla.cs.technion.ac.il/servlet/GOrilla';

		  var xhr = createCORSRequest('POST', url);
		  if (xhr) {
		  	console.log(xhr);
		  } else {
			console.log('CORS not supported');
		  }
		  
		  xhr.onload = function() {
			var text = xhr.responseText;
			alert('Response from CORS request to ' + url);
		  };
  xhr.send();
		return;

		$http({
			method  : 'POST',
			url     : 'http://cbl-gorilla.cs.technion.ac.il/servlet/GOrilla',
			data    : {'species':'Homo sapiens', 'run_mode':'hg', 'db':'all', 'target_set':'GATA1\nMYB\nCBX'},
		//br.form.add_file(open(filepath), 'text/plain', filepath, name='background_file_name')

			headers : { 'Content-Type': 'application/x-www-form-urlencoded' }
    	})
        .success(function(data) {
            console.log(data);
        });

	}
}]);

/* -----------------------------------------------------
Exp Profile page controller
----------------------------------------------------- */
app.controller('ExpProfilePageController', ['$scope', 'msgBus', 'PageFactory', 'DatasetService', 'SampleDataService', 
	function ($scope, msgBus, PageFactory, DatasetService, SampleDataService) 
{
	$scope.pageFactory = PageFactory;
	$scope.datasetService = DatasetService;
	$scope.sampleDataService = SampleDataService;
	$scope.sampleTable;
	$scope.selectedSampleGroup;
	$scope.expressionValues;
	
	// Should run whenever dataset selector is changed, so that all sample groups for selected dataset are shown
	$scope.setSampleGroups = function(callback)
	{
		if ($scope.datasetService.dataset.allDatasetNames.indexOf($scope.selectedDatasetName)!=-1)
			$scope.sampleDataService.getSampleTable($scope.selectedDatasetName, function(sampleTable) {
				$scope.sampleTable = sampleTable;
				//if ($scope.sampleTable.allSampleGroups().indexOf($scope.selectedSampleGroup)==-1)	// should change currently selected sample group
					$scope.selectedSampleGroup = $scope.sampleTable.allSampleGroups()[0];				
				if (!$scope.$$phase) $scope.$apply(function() {
					if (callback) callback(sampleTable);
				});
			});
	}

	msgBus.onMsg('ShowExpressionProfile', function(event, data) {
		showLoadingIcon();
		$scope.expressionValues = $scope.datasetService.dataset.expressionValues(data["datasetName"], data["rowId"], function(output) {
			$scope.selectedDatasetName = data["datasetName"];
			$scope.rowId = data['rowId'];
			$scope.setSampleGroups(function(sampleTable) {
				$scope.expressionValues = output;
				$scope.drawBarchart();
				hideLoadingIcon();
				$scope.geneSymbol = $scope.rowId;
			});
		});
	}, $scope);

	$scope.drawBarchart = function()
	{
		// use items of selected sample group as labels for bars to use
		var labels = $scope.sampleTable.orderedSampleGroupItems($scope.selectedSampleGroup, $scope.expressionValues["labels"]);
		
		// sort both labels and expression values according to labels
		var labelsAndValues = [], colourHash = {};
		for (var i=0; i<labels.length; i++) {
			labelsAndValues.push([labels[i], $scope.expressionValues["values"][i]]);   // use this array of arrays to sort
			colourHash[labels[i]] = distinctColours[i];
		}
		function Comparator(a,b){
			if (a[0] < b[0]) return -1;
			if (a[0] > b[0]) return 1;
			return 0;
		}
		labelsAndValues.sort(Comparator);

		// use the sorted array to construct the arrays to be used for barchart parameters
		var sortedLabels = [], values = [], colours = [];
		for (var i=0; i<labelsAndValues.length; i++) {
			sortedLabels.push(labelsAndValues[i][0]);
			values.push(labelsAndValues[i][1]);
			colours.push(colourHash[labelsAndValues[i][0]]);
		}
		barchart("#barplotDiv", sortedLabels, values, colours);
	}
}]);

/* -----------------------------------------------------
Mds Plot page controller
----------------------------------------------------- */
app.controller('MdsPlotPageController', ['$scope', 'PageFactory', 'DatasetService', 'SampleDataService', 
	function ($scope, PageFactory, DatasetService, SampleDataService) 
{
	$scope.pageFactory = PageFactory;
	$scope.datasetService = DatasetService;
	$scope.sampleDataService = SampleDataService;
	$scope.sampleTable;

	$scope.sampleIds = [];
	$scope.pointCoordinates = {'x':[], 'y':[]};
	$scope.selectedDatasetName;
	$scope.selectedSampleGroup = 'sampleIds';
	$scope.selectedSampleGroupItems = [];
	$scope.orderedColours = [];	// used to colour each point according to selected sample group
	$scope.sampleGroupColours = {};	// used to colour each sample group item
	$scope.plotTitle = '[dataset]';
	$scope.plotType = '3d plot';

	$scope.updateSampleGroupItems = function() {
		var groupItems = $scope.sampleTable.orderedSampleGroupItems($scope.selectedSampleGroup, $scope.sampleIds);
		// should look like ["B","T","B","T",...] if celltype is selected as current sample group
		
		// work out colours based on unique entries of groupItems
		$scope.sampleGroupColours = {};	// reset
		var uniqueItems = $scope.sampleTable.sampleGroupItems($scope.selectedSampleGroup);
		for (var i=0; i<uniqueItems.length; i++)
			$scope.sampleGroupColours[uniqueItems[i]] = distinctColours[i];
		
		$scope.orderedColours = [];	// reset
		for (var i=0; i<groupItems.length; i++) 
			$scope.orderedColours.push($scope.sampleGroupColours[groupItems[i]]);

		d3.select("#mdsplotDiv").select("x3d").remove();
		d3.select("#mdsplotDiv").select("svg").remove();
		if ($scope.plotType=='3d plot') {
			scatterplot3d("#mdsplotDiv", groupItems, $scope.pointCoordinates["x"], $scope.pointCoordinates["y"], $scope.pointCoordinates["z"], $scope.orderedColours);
		}
		else {
			// work out properties to show for each point
			var properties = [];
			for (var i=0; i<groupItems.length; i++) {
				var row = [];
				for (var key in $scope.sampleTable.rowFromSampleId($scope.sampleIds[i])) {
					row.push(key + ': ' + $scope.sampleTable.table[i][key]);
				}
				properties.push('<p>' + row.join('</p><p>') + '</p>');
			}
			mdsplot("#mdsplotDiv", $scope.sampleIds, properties, $scope.pointCoordinates["x"], $scope.pointCoordinates["y"], $scope.orderedColours);
		}
		$scope.plotTitle = $scope.selectedDatasetName + " (" + $scope.selectedSampleGroup + ")";
		if (!$scope.$$phase) $scope.$apply();
	}

	$scope.run = function()
	{
		if ($scope.datasetService.dataset.allDatasetNames.indexOf($scope.selectedDatasetName)==-1) {
		  alert("Select a dataset.");
		  return;
		}
		showLoadingIcon();
		
		// obtain data from R
		var req = ocpu.rpc("cs.cmdscale", {
		    datasetName : $scope.selectedDatasetName
		}, function(output) {
			$scope.sampleIds = output["labels"];	// should be the same as columns of dataset
			$scope.pointCoordinates["x"] = output["x"];
			$scope.pointCoordinates["y"] = output["y"];
			$scope.pointCoordinates["z"] = output["z"];
			
			// fetch SampleTable instance, populate dom elements and draw scatter plot
			$scope.sampleDataService.getSampleTable($scope.selectedDatasetName, function(sampleTable) {
// 				$scope.$apply(function() {
					$scope.sampleTable = sampleTable;
					$scope.updateSampleGroupItems();
// 				});
			});
		});

		req.fail(function() {
			alert("Server error: " + req.responseText);
		});

		req.always(function() {
			hideLoadingIcon();
		});	
	}
}]);

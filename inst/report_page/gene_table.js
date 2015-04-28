function makeTable(targetDiv, data) {
	// Create and select table skeleton
	var tableSelect = targetDiv.append("table")
								.attr("class", "display compact")
								.attr("id", "gene_table");
	var headSelect = tableSelect.append("thead");
	var bodySelect = tableSelect.append("tbody");

	// Set column names
	var colnames = Object.keys(data[0]);
	// Filter out colour and coordinate information
	colnames = colnames.filter(function(d) {return d!="col" && d!="x" && d!="y";});
	var headRowSelect = headSelect.append("tr");
	colnames.forEach(function (d) {
		headRowSelect.append("td")
					.html(d);
	});

	// Set cell values
	data.forEach(function (data) {
		var bodyRowSelect = bodySelect.append("tr");
		colnames.forEach(function (key) {
			bodyRowSelect.append("td")
							.html(data[key]);
		})
	});

	// Get column number of pval
	pValInd = colnames.indexOf("pval");

	// Apply DataTable formatting: https://www.datatables.net/
	$(document).ready(function() {
        $('#gene_table').DataTable( {
        	"bLengthChange": false,
        	"order": [[ pValInd, "asc" ]]
        } );
        $('#gene_table_wrapper').css("visibility", "visible");
    });

    d3.select("#gene_table").selectAll("tr")
    	.on("click", function(d) {
    		var symb = d3.select(this).select("td:nth-child(5)").text();
    		findGeneAndHighlight(symb);
    		});
}
function makeTable(targetDiv, data) {
	$('.foot_div').css("visibility", "hidden"); // Hide table until style loads
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
        table = $('#gene_table').DataTable( {
        	"bLengthChange": false, // Disable page size change
        	"bDeferRender": true,
        	"order": [[ pValInd, "asc" ]]
        } );
        $('.foot_div').css("visibility", "visible");
    });

	// Add click function to table for highlight on MA plot
	symbInd = colnames.indexOf("symb") + 1;
    d3.select("#gene_table").selectAll("tr")
    	.on("click", function(d) {
    		var symb = d3.select(this).select("td:nth-child("+String(symbInd)+")").text();
    		findGeneAndHighlight(symb);
    		});
}
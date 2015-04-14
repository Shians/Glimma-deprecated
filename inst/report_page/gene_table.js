function makeTable(targetDiv, data) {
	// Create and select table skeleton
	var tableSelect = targetDiv.append("table")
								.attr("class", "display compact")
								.attr("id", "gene_table");
	var headSelect = tableSelect.append("thead");
	var bodySelect = tableSelect.append("tbody");

	// Set column names
	var colnames = Object.keys(data[0]);
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

	// Apply DataTable formatting: https://www.datatables.net/
	$(document).ready(function() {
        $('#gene_table').DataTable( {
        	"bLengthChange": false
        } );
    });
}
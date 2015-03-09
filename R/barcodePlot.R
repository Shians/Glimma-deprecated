glimmaBarcodePlot <- function(stats, genes, index1=TRUE, index2=NULL, gene.weights=NULL, 
                              weights.label="Weight", labels=c("Up", "Down"), quantiles=c(-1, 1), 
                              stat.name="Statistic", annotation=NULL, worm=FALSE, span.worm=0.45,
                              dir=NULL, launch=TRUE, main=NULL) {
  #------------------------------------------------------------
  # Check for errors
  #------------------------------------------------------------
  
  if (length(stats) != length(genes)) {
    stop("stats argument has different length to genes argument")
  }
  
  if (!is.numeric(stats)) {
    stop("stats argument must be numeric vector")
  }

  if (!is.character(genes) && !is.factor(genes)) {
    stop("genes argument must be a factor or character vector")
  }

  if (any(is.na(index1))) {
    stop("index1 argument cannot contain NAs")
  }

  if (is.logical(index1)) {
    if (!all(index1)) {
      stop("at least one element must be selected in index1")  
    }
    if (length(index1) != length(stats)) {
      stop("index1 argument must have same length as stats argment")
    }
  }

  if (!is.numeric(index1) && !is.logical(index1)) {
    stop("index1 argument must be numeric or logical vector")
  }

  if (quantiles[1] > quantiles[2]) {
    stop("first element of quantiles cannot be greater than second element")
  }


  #------------------------------------------------------------
  # Process input
  #------------------------------------------------------------
  
  # If no output directory is provided, set to current working directory
  if (is.null(dir)) {
    dir <- getwd()
  }

  # Create dataframe out of input
  data <- data.frame(stat=stats, Gene=quotify(genes))

  if (!is.null(annotation)) {
    if (nrow(data) != nrow(annotation)) {
      stop("")
    }
    data <- cbind(data, annotation)
  }

  # Transform dataframe into json notation
  coln <- paste(quotify(colnames(data)), ":", sep="")
  temp <- t(apply(data, 1, function (x) { paste(coln, x) }))
  temp <- apply(temp, 1, function(x) { paste("{", paste(x, collapse=", "), "}", sep="") })

  json <- paste("[", paste(temp, collapse=", "), "]", sep="")

  # Generate quantile data
  sorted.stats <- sort(stats, decreasing=TRUE)
  lowq <- length(stats) - sum(sorted.stats < quantiles[1])
  upq <- sum(sorted.stats > quantiles[2])
  # Offset by -1 to match javascript index1ing
  quantiles.data <- arrayify(paste(c(upq, lowq) - 1, collapse=","))

  # Create directory for 
  if (substr(dir, nchar(dir), nchar(dir)) == "/") {
    path <- paste0(dir, "bacode_data.js")
  } else {
    path <- paste0(dir, "/barcode_data.js")
  }

  # Locate files in package library
  page.path <- system.file("report_page", package="Glimma")
  files <- paste(page.path, c("barcode_plot.js", "barcode_plot.html"))

  # Copy over data
  file.copy(from=page.path, to=dir, recursive=TRUE)
  report.path <- paste(dir, "/report_page", sep="")
   
  fname <- paste(report.path, "/barcode_data.js", sep="")

  # Offset index values by -1 to match javascript indexing
  # This method works in both numeric and logical vector indices compared to index1 - 1
  selection <- arrayify(paste((0:(length(stats) - 1))[index1], collapse=","))

  stat.name <- quotify(stat.name)

  # Generate worm data if required
  if (worm) {
    # Set javascript flag
    wantWorm <- "true"

    # Calculate worm coordinates
    avg.enrich1 <- length()

    worm1 <- tricubeMovingAverage(index1, span = span.worm)/avg.enrich1
  } else {
    # Set javascript flag
    wantWorm <- "false"
  }

  #------------------------------------------------------------
  # Output
  #------------------------------------------------------------
  
  # Write data out to file
  printJsonToFile(c(json, selection, quantiles.data, stat.name, wantWorm), filename=fname, 
                  varname=c("dataBarcode", "barcodeSubset", "barcodeQuantiles", "barcodeStatName", "wantWorm"))
  
  # Launch web page if requested
  if (launch) {
    browseURL(paste(report.path, "/barcode_plot.html", sep=""))
  }
}

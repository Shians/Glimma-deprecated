interactiveMDSplot <- function(x, ...) {
  UseMethod("interactiveMDSplot")
}

interactiveMDSplot.default <- function(x, col, top=500, labels = NULL, gene.selection = "pairwise", dir=NULL, launch=TRUE, main=NULL) {
	#------------------------------------------------------------
  	# Check for errors
  	#------------------------------------------------------------

	x <- as.matrix(x)
	nsamples <- ncol(x)

	if (nsamples < 3) {
		stop(paste("Only", nsamples, "columns of data: need at least 3"))
	}

	cn <- colnames(x)
	bad <- rowSums(is.finite(x)) < nsamples

	if (any(bad)) {
		x <- x[!bad, drop=FALSE]
	}

	nprobes <- nrow(x)
	top <- min(top, nprobes)

	if (is.null(labels)) {
		labels <- paste("Sample", 1:nsamples)
	} else {
		labels <- as.character(labels)
	}

	#------------------------------------------------------------
	# Process input
	#------------------------------------------------------------
	# If no output directory is provided, set to current working directory
	if (is.null(dir)) {
		dir <- getwd()
	}

	# Locate files in package library
	page.path <- system.file("report_page", package="Glimma")
	files <- paste(page.path, c("mds_plot.js", "mds_plot.html", "plot_styles.css", "mds_styles.css", "utilities.js", "js", "css"), sep="/")

	# Make report page directory and copy over data
	if (substr(dir, nchar(dir), nchar(dir)) == "/") {
		dir.create(paste(dir, "report_page", sep=""), showWarnings=FALSE)
		report.path <- paste(dir, "report_page", sep="")
	} else {
		dir.create(paste(dir, "report_page", sep="/"), showWarnings=FALSE)
		report.path <- paste(dir, "report_page", sep="/")
	}
	file.copy(from=files, to=report.path, recursive=TRUE)

	data.filename <- paste(report.path, "/mds_data.js", sep="")

	gene.selection <- match.arg(gene.selection, c("pairwise", "common"))
	dd <- matrix(0, nrow=nsamples, ncol=nsamples, dimnames=list(cn,cn))
	if (gene.selection == "pairwise") {
		topindex <- nprobes - top + 1L
		for (i in 2L:(nsamples)) {
			for (j in 1L:(i - 1L)) {
				dd[i, j] = sqrt(mean(sort.int((x[, i] - x[, j])^2, partial = topindex)[topindex:nprobes]))
			}
		}
	} else if (gene.selection == "common") {
		if (nprobes > top) {
			s <- rowMeans((x -  rowMeans(x))^2)
			o <- order(s, decreasing=TRUE)
			x <- x[o[1L:top], , drop=FALSE]
		}
		for (i in 2L:nsamples) {
			dd[i, 1L:(i - 1L)] = sqrt(colMeans((x[, i] - x[, 1:(i - 1), drop = FALSE])^2))
		}
	}
	a1 <- suppressWarnings(cmdscale(as.dist(dd), k=min(10, nsamples-1), eig=TRUE))

	dmatrix <- a1$points
	eigvals <- round(a1$eig, 3)[1:10]
	eigvals[is.na(eigvals)] <- 0
	eigsum <- round(sum(a1$eig), 3)
	
	if (is.character(col)) {
		cols <- apply(as.character(as.hexmode(col2rgb(col, alpha=FALSE))), 2, function(x) {paste0("#", paste0(x, collapse=""))})
	} else if (is.factor(col) || is.numeric(col)) {
		col <- palette()[as.integer(col)]
		cols <- apply(as.character(as.hexmode(col2rgb(col, alpha=FALSE))), 2, function(x) {paste0("#", paste0(x, collapse=""))})
	} else {
		stop("input col must not of class 'interger', 'factor' or 'character'")
	}
	
	#------------------------------------------------------------
	# Generate javascript strings
	#------------------------------------------------------------
	
	col <- cols
	df <- data.frame(labels, dmatrix, col)
	colnames(df)[1] <- "label"
	colnames(df)[2:(ncol(df)-1)] <- 2:(ncol(df)-1) - 1
	js <- makeDFJson(df)

	eigjs <- arrayify(paste(eigvals, collapse=","))

	#------------------------------------------------------------
  	# Output
  	#------------------------------------------------------------
  
	data.filename <- paste(report.path, "/mds_data.js", sep="")
	printJsonToFile(c(js, eigjs, eigsum), filename=data.filename,
					varname=c("dataMDS", "eigenVals", "eigenSum"))

}

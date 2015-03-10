makeMAjson <- function(x, ...) {
  UseMethod("makeMAjson")
}

makeDotjson <- function(x, sample.grous, ...) {
  UseMethod("makeDotjson")
}

makeSAjson <- function(x, ...) {
  UseMethod("makeSAjson")
}

makeSymbolList <- function(x, ...) {
  UseMethod("makeSymbolList")
}

stopType <- function(type, name="x") {
  type <- paste0('"', type, '"')
  name <- paste0('"', name, '"')
  stop(paste("input", name, "not of class", type))
}

# Function to add double quotes onto the start and end of the strings
quotify <- function(x) {
  paste("\"", x, "\"", sep="")
}

# Function to add square brackets around string
arrayify <- function(x) {
  paste("[", x, "]", sep="")
}

# Function to convert dataframe into JSON object
makeJSON <- function(df) {
  if (!is(df, "data.frame")) {
    stopType("data.frame")
  }

  for (n in names(df) ) {
    if (!is(df[[n]], "numeric")) {
      df[[n]] <- quotify(df[[n]])
    }
  }

  coln <- paste(quotify(colnames(df)), ":", sep="")
  temp <- t(apply(df, 1, function (x) { paste(coln, x, sep="") }))
  temp <- apply(temp, 1, function(x) { paste("{", paste(x, collapse=","), "}", sep="") })

  paste("[", paste(temp, collapse=","), "]", sep="")
}

# Function to convert the aveExp, LogFc, symb, pVal and decideTest of MArrayLM
# to json format
makeMAjson.MArrayLM <- function(x, coef=NULL, pval=0.05, adjust.method="BH") {
  if (is.null(coef)) {
    stop("coef not specified")
  }
  if (!is(x, "MArrayLM")) {
    stopType("MArrayLM")
  }
  req <- c("coefficients", "Amean", "p.value", "genes")
  if (any(is.na(match(req, names(x))))) {
    str <- paste(req[is.na(match(req, names(x)))], collapse=", ")
    stop(paste("data for", str, "missing"))
  }
  # Function to convert (-1, 0, 1) to (red, black, green)
  toCol <- function(num) {
    if (num == 0) {
      return("black")
    } else if (num == -1) {
      return("red")
    } else if (num == 1) {
      return("green")
    } else {
      stop("value that is not -1, 0 or 1 detected.")
    }
  }

  # Pull out relevant data columns and assemble into data frame
  GeneID <- names(x$Amean)
  LogFC <- as.numeric(x$coefficients[, coef])
  AvgExpr <- as.numeric(x$Amean)
  Log2Sigma <- as.numeric(log2(x$sigma))
  # Take the selected column of design matrix to perform test on
  col <- sapply(decideTests(x[,coef], p.value=pval, adjust.method=adjust.method), toCol)
  symb <- as.character(x$genes$Symbols)
  pval <- p.adjust(x$p.value[, coef], method=adjust.method)
  dframe <- data.frame(cbind(GeneID, LogFC, AvgExpr, Log2Sigma, col, symb, pval))

  # Convert to character then numeric to ensure factors are converted correctly
  for (col in c("LogFC", "AvgExpr", "pval", "Log2Sigma")) {
    dframe[[col]] <- as.numeric(as.character(dframe[[col]]))
  }

  dframe$symb <- as.character(dframe$symb)

  dframe <- dframe[order(dframe$col), ]

  nUndef <- sum(is.na(dframe$symb))
  undefNames <- paste0("unnamed", 1:nUndef)
  dframe$symb[is.na(dframe$symb)] <- undefNames

  output <- makeJSON(dframe)

  output
}

makeMAjson.DGEExact <- function(x, ...) {
  if (!is(x, "DGEExact")) {
    stopType("DGEExact")
  }
}


# Function to generate JSON for dot plot of samples
makeDotjson.EList <- function(x, sample.groups, sample.names=NULL) {
  if (!is(x, "EList")) {
    stopType("EList")
  }

  sample.groups <- as.factor(sample.groups)

  expr <- x$E
  if (!is.null(sample.names)) {
    if (length(sample.names) == length(colnames(expr))){
      colnames(expr) <- sample.names
    } else {
      stop("sample names must be vector of same length as number of columns
            of data")
    }
  } else {
    sample.names <- colnames(expr)
  }

  geneID <- rownames(expr)

  ar.len <- length(geneID)
  overall.array <- character(ar.len)
  a.ind <- 1

  for (id in 1:length(geneID)) {
    len <- length(sample.groups)
    c.array <- character(length=len)

    for (sam in 1:len) {
      vstr <- sprintf("\"value\": %.6f", expr[id, sam])
      sstr <- sprintf("\"sample\": \"%s\"", sample.names[sam])
      gstr <- sprintf("\"group\": \"%s\"", as.character(sample.groups[sam]))
      objstr <- paste(vstr, sstr, gstr, sep=", ")
      objstr <- paste0("{", objstr, "}")
      c.array[sam] <- objstr
    }

    str <- paste0(c.array, collapse = ", ")
    str <- sprintf("\"%s\": [%s]", geneID[id], str)
    overall.array[a.ind] <- str
    a.ind <- a.ind + 1

  }

  output <- paste0(overall.array, collapse = ", ")
  output <- paste0("{", output, "}")

  class(output) <- "json"

  output
}

# Function to generate JSON for SA plot from
makeSAjson.MArrayLM <- function(fit) {
  if (!is(fit, "MArrayLM"))
    stopType("MArrayLM", "fit")
  x <- fit$Amean
  y <- log2(fit$sigma)

  lowessData <- lowess(x, y, f = 0.4)

  end <- length(lowessData$x)
  gap <- round(end/200)
  ind <- c(seq(1, end, gap), end)

  x_sampled <- lowessData$x[ind]
  y_sampled <- lowessData$y[ind]

  len <- length(x_sampled)
  arr <- character(length=len)
  for (i in 1:len) {
    x_co <- x_sampled[i]
    y_co <- y_sampled[i]
    arr[i] <- sprintf("{\"x\": %.6f, \"y\": %.6f}", x_co, y_co)
  }

  output <- paste(arr, collapse = ", ")
  output <- paste0("[", output, "]")

  class(output) <- "json"

  output
}

# Function to generate list of gene symbols for autocomplete
makeSymbolList.MArrayLM <- function(fit) {
  symb <- as.character(fit$genes$Symbols)
  symb <- unique(symb)
  symb <- symb[!is.na(symb)]

  output <- paste('"', symb, '"', sep="")
  output <- paste(output, collapse=", ")
  output <- paste("[", output, "]", sep="")

  class(output) <- "json"

  output
}

# Function to make json object ouf of factor levels
makeFactjson <- function(sample.groups) {
  sample.groups <- as.factor(sample.groups)
  l <- levels(sample.groups)
  l <- paste("\"", l, "\"", sep="")
  paste("[", paste(l, collapse=", "), "]", sep="")
}


# Function to print stored json as a javascript var declaration
printJsonToFile <- function(json, filename, varname) {
  file.con <- file(description=filename, open="w")
  if (length(json) != length(varname)) {
    stop("json vector must be same length as varname vector")
  }

  for (i in 1:length(json)) {
    write(paste0("var ", varname[i], " = ", json[i], ";"), file=file.con,
          sep=" ", append=TRUE)
  }
  close(file.con)
}

# Function to generate relevant json objects given EList and MAarrayLM
createJson <- function(MArrayLM, Elist, sample.groups, labels, p.value=p.value,
                        adjust.method="BH", coef=NULL, dir=NULL, main=NULL) {
  if (is.null(dir)) {
    path <- "plot_data.js"
  } else {
    if (substr(dir, nchar(dir), nchar(dir)) == "/") {
      path <- paste0(dir, "plot_data.js")
    } else {
      path <- paste0(dir, "/plot_data.js")
    }
  }

  if (is.null(main)) {
    main <- "\"\""
  } else {
    main <- paste("\"", main, "\"")
  }

  maJson <- makeMAjson(MArrayLM, p.value=p.value, coef=coef, adjust.method=adjust.method)
  saJson <- makeSAjson(MArrayLM)
  dotJson <- makeDotjson(Elist, sample.groups, labels)
  factJson <- makeFactjson(sample.groups)
  printJsonToFile(c(maJson, dotJson, saJson, factJson, main), path,
                  c("dataMA", "dataDot", "dataSA", "dataFact", "pageTitle"))
}

# Function to write report
glimmaMAPlot <- function(object, y, groups, p.value=0.05, lfc=0, adjust.method="BH",
                         labels=NULL, coef=NULL, dir=NULL, launch=TRUE, main=NULL) {
  if (is.null(coef)) {
    stop("coef argument must be specified")
  }

  if (!is(groups, "factor") && !is(groups, "character")) {
    stop("groups arugment must be character or factor vector")
  }

  page.path <- system.file("report_page", package="Glimma")

  if (is.null(dir)) {
    wd <- getwd()
    file.copy(from=page.path, to=wd, recursive=TRUE)

    report.path <- paste(wd, "/report_page", sep="")
    createJson(object, y, sample.groups=groups, labels=labels, p.value=p.value, 
                adjust.method=adjust.method, coef=coef, dir=report.path, main=main)
  } else {
    file.copy(from=page.path, to=dir, recursive=TRUE)

    report.path <- paste(dir, "/report_page", sep="")
    createJson(object, y, sample.groups=groups, labels=labels, p.value=p.value, 
                adjust.method=adjust.method, coef=coef, dir=report.path, main=main)
  }

  # Launch web page if requested
  if (launch) {
    browseURL(paste(report.path, "/plots.html", sep=""))
  }
}

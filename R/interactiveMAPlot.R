# Function to generate relevant json objects given EList and MAarrayLM
createMAJson <- function(MArrayLM, Elist, sample.groups, genes, labels, p.value=p.value,
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

  maJson <- makeMAjson(MArrayLM, genes=genes, p.value=p.value, coef=coef, adjust.method=adjust.method)
  saJson <- makeSAjson(MArrayLM)
  dotJson <- makeDotjson(Elist, sample.groups, labels)
  factJson <- makeFactjson(sample.groups)
  printJsonToFile(c(maJson, dotJson, saJson, factJson, main), path,
                  c("dataMA", "dataDot", "dataSA", "dataFact", "pageTitle"))
}

# Function to write report
interactiveMAPlot <- function(object, y, groups, genes=NULL, p.value=0.05, lfc=0, adjust.method="BH",
                         labels=NULL, coef=NULL, baseURL="none", searchBy="Symbol", linkBy="GeneID", 
                         dir=NULL, launch=TRUE, main=NULL) {
  if (is.null(coef)) {
    stop("coef argument must be specified")
  }

  if (!is(groups, "factor") && !is(groups, "character")) {
    stop("groups arugment must be character or factor vector")
  }

  if (is.null(genes) && is.na(match("genes", names(object)))) {
    stop("please provide gene annotations in genes argument or as attribute of object")
  }

  page.path <- system.file("report_page", package="Glimma")

  if (is.null(dir)) {
    wd <- getwd()
    file.copy(from=page.path, to=wd, recursive=TRUE)

    report.path <- paste(wd, "/report_page", sep="")
    createMAJson(object, y, sample.groups=groups, genes=genes, labels=labels, p.value=p.value, 
                adjust.method=adjust.method, coef=coef, dir=report.path, main=main)
  } else {
    file.copy(from=page.path, to=dir, recursive=TRUE)

    report.path <- paste(dir, "/report_page", sep="")
    createMAJson(object, y, sample.groups=groups, genes=genes, labels=labels, p.value=p.value, 
                baseURL=baseURL, searchBy=searchBy, linkBy=linkBy,
                adjust.method=adjust.method, coef=coef, dir=report.path, main=main)
  }

  # Launch web page if requested
  if (launch) {
    browseURL(paste(report.path, "/plots.html", sep=""))
  }
}

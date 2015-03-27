# Helper function for printing type errors
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
makeDFJson <- function(df) {
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


# Function to make json object ouf of factor levels
makeFactjson <- function(sample.groups) {
  sample.groups <- as.factor(sample.groups)
  l <- levels(sample.groups)
  l <- paste("\"", l, "\"", sep="")
  paste("[", paste(l, collapse=", "), "]", sep="")
}
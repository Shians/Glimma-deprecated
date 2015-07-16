\title{Interactive version of Multidimensional scaling plot of distances between gene expression profiles}
\name{interactiveMDSPlot}
\alias{interactiveMDSPlot}
\alias{interactiveMDSPlot.default}

\description{
Plot samples on an interactive two-dimensional scatterplot so that distances on the plot approximate 
the typical log2 fold changes between the samples.
}

\usage{
\method{interactiveMDSPlot}(x, col, top = 500, labels = NULL,
        gene.selection = "pairwise", dir = NULL, launch=TRUE, main=NULL)
}

\arguments{
  \item{x}{any data object which can be coerced to a matrix, such as \code{ExpressionSet} or \code{EList}.}
  \item{top}{number of top genes used to calculate pairwise distances.}
  \item{labels}{character vector of sample names or labels. Defaults to \code{colnames(x)}.}
  \item{gene.selection}{character, \code{"pairwise"} to choose the top genes separately for each pairwise comparison between the samples or \code{"common"} to select the same genes for all comparisons.}
  \item{dir}{character string indicating the output directory for the plot.}
  \item{launch}{\code{logical}. Should the resulting plot be displayed?}
  \item{main}{character string specifying the title of the html page.}
}

\details{
This function is a variation on the usual multdimensional scaling (or principle coordinate) plot, in that a distance measure particularly appropriate for the microarray context is used.
The distance between each pair of samples (columns) is the root-mean-square deviation (Euclidean distance) for the top \code{top} genes.
Distances on the plot can be interpreted as \emph{leading log2-fold-change}, meaning
the typical (root-mean-square) log2-fold-change between the samples for the genes that distinguish those samples.

If \code{gene.selection} is \code{"common"}, then the top genes are those with the largest standard deviations between samples.
If \code{gene.selection} is \code{"pairwise"}, then a different set of top genes is selected for each pair of samples.
The pairwise feature selection may be appropriate for microarray data when different molecular pathways are relevant for distinguishing different pairs of samples.

See \code{\link[graphics]{text}} for possible values for \code{col} and \code{cex}.
}

\value{
A interactive plot is created on the current graphics device.
}

\author{Shian Su}

\references{
Ritchie, ME, Phipson, B, Wu, D, Hu, Y, Law, CW, Shi, W, and Smyth, GK (2015).
limma powers differential expression analyses for RNA-sequencing and microarray studies.
\emph{Nucleic Acids Research} 43, e47.
\url{http://nar.oxfordjournals.org/content/43/7/e47}
}

\seealso{
\code{\link{plotMDS}} from the limma package, on which this function is based.
}

\examples{
# Simulate gene expression data for 1000 probes and 6 microarrays.
# Samples are in two groups
# First 50 probes are differentially expressed in second group
sd <- 0.3*sqrt(4/rchisq(1000,df=4))
x <- matrix(rnorm(1000*6,sd=sd),1000,6)
rownames(x) <- paste("Gene",1:1000)
x[1:50,4:6] <- x[1:50,4:6] + 2
# without labels, indexes of samples are plotted.
mds <- plotMDS(x,  col=c(rep("black",3), rep("red",3)) )
# or labels can be provided, here group indicators:
plotMDS(mds,  col=c(rep("black",3), rep("red",3)), labels= c(rep("Grp1",3), rep("Grp2",3)))
}

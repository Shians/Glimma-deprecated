\name{interactivebarcodeplot}
\alias{interactivebarcodeplot}

\title{
	Interactive barcode plot
}
\description{
	Generate an interactive version of the barcodeplot function from the limma package.
}
\usage{
interactivebarcodeplot(stats, index=TRUE, genes,
                       labels=c("Up", "Down"), quantiles=c(-1, 1),
                       stat.name="Statistic", annotation=NULL,
                       dir=NULL, launch=TRUE, main=NULL, url=NULL, urlGeneIDs=NULL, displayGeneIDs="Symbols")
}

\arguments{
  \item{statistics}{numeric vector giving the values of statistics to rank genes by.}
  \item{index}{index vector for the gene set.
  This can be a vector of indices, or a logical vector of the same length as \code{statistics} or, in general, any vector such that \code{statistic[index]} gives a subset of the statistic values.}
  \item{genes}{data.frame of gene annotation information to display in plot upon hovering over indexed gene.}
  \item{labels}{character vector of labels for high and low statistics.  First label is associated with high statistics and is displayed at the left end of the plot.  Second label is associated with low or negative statistics and is displayed at the right end of the plot.}
  \item{quantiles}{numeric vector of length 2, giving cutoff values for \code{statistics} considered small or large respectively.  Used to color the rectangle of the barcodeplot.}
  \item{stat.name}{character string specifying name of \code{stats} to use on plot.}
  \item{annotation}{data.frame of additional gene information to display.}
  \item{dir}{character string indicating the output directory for the plot.}
  \item{launch}{\code{logical}. Should the resulting plot be displayed?}
  \item{main}{character string specifying the title of the html page.}
  \item{url}{character string specifying URL to use to link out to external gene ID information.}
  \item{urlGeneIDs}{character string specifying the gene annotation column to use as key at specified \code{url}.}
}

\details{
  This function generates an interactive barcodeplot.
}

\value{
  An html page with an interactive \code{barcodeplot} that allows the user to hover over ine individual genes highlighted from the gene set selected.
}

\references{
  Ritchie, M.E., Phipson, B., Wu, D., Hu, Y., Law, C.W., Shi, W., and Smyth, G.K. (2015).
  limma powers differential expression analyses for RNA-sequencing and microarray studies.
  Nucleic Acids Research 43, doi: 10.1093/nar/gkv007.
}

\author{Shian Su, Matt Ritchie}

\seealso{
	\code{\link{interactiveMDplot}}
}

\examples{
\dontrun{
library(Glimma)
library(edgeR)
load("x.rda")
# filter out genes with low read counts
sel = rowSums(cpm(x$counts)>0.5)>=3
x = x[sel,]
x$genes = x$genes[,c(1,3)]
des = model.matrix(~x$samples$group)
colnames(des)[2] = "Smchd1nullvsWt"
x = calcNormFactors(x, method="TMM")
genotype = x$samples$group

plotMDS(x, labels=1:7, col=as.numeric(genotype), main="MDS plot for Smchd1 experiment")
legend("topright", legend=c("WT", "Smchd1 null"), pch=15, col=1:2)

v = voomWithQualityWeights(x, design=des, normalization="none", plot=TRUE)
vfit = lmFit(v)
vfit = eBayes(vfit)
topTable(vfit,coef=2,sort.by="P")

interactiveMAplot(vfit, v, groups=genotype, coef=2)

imprints = read.table("imprinted_genelist.txt", sep="\t", header=TRUE)
nrow(imprints)
impind = match(alias2SymbolTable(imprints[,1], species="Mm"),
               alias2SymbolTable(x$genes$Symbols, species="Mm"))
impind = unique(impind[!is.na(impind)])
length(impind)

interactivebarcodeplot(vfit$t[,2], index=impind, genes=vfit$genes[,"Symbols"])
}
}

\keyword{hplots}
\keyword{graphics}

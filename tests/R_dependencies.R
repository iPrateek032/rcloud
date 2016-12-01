 chooseCRANmirror(ind=81)
"***********************Installing packages******************"
 install.packages("XML", repos=c("http://RForge.net", "http://R.research.att.com"), type="source")
 install.packages("rcloud.dcplot", repos="http://rforge.net")
 install.packages("rpython2", repos="http://rforge.net")
 install.packages("xml2", repos=c("http://RForge.net", "http://R.research.att.com"), type="source")
 install.packages("drat", repos="https://cran.rstudio.com")
 install.packages("devtools", repos="http://rforge.net")
 devtools::install_github('att/rcloud.rmd')
 devtools::install_github('att/rcloud.shiny')
 devtools::install_github("rcloud.htmlwidgets")
"***********************Done Installing packages******************"
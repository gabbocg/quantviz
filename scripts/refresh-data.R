# Refresh the committed CSVs used throughout the R for Finance deck.
# Run once locally to regenerate data/; the deck itself never touches
# the network at render time (chunks read the CSVs via readr::read_csv).
#
# Usage: Rscript scripts/refresh-data.R

suppressPackageStartupMessages({
  library(tidyquant)
  library(frenchdata)
  library(readr)
  library(dplyr)
  library(tidyr)
  library(lubridate)
})

TICKERS <- c("AAPL", "MSFT", "SPY", "TLT", "GLD")
DATE_FROM <- "2015-01-01"
DATE_TO   <- "2024-12-31"
DATA_DIR  <- "data"

dir.create(DATA_DIR, showWarnings = FALSE)

for (tk in TICKERS) {
  message("Downloading ", tk, " ...")
  df <- tq_get(tk, from = DATE_FROM, to = DATE_TO, get = "stock.prices")
  df <- df %>%
    select(date, open, high, low, close, volume, adjusted) %>%
    arrange(date)
  write_csv(df, file.path(DATA_DIR, paste0(tk, ".csv")))
}

message("Downloading Fama-French 3 daily ...")
ff_raw <- download_french_data("Fama/French 3 Factors [Daily]")
ff_flat <- ff_raw$subsets$data[[1]] %>%
  mutate(date = as.Date(as.character(date), format = "%Y%m%d")) %>%
  rename(mkt_rf = `Mkt-RF`, smb = SMB, hml = HML, rf = RF) %>%
  mutate(across(c(mkt_rf, smb, hml, rf), ~ . / 100)) %>%
  filter(date >= as.Date(DATE_FROM), date <= as.Date(DATE_TO)) %>%
  arrange(date)
write_csv(ff_flat, file.path(DATA_DIR, "ff_factors.csv"))

message("Done. CSVs written to ", DATA_DIR, "/")

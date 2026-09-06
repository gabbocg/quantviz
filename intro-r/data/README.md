# `data/` — market data for the deck

All CSVs are committed so the deck renders deterministically without any
network access. Regenerate via `Rscript scripts/refresh-data.R`.

## Files

| File | Content | Range |
|------|---------|-------|
| `AAPL.csv` | Apple Inc. daily OHLCV + adjusted close | 2015-01-01 → 2024-12-31 |
| `MSFT.csv` | Microsoft Corp. daily OHLCV + adjusted close | same |
| `SPY.csv` | S&P 500 SPDR ETF daily OHLCV + adjusted close (market proxy) | same |
| `TLT.csv` | iShares 20+ Year Treasury Bond ETF daily OHLCV + adjusted close | same |
| `GLD.csv` | SPDR Gold Shares ETF daily OHLCV + adjusted close | same |
| `ff_factors.csv` | Fama-French 3-factor daily (`Mkt-RF`, `SMB`, `HML`, `RF`) — decimals, not percent | same |

## Provenance

Yahoo Finance (via `tidyquant::tq_get(get = "stock.prices")`) and Kenneth
French's data library (via `frenchdata::download_french_data()`).

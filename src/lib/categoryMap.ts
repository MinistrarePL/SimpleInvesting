/**
 * Beginner-friendly PL/EN translations for all EODHD ETF categories (206).
 * Fallback: returns raw EODHD value when the category is not in the map.
 */

const CATEGORY_MAP: Record<string, { pl: string; en: string }> = {
  // ─── Equity: US Size & Style ──────────────────────────────────
  'Large Blend':                          { pl: 'Akcje USA – duże spółki (mieszane)',           en: 'US Large-Cap Blend Equities' },
  'Large Growth':                         { pl: 'Akcje USA – duże spółki wzrostowe',            en: 'US Large-Cap Growth Equities' },
  'Large Value':                          { pl: 'Akcje USA – duże spółki wartościowe',          en: 'US Large-Cap Value Equities' },
  'Mid-Cap Blend':                        { pl: 'Akcje USA – średnie spółki (mieszane)',        en: 'US Mid-Cap Blend Equities' },
  'Mid-Cap Growth':                       { pl: 'Akcje USA – średnie spółki wzrostowe',         en: 'US Mid-Cap Growth Equities' },
  'Mid-Cap Value':                        { pl: 'Akcje USA – średnie spółki wartościowe',       en: 'US Mid-Cap Value Equities' },
  'Small Blend':                          { pl: 'Akcje USA – małe spółki (mieszane)',           en: 'US Small-Cap Blend Equities' },
  'Small Growth':                         { pl: 'Akcje USA – małe spółki wzrostowe',            en: 'US Small-Cap Growth Equities' },
  'Small Value':                          { pl: 'Akcje USA – małe spółki wartościowe',          en: 'US Small-Cap Value Equities' },
  'US Equity Income':                     { pl: 'Akcje USA – dywidendowe',                      en: 'US Dividend Equities' },
  'US Flex-Cap Equity':                   { pl: 'Akcje USA – elastyczna kapitalizacja',         en: 'US Flex-Cap Equities' },
  'US Large-Cap Blend Equity':            { pl: 'Akcje USA – duże spółki (mieszane)',           en: 'US Large-Cap Blend Equities' },
  'US Large-Cap Growth Equity':           { pl: 'Akcje USA – duże wzrostowe',                   en: 'US Large-Cap Growth Equities' },
  'US Large-Cap Value Equity':            { pl: 'Akcje USA – duże wartościowe',                 en: 'US Large-Cap Value Equities' },

  // ─── Equity: Global ───────────────────────────────────────────
  'Global Large-Cap Blend Equity':        { pl: 'Akcje globalne – duże spółki (mieszane)',      en: 'Global Large-Cap Blend Equities' },
  'Global Large-Cap Value Equity':        { pl: 'Akcje globalne – duże spółki wartościowe',     en: 'Global Large-Cap Value Equities' },
  'Global Large-Cap Growth Equity':       { pl: 'Akcje globalne – duże spółki wzrostowe',       en: 'Global Large-Cap Growth Equities' },
  'Global Large-Stock Blend':             { pl: 'Akcje globalne – mieszane',                    en: 'Global Blend Equities' },
  'Global Large-Stock Value':             { pl: 'Akcje globalne – wartościowe',                 en: 'Global Value Equities' },
  'Global Large-Stock Growth':            { pl: 'Akcje globalne – wzrostowe',                   en: 'Global Growth Equities' },
  'Global Small/Mid-Cap Equity':          { pl: 'Akcje globalne – małe i średnie spółki',       en: 'Global Small/Mid-Cap Equities' },
  'Global Small/Mid Stock':               { pl: 'Akcje globalne – małe i średnie',              en: 'Global Small/Mid Stocks' },
  'Global Equity Income':                 { pl: 'Akcje globalne – dywidendowe',                 en: 'Global Dividend Equities' },

  // ─── Equity: International (from US perspective) ──────────────
  'Foreign Large Blend':                  { pl: 'Akcje międzynarodowe – duże spółki (mieszane)', en: 'International Large-Cap Blend' },
  'Foreign Large Value':                  { pl: 'Akcje międzynarodowe – duże wartościowe',       en: 'International Large-Cap Value' },
  'Foreign Large Growth':                 { pl: 'Akcje międzynarodowe – duże wzrostowe',         en: 'International Large-Cap Growth' },
  'Foreign Small/Mid Blend':              { pl: 'Akcje międzynarodowe – małe i średnie',         en: 'International Small/Mid Blend' },
  'Foreign Small/Mid Value':              { pl: 'Akcje międzynarodowe – małe wartościowe',       en: 'International Small/Mid Value' },

  // ─── Equity: Europe ───────────────────────────────────────────
  'Europe Large-Cap Blend Equity':        { pl: 'Akcje europejskie – duże spółki (mieszane)',   en: 'European Large-Cap Blend Equities' },
  'Europe Large-Cap Value Equity':        { pl: 'Akcje europejskie – duże wartościowe',         en: 'European Large-Cap Value Equities' },
  'Europe Stock':                         { pl: 'Akcje europejskie',                             en: 'European Equities' },
  'Eurozone Large-Cap Equity':            { pl: 'Akcje strefy euro – duże spółki',              en: 'Eurozone Large-Cap Equities' },
  'Europe ex-UK Equity':                  { pl: 'Akcje europejskie (bez Wlk. Brytanii)',        en: 'European ex-UK Equities' },
  'Europe Equity Income':                 { pl: 'Akcje europejskie – dywidendowe',              en: 'European Dividend Equities' },
  'Europe Flex-Cap Equity':               { pl: 'Akcje europejskie – elastyczna kapitalizacja', en: 'European Flex-Cap Equities' },
  'France Equity':                        { pl: 'Akcje francuskie',                              en: 'French Equities' },
  'Switzerland Equity':                   { pl: 'Akcje szwajcarskie',                            en: 'Swiss Equities' },

  // ─── Equity: UK ───────────────────────────────────────────────
  'UK Large-Cap Equity':                  { pl: 'Akcje brytyjskie – duże spółki',              en: 'UK Large-Cap Equities' },
  'UK Mid-Cap Equity':                    { pl: 'Akcje brytyjskie – średnie spółki',           en: 'UK Mid-Cap Equities' },
  'UK Equity Income':                     { pl: 'Akcje brytyjskie – dywidendowe',              en: 'UK Dividend Equities' },

  // ─── Equity: Asia & Emerging Markets ──────────────────────────
  'Global Emerging Markets Equity':       { pl: 'Akcje rynków wschodzących',                    en: 'Emerging Markets Equities' },
  'Global Emerging Markets ex-China Equity': { pl: 'Rynki wschodzące (bez Chin)',               en: 'Emerging Markets ex-China Equities' },
  'Diversified Emerging Mkts':            { pl: 'Rynki wschodzące – zdywersyfikowane',          en: 'Diversified Emerging Markets' },
  'Greater China Region':                 { pl: 'Akcje chińskie i Hongkong',                    en: 'Greater China Equities' },
  'China Equity':                         { pl: 'Akcje chińskie',                                en: 'Chinese Equities' },
  'China Equity - A Shares':              { pl: 'Akcje chińskie – A-shares (Szanghaj/Shenzhen)', en: 'Chinese A-Shares' },
  'India Equity':                         { pl: 'Akcje indyjskie',                               en: 'Indian Equities' },
  'Korea Equity':                         { pl: 'Akcje koreańskie',                              en: 'Korean Equities' },
  'Japan Large-Cap Blend Equity':         { pl: 'Akcje japońskie – duże spółki',                en: 'Japanese Large-Cap Equities' },
  'Japan Stock':                          { pl: 'Akcje japońskie',                               en: 'Japanese Equities' },
  'Asia-Pacific ex-Japan Equity':         { pl: 'Azja-Pacyfik (bez Japonii)',                   en: 'Asia-Pacific ex-Japan Equities' },
  'Asia-Pacific Equity':                  { pl: 'Azja-Pacyfik',                                  en: 'Asia-Pacific Equities' },
  'Asia ex-Japan Equity':                 { pl: 'Azja (bez Japonii)',                            en: 'Asia ex-Japan Equities' },
  'Pacific ex-Japan Equity':              { pl: 'Pacyfik (bez Japonii)',                         en: 'Pacific ex-Japan Equities' },
  'Pacific/Asia ex-Japan Stk':            { pl: 'Pacyfik/Azja (bez Japonii)',                   en: 'Pacific/Asia ex-Japan Stocks' },
  'Focused Region':                       { pl: 'Akcje regionalne',                              en: 'Regional Focus Equities' },
  'Brazil Equity':                        { pl: 'Akcje brazylijskie',                            en: 'Brazilian Equities' },
  'Latin America Equity':                 { pl: 'Akcje Ameryki Łacińskiej',                     en: 'Latin American Equities' },
  'Singapore Equity':                     { pl: 'Akcje singapurskie',                            en: 'Singaporean Equities' },

  // ─── Equity: Sectors ──────────────────────────────────────────
  'Equity Energy':                        { pl: 'Sektor energetyczny',                           en: 'Energy Sector' },
  'Financial':                            { pl: 'Sektor finansowy (banki, ubezpieczenia)',       en: 'Financial Sector' },
  'Health':                               { pl: 'Sektor zdrowia i farmacji',                    en: 'Healthcare Sector' },
  'Industrials':                          { pl: 'Sektor przemysłowy',                            en: 'Industrials Sector' },
  'Consumer Cyclical':                    { pl: 'Dobra konsumenckie (cykliczne)',                en: 'Consumer Cyclical Sector' },
  'Consumer Defensive':                   { pl: 'Dobra konsumenckie (defensywne)',               en: 'Consumer Defensive Sector' },
  'Communications':                       { pl: 'Sektor komunikacji i mediów',                  en: 'Communications Sector' },
  'Infrastructure':                       { pl: 'Infrastruktura',                                en: 'Infrastructure' },
  'Technology':                           { pl: 'Sektor technologiczny',                         en: 'Technology Sector' },
  'Utilities':                            { pl: 'Sektor użyteczności publicznej',                en: 'Utilities Sector' },
  'Natural Resources':                    { pl: 'Zasoby naturalne',                              en: 'Natural Resources' },
  'Miscellaneous Sector':                 { pl: 'Sektor mieszany / inny',                       en: 'Miscellaneous Sector' },
  'Other Equity':                         { pl: 'Akcje – inne',                                  en: 'Other Equity' },
  'Equity Precious Metals':               { pl: 'Producenci złota i metali szlachetnych',       en: 'Gold & Precious Metals Miners' },

  // ─── Equity: Sector (Morningstar "Sector Equity" style) ───────
  'Sector Equity Precious Metals':        { pl: 'Producenci złota i metali szlachetnych',       en: 'Gold & Precious Metals Miners' },
  'Sector Equity Technology':             { pl: 'Sektor technologiczny',                         en: 'Technology Sector' },
  'Sector Equity Healthcare':             { pl: 'Sektor zdrowia i farmacji',                    en: 'Healthcare Sector' },
  'Sector Equity Industrial Materials':   { pl: 'Sektor materiałów przemysłowych',              en: 'Industrial Materials Sector' },
  'Sector Equity Natural Resources':      { pl: 'Zasoby naturalne',                              en: 'Natural Resources Sector' },
  'Sector Equity Energy':                 { pl: 'Sektor energetyczny',                           en: 'Energy Sector' },
  'Sector Equity Financial Services':     { pl: 'Sektor usług finansowych',                     en: 'Financial Services Sector' },
  'Sector Equity Consumer Goods & Services': { pl: 'Dobra i usługi konsumenckie',               en: 'Consumer Goods & Services Sector' },
  'Sector Equity Alternative Energy':     { pl: 'Energia odnawialna / alternatywna',            en: 'Alternative / Renewable Energy' },
  'Sector Equity Biotechnology':          { pl: 'Biotechnologia',                                en: 'Biotechnology Sector' },
  'Sector Equity Communications':         { pl: 'Sektor komunikacji',                            en: 'Communications Sector' },
  'Sector Equity Utilities':              { pl: 'Sektor użyteczności publicznej',                en: 'Utilities Sector' },
  'Sector Equity Infrastructure':         { pl: 'Infrastruktura',                                en: 'Infrastructure Sector' },

  // ─── Equity: Special strategies ───────────────────────────────
  'Derivative Income':                    { pl: 'Strategie opcyjne / dochodowe',                en: 'Options & Income Strategies' },
  'Defined Outcome':                      { pl: 'Strategie z określonym wynikiem (buforowane)', en: 'Defined Outcome / Buffer Strategies' },
  'Equity Hedged':                        { pl: 'Akcje z zabezpieczeniem ryzyka',               en: 'Hedged Equity' },
  'Equity Market Neutral':                { pl: 'Strategia neutralna rynkowo',                  en: 'Market Neutral Strategy' },
  'Event Driven':                         { pl: 'Strategia zdarzeniowa',                         en: 'Event Driven Strategy' },
  'Energy Limited Partnership':           { pl: 'Spółki energetyczne (MLP/LP)',                 en: 'Energy Limited Partnerships' },
  'Long-Short Equity':                    { pl: 'Strategia long-short (akcje)',                  en: 'Long-Short Equity Strategy' },
  'Options Trading':                      { pl: 'Strategie opcyjne',                             en: 'Options Trading Strategy' },
  'Systematic Trend':                     { pl: 'Strategia podążania za trendem',               en: 'Systematic Trend Following' },
  'Macro Trading':                        { pl: 'Strategia makroekonomiczna',                   en: 'Macro Trading Strategy' },
  'Multistrategy':                        { pl: 'Wiele strategii (multi-strategy)',              en: 'Multi-Strategy' },
  'Preferred Stock':                      { pl: 'Akcje uprzywilejowane',                         en: 'Preferred Stocks' },

  // ─── Trading: Leveraged & Inverse ─────────────────────────────
  'Trading--Leveraged Equity':            { pl: 'Lewarowane – akcje (x2, x3)',                  en: 'Leveraged Equity (2x, 3x)' },
  'Trading--Inverse Equity':              { pl: 'Odwrócone – akcje (short)',                    en: 'Inverse Equity (Short)' },
  'Trading--Leveraged Commodities':       { pl: 'Lewarowane – surowce (x2, x3)',                en: 'Leveraged Commodities (2x, 3x)' },
  'Trading--Inverse Commodities':         { pl: 'Odwrócone – surowce (short)',                  en: 'Inverse Commodities (Short)' },
  'Trading--Leveraged Debt':              { pl: 'Lewarowane – obligacje (x2, x3)',              en: 'Leveraged Bonds (2x, 3x)' },
  'Trading--Inverse Debt':                { pl: 'Odwrócone – obligacje (short)',                en: 'Inverse Bonds (Short)' },
  'Trading--Miscellaneous':               { pl: 'Lewarowane / odwrócone – inne',                en: 'Leveraged / Inverse – Other' },
  'Trading - Leveraged/Inverse Equity':   { pl: 'Lewarowane / odwrócone – akcje',              en: 'Leveraged / Inverse Equity' },
  'Trading - Leveraged/Inverse Commodities': { pl: 'Lewarowane / odwrócone – surowce',         en: 'Leveraged / Inverse Commodities' },
  'Trading - Leveraged/Inverse Other':    { pl: 'Lewarowane / odwrócone – inne',                en: 'Leveraged / Inverse – Other' },

  // ─── Digital Assets / Crypto ──────────────────────────────────
  'Digital Assets':                       { pl: 'Kryptowaluty i aktywa cyfrowe',                en: 'Crypto & Digital Assets' },
  'Equity Digital Assets':                { pl: 'Spółki z branży kryptowalut',                  en: 'Crypto-Related Equities' },

  // ─── Commodities ──────────────────────────────────────────────
  'Commodities Focused':                  { pl: 'Surowce',                                       en: 'Commodities' },
  'Commodities Broad Basket':             { pl: 'Surowce – koszyk zdywersyfikowany',            en: 'Diversified Commodities Basket' },
  'Commodities - Broad Basket':           { pl: 'Surowce – koszyk zdywersyfikowany',            en: 'Diversified Commodities Basket' },
  'Commodities - Precious Metals':        { pl: 'Surowce – metale szlachetne (złoto, srebro)', en: 'Precious Metals (Gold, Silver)' },
  'Commodities - Energy':                 { pl: 'Surowce – energia (ropa, gaz)',                en: 'Energy Commodities (Oil, Gas)' },
  'Commodities - Industrial & Broad Metals': { pl: 'Surowce – metale przemysłowe',             en: 'Industrial & Base Metals' },
  'Commodities - Other':                  { pl: 'Surowce – inne',                               en: 'Other Commodities' },

  // ─── Real Estate / Property ───────────────────────────────────
  'Global Real Estate':                   { pl: 'Nieruchomości globalne (REIT)',                en: 'Global Real Estate (REITs)' },
  'Real Estate':                          { pl: 'Nieruchomości (REIT)',                         en: 'Real Estate (REITs)' },
  'Property - Indirect Global':           { pl: 'Nieruchomości globalne (pośrednie)',           en: 'Global Indirect Real Estate' },
  'Property - Indirect Other':            { pl: 'Nieruchomości – inne (pośrednie)',             en: 'Other Indirect Real Estate' },
  'Property - Indirect Switzerland':      { pl: 'Nieruchomości szwajcarskie (pośrednie)',       en: 'Swiss Indirect Real Estate' },

  // ─── Fixed Income: US Government ──────────────────────────────
  'Short Government':                     { pl: 'Obligacje rządowe USA (krótki termin)',        en: 'US Short-Term Government Bonds' },
  'Intermediate Government':              { pl: 'Obligacje rządowe USA (średni termin)',        en: 'US Government Bonds (Medium-Term)' },
  'Long Government':                      { pl: 'Obligacje rządowe USA (długi termin)',         en: 'US Long-Term Government Bonds' },
  'Government Mortgage-Backed Bond':      { pl: 'Obligacje hipoteczne (rządowe)',               en: 'Government Mortgage-Backed Bonds' },
  'Inflation-Protected Bond':             { pl: 'Obligacje antyinflacyjne (TIPS)',              en: 'Inflation-Protected Bonds (TIPS)' },
  'Short-Term Inflation-Protected Bond':  { pl: 'Obligacje antyinflacyjne (krótki termin)',     en: 'Short-Term Inflation-Protected Bonds' },

  // ─── Fixed Income: EUR/GBP/USD Government ─────────────────────
  'EUR Government Bond':                  { pl: 'Obligacje rządowe EUR',                        en: 'EUR Government Bonds' },
  'GBP Government Bond':                  { pl: 'Obligacje rządowe GBP (UK Gilts)',             en: 'UK Government Bonds (Gilts)' },
  'GBP Inflation-Linked Bond':            { pl: 'Obligacje antyinflacyjne GBP',                en: 'GBP Inflation-Linked Bonds' },
  'Global Inflation-Linked Bond - EUR Hedged': { pl: 'Obligacje antyinflacyjne – zabezp. EUR', en: 'Inflation-Linked Bonds – EUR Hedged' },
  'USD Government Bond':                  { pl: 'Obligacje rządowe USD',                        en: 'USD Government Bonds' },
  'USD Government Bond - Short Term':     { pl: 'Obligacje rządowe USD (krótki termin)',        en: 'USD Short-Term Government Bonds' },
  'USD Inflation-Linked Bond':            { pl: 'Obligacje antyinflacyjne USD',                 en: 'USD Inflation-Linked Bonds' },

  // ─── Fixed Income: Corporate ──────────────────────────────────
  'Intermediate Core Bond':               { pl: 'Obligacje korporacyjne (średni termin)',       en: 'Core Bonds (Medium-Term)' },
  'Intermediate Core-Plus Bond':          { pl: 'Obligacje korporacyjne Plus (średni termin)',  en: 'Core-Plus Bonds (Medium-Term)' },
  'Corporate Bond':                       { pl: 'Obligacje korporacyjne',                       en: 'Corporate Bonds' },
  'EUR Corporate Bond':                   { pl: 'Obligacje korporacyjne EUR',                   en: 'EUR Corporate Bonds' },
  'EUR Corporate Bond - Short Term':      { pl: 'Obligacje korporacyjne EUR (krótki termin)',   en: 'EUR Corporate Bonds (Short-Term)' },
  'USD Corporate Bond':                   { pl: 'Obligacje korporacyjne USD',                   en: 'USD Corporate Bonds' },
  'USD Corporate Bond - Short Term':      { pl: 'Obligacje korporacyjne USD (krótki termin)',   en: 'USD Short-Term Corporate Bonds' },
  'Global Corporate Bond - CHF Hedged':   { pl: 'Obligacje korporacyjne – zabezp. CHF',        en: 'Corporate Bonds – CHF Hedged' },
  'Global Corporate Bond - GBP Hedged':   { pl: 'Obligacje korporacyjne – zabezp. GBP',        en: 'Corporate Bonds – GBP Hedged' },

  // ─── Fixed Income: High Yield ─────────────────────────────────
  'High Yield Bond':                      { pl: 'Obligacje wysokodochodowe (high yield)',       en: 'High Yield Bonds' },
  'High Yield Muni':                      { pl: 'Obligacje municypalne – high yield (USA)',     en: 'High Yield Municipal Bonds' },
  'EUR High Yield Bond':                  { pl: 'Obligacje wysokodochodowe EUR',                en: 'EUR High Yield Bonds' },
  'USD High Yield Bond':                  { pl: 'Obligacje wysokodochodowe USD',                en: 'USD High Yield Bonds' },
  'Global High Yield Bond':               { pl: 'Obligacje wysokodochodowe – globalne',         en: 'Global High Yield Bonds' },
  'Global High Yield Bond - GBP Hedged':  { pl: 'Obligacje high yield – zabezp. GBP',          en: 'High Yield Bonds – GBP Hedged' },

  // ─── Fixed Income: Emerging Markets ───────────────────────────
  'Emerging Markets Bond':                { pl: 'Obligacje rynków wschodzących',                en: 'Emerging Markets Bonds' },
  'Emerging-Markets Local-Currency Bond': { pl: 'Obligacje EM w walutach lokalnych',            en: 'EM Local-Currency Bonds' },
  'Global Emerging Markets Bond':         { pl: 'Obligacje rynków wschodzących – globalne',     en: 'Global Emerging Markets Bonds' },
  'Global Emerging Markets Bond - CHF Hedged': { pl: 'Obligacje EM – zabezp. CHF',             en: 'EM Bonds – CHF Hedged' },
  'Global Emerging Markets Bond - EUR Hedged': { pl: 'Obligacje EM – zabezp. EUR',             en: 'EM Bonds – EUR Hedged' },
  'Global Emerging Markets Corporate Bond': { pl: 'Obligacje korporacyjne EM',                 en: 'EM Corporate Bonds' },
  'Global Emerging Markets Corporate Bond - EUR Hedge': { pl: 'Obligacje korporacyjne EM – zabezp. EUR', en: 'EM Corporate Bonds – EUR Hedged' },

  // ─── Fixed Income: Global & Diversified ───────────────────────
  'Global Bond':                          { pl: 'Obligacje globalne',                            en: 'Global Bonds' },
  'Global Bond-USD Hedged':               { pl: 'Obligacje globalne – zabezp. USD',             en: 'Global Bonds – USD Hedged' },
  'Global Diversified Bond':              { pl: 'Obligacje globalne zdywersyfikowane',           en: 'Global Diversified Bonds' },
  'Global Diversified Bond - EUR Hedged': { pl: 'Obligacje zdywersyfikowane – zabezp. EUR',    en: 'Diversified Bonds – EUR Hedged' },
  'Global Diversified Bond - GBP Hedged': { pl: 'Obligacje zdywersyfikowane – zabezp. GBP',    en: 'Diversified Bonds – GBP Hedged' },
  'Global Diversified Bond - CHF Hedged': { pl: 'Obligacje zdywersyfikowane – zabezp. CHF',    en: 'Diversified Bonds – CHF Hedged' },
  'Global Diversified Bond - USD Hedged': { pl: 'Obligacje zdywersyfikowane – zabezp. USD',    en: 'Diversified Bonds – USD Hedged' },
  'GBP Diversified Bond - Short Term':    { pl: 'Obligacje zróżnicowane GBP (krótki termin)',  en: 'GBP Diversified Bonds (Short-Term)' },
  'USD Diversified Bond':                 { pl: 'Obligacje zdywersyfikowane USD',                en: 'USD Diversified Bonds' },
  'Multisector Bond':                     { pl: 'Obligacje wielosektorowe',                      en: 'Multi-Sector Bonds' },
  'Nontraditional Bond':                  { pl: 'Obligacje nietradycyjne',                       en: 'Non-Traditional Bonds' },
  'Other Bond':                           { pl: 'Obligacje – inne',                              en: 'Other Bonds' },

  // ─── Fixed Income: Short-Term & Money Market ──────────────────
  'Short-Term Bond':                      { pl: 'Obligacje krótkoterminowe',                     en: 'Short-Term Bonds' },
  'Long-Term Bond':                       { pl: 'Obligacje długoterminowe',                      en: 'Long-Term Bonds' },
  'Ultrashort Bond':                      { pl: 'Obligacje ultrakrótkie',                        en: 'Ultra-Short Bonds' },
  'EUR Ultra Short-Term Bond':            { pl: 'Obligacje EUR – ultrakrótki termin',           en: 'EUR Ultra Short-Term Bonds' },
  'USD Ultra Short-Term Bond':            { pl: 'Obligacje USD – ultrakrótki termin',            en: 'USD Ultra Short-Term Bonds' },
  'EUR Money Market - Short Term':        { pl: 'Rynek pieniężny EUR',                          en: 'EUR Money Market' },
  'Money Market - Other':                 { pl: 'Rynek pieniężny – inne',                       en: 'Money Market – Other' },
  'Prime Money Market':                   { pl: 'Rynek pieniężny (prime)',                      en: 'Prime Money Market' },
  'Single Currency':                      { pl: 'Obligacje jednowalutowe',                       en: 'Single Currency Bonds' },
  'French PEA ESTR SWAP':                 { pl: 'Rynek pieniężny EUR (ESTR swap, PEA)',        en: 'EUR Money Market (ESTR Swap, PEA)' },

  // ─── Fixed Income: Other ──────────────────────────────────────
  'Fixed Term Bond':                      { pl: 'Obligacje o stałym terminie',                  en: 'Fixed Term Bonds' },
  'Target Maturity':                      { pl: 'Obligacje o docelowym terminie zapadalności',  en: 'Target Maturity Bonds' },
  'Bank Loan':                            { pl: 'Pożyczki bankowe (lewarowane)',                en: 'Bank Loans (Leveraged Loans)' },
  'Convertibles':                         { pl: 'Obligacje zamienne na akcje',                  en: 'Convertible Bonds' },
  'Convertible Bond - Global':            { pl: 'Obligacje zamienne – globalne',                en: 'Global Convertible Bonds' },
  'Securitized Bond - Diversified':       { pl: 'Obligacje sekurytyzowane – zróżnicowane',     en: 'Diversified Securitized Bonds' },
  'Securitized Bond - Focused':           { pl: 'Obligacje sekurytyzowane – skoncentrowane',   en: 'Focused Securitized Bonds' },

  // ─── Fixed Income: Municipal (USA) ────────────────────────────
  'Muni National Interm':                 { pl: 'Obligacje municypalne USA (średni termin)',    en: 'US Municipal Bonds (Medium-Term)' },
  'Muni National Long':                   { pl: 'Obligacje municypalne USA (długi termin)',     en: 'US Municipal Bonds (Long-Term)' },
  'Muni National Short':                  { pl: 'Obligacje municypalne USA (krótki termin)',    en: 'US Municipal Bonds (Short-Term)' },
  'Muni California Intermediate':         { pl: 'Obligacje municypalne Kalifornia (średnie)',   en: 'California Municipal Bonds (Medium)' },
  'Muni California Long':                 { pl: 'Obligacje municypalne Kalifornia (długie)',    en: 'California Municipal Bonds (Long)' },
  'Muni New York Long':                   { pl: 'Obligacje municypalne Nowy Jork (długie)',     en: 'New York Municipal Bonds (Long)' },
  'Muni Single State Short':              { pl: 'Obligacje municypalne stanowe (krótkie)',      en: 'Single State Municipal Bonds (Short)' },
  'Muni Target Maturity':                 { pl: 'Obligacje municypalne – docelowy termin',      en: 'Municipal Target Maturity Bonds' },

  // ─── Allocation / Multi-Asset ─────────────────────────────────
  'Global Allocation':                    { pl: 'Alokacja globalna (mieszana)',                 en: 'Global Multi-Asset Allocation' },
  'Global Moderate Allocation':           { pl: 'Alokacja umiarkowana (50/50)',                 en: 'Moderate Allocation (Balanced)' },
  'Global Conservative Allocation':       { pl: 'Alokacja konserwatywna (więcej obligacji)',    en: 'Conservative Allocation' },
  'Global Moderately Aggressive Allocation': { pl: 'Alokacja umiarkowanie agresywna',          en: 'Moderately Aggressive Allocation' },
  'Global Moderately Conservative Allocation': { pl: 'Alokacja umiarkowanie konserwatywna',    en: 'Moderately Conservative Allocation' },
  'Moderate Allocation':                  { pl: 'Alokacja umiarkowana',                         en: 'Moderate Allocation' },
  'Moderately Conservative Allocation':   { pl: 'Alokacja umiarkowanie konserwatywna',         en: 'Moderately Conservative Allocation' },
  'Tactical Allocation':                  { pl: 'Alokacja taktyczna',                           en: 'Tactical Allocation' },
  'Multi-Asset Overlay':                  { pl: 'Strategia wieloaktywowa (overlay)',             en: 'Multi-Asset Overlay Strategy' },

  // ─── Islamic / ESG ────────────────────────────────────────────
  'Islamic Global Equity':                { pl: 'Akcje globalne – zgodne z islamem (Sharia)',   en: 'Islamic (Sharia) Global Equities' },
  'Islamic Equity - Other':               { pl: 'Akcje islamskie – inne',                       en: 'Islamic Equities – Other' },
};

export function getFriendlyCategory(
  rawCategory: string | null | undefined,
  lang: 'pl' | 'en',
): string {
  if (!rawCategory) return 'N/A';
  const mapped = CATEGORY_MAP[rawCategory];
  if (mapped) return mapped[lang];
  return rawCategory;
}

// Content for the hedge fund platform blueprint.

export const roadmap = [
  { phase: 'Phase 0 · 0–2 mo', title: 'Foundations', items: ['Security master & reference data', 'Identity, entitlements, audit trail', 'Prime broker / admin data feeds', 'Event backbone & environments'] },
  { phase: 'Phase 1 · 2–6 mo', title: 'Trade Lifecycle MVP', items: ['PMS + OMS with pre-trade compliance', 'FIX connectivity to 2–3 brokers', 'IBOR positions & intraday P&L', 'Daily recon against prime broker'] },
  { phase: 'Phase 2 · 6–12 mo', title: 'Risk & Operations', items: ['VaR, stress and exposure dashboards', 'Settlement & cash management', 'Corporate action processing', 'Shadow NAV vs administrator'] },
  { phase: 'Phase 3 · 12–18 mo', title: 'Investor & Regulatory', items: ['Investor portal & capital activity', 'Form PF / AIFMD / 13F automation', 'Fee waterfall & equalisation', 'Data lakehouse & analytics'] },
  { phase: 'Phase 4 · 18 mo+', title: 'Edge & Scale', items: ['Smart order routing & TCA', 'ML signal pipeline & feature store', 'Multi-region DR', 'Self-service analytics for PMs'] },
]

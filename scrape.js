import fs from "node:fs/promises";

const targets = [
  { firm: "Apex", url: "https://apextraderfunding.com/coupon-code/" },
  { firm: "Tradeify", url: "https://tradeify.co/" },
  { firm: "Take Profit Trader", url: "https://takeprofittrader.com/" },
  { firm: "My Funded Futures", url: "https://myfundedfutures.com/coupons" },
  { firm: "Lucid Trading", url: "https://lucidtrading.com/" },
  { firm: "Bulenox", url: "https://bulenox.com/" },
  { firm: "FundedNext Futures", url: "https://propfirmmatch.com/futures/offers/fnfutures-match" }
];

function pickFirst(patterns, text) {
  for (const p of patterns) {
    const m = text.match(p);
    if (m) return m[1]?.trim() ?? m[0]?.trim();
  }
  return null;
}

function normalize(text) {
  return text.replace(/\s+/g, " ").trim();
}

async function fetchHtml(url) {
  const res = await fetch(url, { headers: { "user-agent": "DealsTickerBot/1.0" } });
  if (!res.ok) throw new Error(`Fetch failed ${res.status} for ${url}`);
  return await res.text();
}

async function run() {
  const results = [];

  for (const t of targets) {
    try {
      const html = await fetchHtml(t.url);
      const text = normalize(html);

      // patterns for percent and code and ends
      const percent = pickFirst([/(\d{1,2}%\s*OFF)/i, /(up to\s*\d{1,2}%\s*off)/i], text);
      const code = pickFirst([/use code[:\s]*([A-Z0-9$_-]{3,15})/i, /code[:\s]*([A-Z0-9$_-]{3,15})/i], text);
      const ends = pickFirst([/ends\s+([A-Za-z]+\s+\d{1,2})/i, /Ends\s+(\d{1,2}\s+[A-Za-z]+)/i], text);

      let deal = percent ? percent.toUpperCase() : null;
      if (!deal && t.firm === "Lucid Trading" && code) deal = "Best deal code shown";
      if (!deal && code) deal = "Promo code available";

      results.push({
        firm: t.firm,
        deal: deal ?? "Check site for latest promo",
        code: code ? code.toUpperCase() : null,
        expires: ends ?? null,
        active: true,
        source: t.url,
        updatedAt: new Date().toISOString()
      });
    } catch (e) {
      results.push({
        firm: t.firm,
        deal: "Source unreachable",
        code: null,
        expires: null,
        active: false,
        source: t.url,
        updatedAt: new Date().toISOString()
      });
    }
  }

  await fs.writeFile("deals.json", JSON.stringify(results, null, 2));
  console.log("Updated deals.json");
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});

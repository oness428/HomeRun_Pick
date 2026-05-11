// Vercel Serverless Function - KBO 경기 일정 스크래핑
// /api/games/[date].js → GET /api/games/2026-05-11

export const config = { runtime: "edge" };

const TEAM_MAP = {
  "KIA": "KIA", "기아": "KIA",
  "삼성": "SS", "LG": "LG",
  "두산": "DB", "KT": "KT",
  "SSG": "SSG", "롯데": "LOT",
  "한화": "HH", "NC": "NC",
  "키움": "KIW",
};

function mapTeam(name) {
  for (const [key, val] of Object.entries(TEAM_MAP)) {
    if (name?.includes(key)) return val;
  }
  return "KIA";
}

export default async function handler(req) {
  const url = new URL(req.url);
  const datePart = url.pathname.split("/").pop(); // e.g. "2026-05-11"
  const [year, month, day] = datePart.split("-");

  // KBO 공식 일정 API (JSON)
  const kboUrl = `https://www.koreabaseball.com/ws/Schedule.asmx/GetScheduleList` +
    `?leId=1&srId=0&seasonId=${year}&gameMonth=${month}&gameDate=${year}${month}${day}`;

  try {
    const res = await fetch(kboUrl, {
      headers: {
        "Referer": "https://www.koreabaseball.com/",
        "User-Agent": "Mozilla/5.0",
      },
    });

    if (!res.ok) throw new Error(`KBO API error: ${res.status}`);
    const text = await res.text();

    // XML 파싱
    const games = [];
    const rows = text.match(/<row>([\s\S]*?)<\/row>/g) || [];

    for (const row of rows) {
      const get = (tag) => {
        const m = row.match(new RegExp(`<${tag}>([^<]*)</${tag}>`));
        return m ? m[1].trim() : "";
      };

      const homeScore = parseInt(get("hscore")) || 0;
      const awayScore = parseInt(get("ascore")) || 0;
      const statusText = get("status");

      let status = "upcoming";
      if (statusText.includes("종료") || statusText.includes("경기종료")) status = "ended";
      else if (statusText.includes("취소") || statusText.includes("우천")) status = "canceled";
      else if (statusText !== "경기전" && statusText !== "") status = "live";

      games.push({
        id: get("gameId"),
        home: mapTeam(get("home")),
        away: mapTeam(get("visit")),
        time: get("gtime")?.substring(0, 5) || "18:30",
        stadium: get("stadium"),
        status,
        homeScore,
        awayScore,
        pick: null,
        result: status === "ended" ? (homeScore > awayScore ? "home" : awayScore > homeScore ? "away" : "draw") : null,
        homeOdds: 1.80,
        awayOdds: 1.90,
      });
    }

    return new Response(JSON.stringify({ code: "OK", data: games }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "s-maxage=30, stale-while-revalidate=60",
      },
    });
  } catch (e) {
    return new Response(JSON.stringify({ code: "ERROR", message: e.message, data: [] }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }
}

// Vercel Serverless Function - KBO 팀 순위 스크래핑
// GET /api/standings

export const config = { runtime: "edge" };

const TEAM_NAME_MAP = {
  "KIA": "KIA", "기아": "KIA",
  "삼성": "삼성", "LG": "LG",
  "두산": "두산", "KT": "KT",
  "SSG": "SSG", "롯데": "롯데",
  "한화": "한화", "NC": "NC",
  "키움": "키움",
};

export default async function handler(req) {
  try {
    // KBO 공식 순위 API
    const year = new Date().getFullYear();
    const kboUrl = `https://www.koreabaseball.com/ws/Ranking.asmx/GetTeamRankingList?leId=1&srId=0&seasonId=${year}`;

    const res = await fetch(kboUrl, {
      headers: {
        "Referer": "https://www.koreabaseball.com/",
        "User-Agent": "Mozilla/5.0",
        "Accept": "application/xml, text/xml",
      },
    });

    if (!res.ok) throw new Error(`KBO Ranking API error: ${res.status}`);
    const text = await res.text();

    const teams = [];
    const rows = text.match(/<row>([\s\S]*?)<\/row>/g) || [];

    for (const row of rows) {
      const get = (tag) => {
        const m = row.match(new RegExp(`<${tag}>([^<]*)</${tag}>`));
        return m ? m[1].trim() : "";
      };

      const wins = parseInt(get("win")) || 0;
      const losses = parseInt(get("lose")) || 0;
      const draws = parseInt(get("drawn")) || 0;
      const totalGames = wins + losses + draws;
      const winRate = totalGames > 0 ? wins / (wins + losses) : 0;

      teams.push({
        rank: parseInt(get("rank")) || teams.length + 1,
        teamName: get("teamName"),
        wins,
        draws,
        losses,
        winRate: parseFloat(winRate.toFixed(3)),
        gamesBack: get("gb") || "-",
        recent10Games: get("last10") || "",
      });
    }

    // rank 순 정렬
    teams.sort((a, b) => a.rank - b.rank);

    return new Response(JSON.stringify({ code: "OK", data: teams }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "s-maxage=300, stale-while-revalidate=600", // 5분 캐시
      },
    });
  } catch (e) {
    return new Response(JSON.stringify({ code: "ERROR", message: e.message, data: [] }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }
}

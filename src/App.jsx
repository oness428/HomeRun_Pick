import { useState, useEffect, useCallback } from "react";

// ── 팀 데이터 ─────────────────────────────────────────────
const TEAMS = {
  KIA:  { name: "KIA 타이거즈",  short: "KIA",  color: "#C8102E", bg: "#FFF0F0", logo: "https://6ptotvmi5753.edge.naverncp.com/KBO_IMAGE/emblem/regular/fixed/emblem_HT.png" },
  SS:   { name: "삼성 라이온즈",  short: "삼성",  color: "#1428A0", bg: "#F0F0FF", logo: "https://6ptotvmi5753.edge.naverncp.com/KBO_IMAGE/emblem/regular/fixed/emblem_SS.png" },
  LG:   { name: "LG 트윈스",     short: "LG",   color: "#C40D2E", bg: "#FFF0F0", logo: "https://6ptotvmi5753.edge.naverncp.com/KBO_IMAGE/emblem/regular/fixed/emblem_LG.png" },
  DB:   { name: "두산 베어스",    short: "두산",  color: "#131230", bg: "#F0F0F5", logo: "https://6ptotvmi5753.edge.naverncp.com/KBO_IMAGE/emblem/regular/fixed/emblem_OB.png" },
  KT:   { name: "KT 위즈",       short: "KT",   color: "#000000", bg: "#F5F5F5", logo: "https://6ptotvmi5753.edge.naverncp.com/KBO_IMAGE/emblem/regular/fixed/emblem_KT.png" },
  SSG:  { name: "SSG 랜더스",    short: "SSG",  color: "#CE0E2D", bg: "#FFF0F0", logo: "https://6ptotvmi5753.edge.naverncp.com/KBO_IMAGE/emblem/regular/fixed/emblem_SK.png" },
  LOT:  { name: "롯데 자이언츠",  short: "롯데",  color: "#002561", bg: "#F0F0FF", logo: "https://6ptotvmi5753.edge.naverncp.com/KBO_IMAGE/emblem/regular/fixed/emblem_LT.png" },
  HH:   { name: "한화 이글스",    short: "한화",  color: "#F0501B", bg: "#FFF4F0", logo: "https://6ptotvmi5753.edge.naverncp.com/KBO_IMAGE/emblem/regular/fixed/emblem_HH.png" },
  NC:   { name: "NC 다이노스",    short: "NC",   color: "#1D5B9E", bg: "#F0F5FF", logo: "https://6ptotvmi5753.edge.naverncp.com/KBO_IMAGE/emblem/regular/fixed/emblem_NC.png" },
  KIW:  { name: "키움 히어로즈",  short: "키움",  color: "#820024", bg: "#FFF0F3", logo: "https://6ptotvmi5753.edge.naverncp.com/KBO_IMAGE/emblem/regular/fixed/emblem_WO.png" },
};

// ── 게임 데이터 ───────────────────────────────────────────
const TODAY = new Date();
const fmt = (h, m) => `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}`;

const INITIAL_GAMES = [
  {
    id: 1, home: "KIA", away: "NC",
    time: fmt(18, 30), stadium: "광주-기아 챔피언스 필드",
    status: "upcoming", pick: null, result: null,
    homeOdds: 1.65, awayOdds: 2.10, homeScore: 0, awayScore: 0,
  },
  {
    id: 2, home: "DB", away: "SSG",
    time: fmt(18, 30), stadium: "잠실야구장",
    status: "upcoming", pick: null, result: null,
    homeOdds: 1.80, awayOdds: 1.90, homeScore: 0, awayScore: 0,
  },
  {
    id: 3, home: "KIW", away: "LG",
    time: fmt(18, 30), stadium: "고척 스카이돔",
    status: "upcoming", pick: null, result: null,
    homeOdds: 1.70, awayOdds: 2.00, homeScore: 0, awayScore: 0,
  },
  {
    id: 4, home: "SS", away: "HH",
    time: fmt(18, 30), stadium: "대구 삼성 라이온즈 파크",
    status: "upcoming", pick: null, result: null,
    homeOdds: 1.55, awayOdds: 2.30, homeScore: 0, awayScore: 0,
  },
  {
    id: 5, home: "KT", away: "LOT",
    time: fmt(18, 30), stadium: "수원 KT 위즈 파크",
    status: "upcoming", pick: null, result: null,
    homeOdds: 1.60, awayOdds: 2.20, homeScore: 0, awayScore: 0,
  },
];

// Vercel Serverless API (kbo-scraper 백엔드 불필요)
const API_BASE_URL = import.meta.env.VITE_API_URL || "";
const GAME_SCHEDULE_API_URL = `${API_BASE_URL}/api/games`;
const TEAM_RECORD_API_URL = `${API_BASE_URL}/api/team-record`;

// kbo-scraper의 전체 팀 이름을 홈런픽의 고유 ID로 변환합니다.
const getTeamId = (fullName) => {
  if (!fullName) return "KIA";
  if (fullName.includes("KIA") || fullName.includes("기아")) return "KIA";
  if (fullName.includes("삼성")) return "SS";
  if (fullName.includes("LG")) return "LG";
  if (fullName.includes("두산")) return "DB";
  if (fullName.includes("KT") || fullName.includes("kt")) return "KT";
  if (fullName.includes("SSG")) return "SSG";
  if (fullName.includes("롯데")) return "LOT";
  if (fullName.includes("한화")) return "HH";
  if (fullName.includes("NC") || fullName.includes("nc")) return "NC";
  if (fullName.includes("키움")) return "KIW";
  return "KIA"; // fallback
};

// ── 히스토리 데이터 ───────────────────────────────────────
// 실제 운영에서는 로컬스토리지나 DB에서 불러옵니다.
const HISTORY = [];

// 랭킹 데이터는 나중에 백엔드에서 가져오도록 변경 (현재는 비워둠)
const INITIAL_RANKING = [];

// ── 유틸 ─────────────────────────────────────────────────
const pct = (a, b) => b === 0 ? 0 : Math.round((a / b) * 100);
const dateStr = () => {
  const d = TODAY;
  const days = ["일","월","화","수","목","금","토"];
  return `${d.getMonth()+1}월 ${d.getDate()}일 (${days[d.getDay()]})`;
};

// ── 색상 ─────────────────────────────────────────────────
const C = {
  navy:   "#0E1E45",
  red:    "#E8231A",
  gold:   "#F5A623",
  silver: "#9B9B9B",
  bronze: "#CD7F32",
  bg:     "#F4F6FA",
  card:   "#FFFFFF",
  text:   "#1A1A2E",
  sub:    "#6B7280",
  border: "#E5E7EB",
  green:  "#22C55E",
};

// ── KBO 정규시즌 시간 규정 ───────────────────────────────
const getFirstGameStartTime = (d = new Date()) => {
  const month = d.getMonth() + 1;
  const date = d.getDate();
  const day = d.getDay(); // 0: Sun, 1: Mon, ..., 6: Sat

  if (month === 5 && date === 1) return { h: 17, m: 0 }; // 노동절

  if (day >= 1 && day <= 5) return { h: 18, m: 30 }; // 평일

  if (month === 6) return { h: 17, m: 0 }; // 6월 주말
  if (month === 7 || month === 8) return { h: 18, m: 0 }; // 7-8월 주말

  // 3~5월, 9~10월 주말
  if (day === 6) return { h: 17, m: 0 }; // 토
  if (day === 0) return { h: 14, m: 0 }; // 일

  return { h: 18, m: 30 };
};

const isPredictionLocked = (gameTimeStr) => {
  if (!gameTimeStr) return false;
  const [h, m] = gameTimeStr.split(":").map(Number);
  const now = new Date();
  const gameTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0);
  const lockTime = new Date(gameTime.getTime() - 30 * 60 * 1000); // 30분 전
  return now >= lockTime;
};

export default function App() {
  const [tab, setTab] = useState("home");
  const [games, setGames] = useState([]);
  const [toast, setToast] = useState(null);
  const [animPick, setAnimPick] = useState(null);
  const [isOffTime, setIsOffTime] = useState(false);
  const [userRankings, setUserRankings] = useState(INITIAL_RANKING);
  const [teamRecords, setTeamRecords] = useState([
    { rank: 1, teamName: "KT", wins: 12, draws: 0, losses: 5, winRate: 0.706, recent10Games: "8승 2패" },
    { rank: 2, teamName: "LG", wins: 11, draws: 1, losses: 6, winRate: 0.647, recent10Games: "7승 3패" },
    { rank: 3, teamName: "삼성", wins: 10, draws: 0, losses: 7, winRate: 0.588, recent10Games: "6승 4패" },
    { rank: 4, teamName: "SSG", wins: 10, draws: 0, losses: 8, winRate: 0.556, recent10Games: "5승 5패" },
    { rank: 5, teamName: "두산", wins: 9, draws: 1, losses: 8, winRate: 0.529, recent10Games: "5승 5패" },
    { rank: 6, teamName: "KIA", wins: 8, draws: 0, losses: 9, winRate: 0.471, recent10Games: "4승 6패" },
    { rank: 7, teamName: "한화", wins: 7, draws: 0, losses: 10, winRate: 0.412, recent10Games: "4승 6패" },
    { rank: 8, teamName: "롯데", wins: 7, draws: 0, losses: 11, winRate: 0.389, recent10Games: "3승 7패" },
    { rank: 9, teamName: "NC", wins: 6, draws: 0, losses: 12, winRate: 0.333, recent10Games: "3승 7패" },
    { rank: 10, teamName: "키움", wins: 5, draws: 0, losses: 13, winRate: 0.278, recent10Games: "2승 8패" },
  ]);

  const [yesterdayGames, setYesterdayGames] = useState([]);

  // 시간 체크 (오전 12시 ~ 경기 시작 2시간 전)
  useEffect(() => {
    const checkTime = () => {
      const now = new Date();
      const firstGame = getFirstGameStartTime(now);
      const firstGameDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), firstGame.h, firstGame.m, 0);
      const wakeupTime = new Date(firstGameDate.getTime() - 1 * 60 * 60 * 1000); // 1시간 전
      
      setIsOffTime(now.getHours() >= 0 && now < wakeupTime);
    };
    checkTime();
    const timer = setInterval(checkTime, 30000); // 30초마다 체크
    return () => clearInterval(timer);
  }, []);

  // 백엔드 API 연동: 실시간 데이터 가져오기
  useEffect(() => {
    const fetchGames = async () => {
      try {
        // 오늘 날짜를 YYYY-MM-DD 형태로 가져오기
        const todayStr = new Date().toLocaleDateString('ko-KR', {
          year: 'numeric', month: '2-digit', day: '2-digit'
        }).replace(/\. /g, '-').replace('.', '');
        
        const res = await fetch(`${GAME_SCHEDULE_API_URL}/${todayStr}`);
        const responseData = await res.json();
        
        if (responseData.code === "OK" && responseData.data && responseData.data.length > 0) {
          const mappedData = responseData.data;  // 이미 매핑 완료된 형태

          // 사용자가 선택한 예측(Pick)은 유지하면서 점수와 상태만 업데이트
          setGames(prev => {
            if (prev.length === 0 || prev[0].id === 1) return mappedData; // 가짜 데이터면 교체
            return mappedData.map(newGame => {
              const oldGame = prev.find(g => g.id === newGame.id);
              return oldGame ? { ...newGame, pick: oldGame.pick } : newGame;
            });
          });
        }
      } catch (e) {
        console.error("서버에서 데이터를 가져오지 못했습니다. 가짜 데이터를 보여줍니다.", e);
        // 서버가 꺼져있을 때 빈 화면이 나오지 않도록 가짜 데이터를 넣어줍니다.
        setGames(prev => {
          if (prev.length === 0) return INITIAL_GAMES;
          // 가상으로 실시간 점수 올리기 (프론트 단독 작동용)
          return prev.map(g => {
            if (g.status !== "live") return g;
            if (Math.random() < 0.1) {
              const isHomeScore = Math.random() > 0.5;
              return {
                ...g,
                homeScore: isHomeScore ? g.homeScore + 1 : g.homeScore,
                awayScore: !isHomeScore ? g.awayScore + 1 : g.awayScore,
              };
            }
            return g;
          });
        });
      }
    };

    fetchGames(); // 최초 즉시 실행
    const timer = setInterval(fetchGames, 5000); // 5초마다 백엔드 폴링(실시간 갱신)

    const fetchTeamRecords = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/standings`, { signal: AbortSignal.timeout(5000) });
        const responseData = await res.json();
        if (responseData.code === "OK" && responseData.data && responseData.data.length > 0) {
          setTeamRecords(responseData.data);
        }
        // 실패 시 기존 hardcoded 초기값 유지
      } catch (e) {
        console.error("팀 순위 데이터를 가져오지 못했습니다.", e);
      }
    };
    fetchTeamRecords();
    const standingsTimer = setInterval(fetchTeamRecords, 300000); // 5분마다 갱신

    const fetchYesterday = async () => {
      try {
        const yesterday = new Date(Date.now() - 86400000);
        const yStr = yesterday.toLocaleDateString('ko-KR', {
          year: 'numeric', month: '2-digit', day: '2-digit'
        }).replace(/\. /g, '-').replace('.', '');
        const res = await fetch(`${GAME_SCHEDULE_API_URL}/${yStr}`, { signal: AbortSignal.timeout(5000) });
        const responseData = await res.json();
        if (responseData.code === "OK" && responseData.data && responseData.data.length > 0) {
          setYesterdayGames(responseData.data);
        } else {
          // 백엔드 없을 때 5/10(일) 실제 경기 결과 fallback
          setYesterdayGames([
            { id: "y1", home: "DB",  away: "SSG", status: "ended", homeScore: 3,  awayScore: 1, time: "14:00", stadium: "잠실" },
            { id: "y2", home: "LOT", away: "KIA", status: "ended", homeScore: 7,  awayScore: 3, time: "14:00", stadium: "부산" },
            { id: "y3", home: "NC",  away: "SS",  status: "ended", homeScore: 1,  awayScore: 11, time: "14:00", stadium: "창원" },
            { id: "y4", home: "KIW", away: "KT",  status: "ended", homeScore: 5,  awayScore: 1, time: "14:00", stadium: "고척" },
            { id: "y5", home: "HH",  away: "LG",  status: "ended", homeScore: 9,  awayScore: 3, time: "14:00", stadium: "대전" },
          ]);
        }
      } catch (e) {
        console.error("어제 경기를 가져오지 못했습니다. 기본 데이터를 표시합니다.", e);
        setYesterdayGames([
          { id: "y1", home: "DB",  away: "SSG", status: "ended", homeScore: 3,  awayScore: 1, time: "14:00", stadium: "잠실" },
          { id: "y2", home: "LOT", away: "KIA", status: "ended", homeScore: 7,  awayScore: 3, time: "14:00", stadium: "부산" },
          { id: "y3", home: "NC",  away: "SS",  status: "ended", homeScore: 1,  awayScore: 11, time: "14:00", stadium: "창원" },
          { id: "y4", home: "KIW", away: "KT",  status: "ended", homeScore: 5,  awayScore: 1, time: "14:00", stadium: "고척" },
          { id: "y5", home: "HH",  away: "LG",  status: "ended", homeScore: 9,  awayScore: 3, time: "14:00", stadium: "대전" },
        ]);
      }
    };
    fetchYesterday();

    return () => { clearInterval(timer); clearInterval(standingsTimer); };
  }, []);

  const showToast = useCallback((msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2200);
  }, []);

  const handlePick = useCallback((gameId, side) => {
    const g = games.find(g => g.id === gameId);
    if (!g) return;

    if (isPredictionLocked(g.time)) {
      showToast("경기 시작 30분 전 마감되었습니다.", "error");
      return;
    }

    setGames(prev => prev.map(g => {
      if (g.id !== gameId) return g;
      if (g.pick === side) return { ...g, pick: null };
      return { ...g, pick: side };
    }));
    setAnimPick(`${gameId}-${side}`);
    setTimeout(() => setAnimPick(null), 500);
    const t = TEAMS[side === "home" ? g.home : g.away];
    showToast(`${t.short} 승리 예측!`);
  }, [games, showToast]);

  // stats
  // 실제 픽망 운영: pick은 사용자가 직접 선택한 종료 경기만 카운트
  const pickedGames = games.filter(g => g.pick && g.status === "ended");
  const wins = pickedGames.filter(g => g.pick === g.result).length;
  const total = pickedGames.length;
  const totalWins = wins;
  const streak = 0; // 향후 DB/로컬스토리지 기반 연속 적중 계산

  return (
    <div style={{
      fontFamily: "'Pretendard','Apple SD Gothic Neo','Noto Sans KR',sans-serif",
      background: C.bg, minHeight: "100vh", maxWidth: 430,
      margin: "0 auto", display: "flex", flexDirection: "column",
      position: "relative", overflow: "hidden",
    }}>
      {/* 상단 헤더 */}
      <Header />

      {/* 탭 컨텐츠 */}
      <div style={{ flex: 1, overflowY: "auto", paddingBottom: 72, position: "relative" }}>
        {tab === "home" && (
          isOffTime ? <OffTimePopup yesterdayGames={yesterdayGames} /> : <HomeTab games={games} yesterdayGames={yesterdayGames} onPick={handlePick} animPick={animPick} />
        )}
        {tab === "league"  && <LeagueTab records={teamRecords} />}
        {tab === "stats"   && <StatsTab totalWins={totalWins} total={total} streak={streak} pickedGames={pickedGames} />}
        {tab === "ranking" && <RankingTab rankings={userRankings} />}
      </div>

      {/* 하단 탭 바 */}
      <BottomNav tab={tab} setTab={setTab} />

      {/* 토스트 */}
      {toast && <Toast msg={toast.msg} type={toast.type} />}
    </div>
  );
}

// ── 오프타임 팝업 ──────────────────────────────────────────
function OffTimePopup({ yesterdayGames }) {
  return (
    <div style={{ padding: "60px 24px", textAlign: "center", minHeight: "100%", background: C.bg }}>
      <div style={{
        background: "#fff", padding: "44px 28px", borderRadius: 28,
        boxShadow: "0 25px 50px rgba(0,0,0,0.05)",
        margin: "0 auto", maxWidth: 340,
        animation: "slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
      }}>
        <div style={{ fontSize: 64, marginBottom: 24 }}>⏰</div>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: C.text, marginBottom: 14, letterSpacing: -0.5 }}>
          지금은 경기 시간이 아니에요
        </h2>
        <p style={{ fontSize: 14, color: C.sub, lineHeight: 1.7, marginBottom: 0, wordBreak: "keep-all" }}>
          정확한 예측을 위해 경기 시작<br/>
          <span style={{ color: C.navy, fontWeight: 800, borderBottom: `2px solid ${C.red}` }}>1시간 전</span>에 다시 찾아올게요!
        </p>
      </div>

      <div style={{ marginTop: 40, textAlign: "left", width: "100%" }}>
        <div style={{ padding: "0 16px", marginBottom: 12, fontSize: 16, fontWeight: 800, color: C.text }}>
          ✅ 이전 경기 결과
        </div>
        <div style={{ padding: "0 16px" }}>
          {yesterdayGames && yesterdayGames.length > 0 ? (
            yesterdayGames.map(g => <GameCard key={g.id} game={g} />)
          ) : (
            <div style={{ background: "#fff", padding: "20px", borderRadius: 16, textAlign: "center", color: C.sub, fontSize: 13, border: `1px solid ${C.border}` }}>
              이전 경기 결과가 없습니다.
            </div>
          )}
        </div>
      </div>
      
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

// ── 헤더 ─────────────────────────────────────────────────
function Header() {
  return (
    <div style={{
      background: C.navy, padding: "14px 20px 16px",
      display: "flex", alignItems: "center", justifyContent: "space-between",
    }}>
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 22, fontWeight: 800, color: "#fff", letterSpacing: -1 }}>
            홈런픽
          </span>
          <span style={{
            background: C.red, color: "#fff", fontSize: 9, fontWeight: 700,
            padding: "2px 6px", borderRadius: 4, letterSpacing: 1,
          }}>ALPHA</span>
        </div>
        <div style={{ fontSize: 11, color: "#8899BB", marginTop: 2 }}>
          {dateStr()} · KBO 승부예측
        </div>
      </div>
      <div style={{
        width: 36, height: 36, borderRadius: "50%",
        background: "rgba(255,255,255,0.12)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 16,
      }}>⚾</div>
    </div>
  );
}

// ── 리그 순위 탭 ──────────────────────────────────────────
function LeagueTab({ records }) {
  if (!records || records.length === 0) {
    return <div style={{ padding: 40, textAlign: "center", color: C.sub }}>순위 데이터를 불러오는 중...</div>;
  }

  return (
    <div style={{ padding: "16px 16px 8px" }}>
      <div style={{
        background: C.card, borderRadius: 16, overflow: "hidden",
        border: `1px solid ${C.border}`, boxShadow: "0 4px 12px rgba(0,0,0,0.05)"
      }}>
        <div style={{
          padding: "16px", background: C.navy, color: "#fff",
          display: "flex", justifyContent: "space-between", alignItems: "center"
        }}>
          <span style={{ fontWeight: 800, fontSize: 15 }}>2026 KBO 리그 순위</span>
          <span style={{ fontSize: 11, opacity: 0.8 }}>실시간 업데이트</span>
        </div>
        
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "#F9FAFB", borderBottom: `1px solid ${C.border}` }}>
              <th style={{ padding: "12px 8px", textAlign: "center", width: 40, color: C.sub }}>순위</th>
              <th style={{ padding: "12px 8px", textAlign: "left", color: C.sub }}>팀명</th>
              <th style={{ padding: "12px 4px", textAlign: "center", color: C.sub }}>승</th>
              <th style={{ padding: "12px 4px", textAlign: "center", color: C.sub }}>무</th>
              <th style={{ padding: "12px 4px", textAlign: "center", color: C.sub }}>패</th>
              <th style={{ padding: "12px 8px", textAlign: "center", color: C.sub }}>승률</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r, idx) => {
              const teamId = getTeamId(r.teamName);
              const team = TEAMS[teamId];
              return (
                <tr key={r.teamName} style={{ borderBottom: idx < records.length - 1 ? `1px solid ${C.border}` : "none" }}>
                  <td style={{ padding: "14px 8px", textAlign: "center", fontWeight: idx < 3 ? 800 : 500, color: idx < 3 ? C.navy : C.text }}>
                    {r.rank}
                  </td>
                  <td style={{ padding: "14px 8px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <img src={team?.logo} style={{ width: 24, height: 24, objectFit: "contain" }} alt="" />
                      <span style={{ fontWeight: 600 }}>{team?.short || r.teamName}</span>
                    </div>
                  </td>
                  <td style={{ padding: "14px 4px", textAlign: "center", fontWeight: 700 }}>{r.wins}</td>
                  <td style={{ padding: "14px 4px", textAlign: "center", color: C.sub }}>{r.draws}</td>
                  <td style={{ padding: "14px 4px", textAlign: "center" }}>{r.losses}</td>
                  <td style={{ padding: "14px 8px", textAlign: "center", fontWeight: 600, color: C.navy }}>
                    {r.winRate.toFixed(3).substring(1)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div style={{ marginTop: 12, fontSize: 11, color: C.sub, textAlign: "center" }}>
        * KBO 공식 기록실 데이터를 바탕으로 제공됩니다.
      </div>
    </div>
  );
}

// ── 홈 탭 ─────────────────────────────────────────────────
function HomeTab({ games, yesterdayGames, onPick, animPick }) {
  const live = games.filter(g => g.status === "live");
  const upcoming = games.filter(g => g.status === "upcoming");
  const ended = games.filter(g => g.status === "ended");
  const pickedCount = upcoming.filter(g => g.pick).length;

  return (
    <div style={{ padding: "16px 16px 8px" }}>
      {/* 예측 현황 배너 */}
      <div style={{
        background: `linear-gradient(135deg, ${C.navy} 0%, #1A3060 100%)`,
        borderRadius: 14, padding: "14px 18px", marginBottom: 16,
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <div>
          <div style={{ color: "#8899BB", fontSize: 11, marginBottom: 4 }}>오늘의 예측 현황</div>
          <div style={{ color: "#fff", fontSize: 20, fontWeight: 800 }}>
            {pickedCount} <span style={{ fontSize: 13, fontWeight: 400, color: "#8899BB" }}>/ {upcoming.length}경기 예측 완료</span>
          </div>
        </div>
        <div style={{
          width: 52, height: 52, borderRadius: "50%",
          border: `3px solid ${pickedCount === upcoming.length && upcoming.length > 0 ? C.green : C.red}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 11, fontWeight: 700,
          color: pickedCount === upcoming.length && upcoming.length > 0 ? C.green : C.red,
        }}>
          {upcoming.length === 0 ? "완료" : `${pickedCount}/${upcoming.length}`}
        </div>
      </div>

      {/* 진행 중 */}
      {live.length > 0 && (
        <Section title="🔴 진행 중">
          {live.map(g => <GameCard key={g.id} game={g} onPick={onPick} animPick={animPick} />)}
        </Section>
      )}

      {/* 예측 가능 */}
      <Section title={`⚾ 오늘 경기 (${upcoming.length})`}>
        {upcoming.length === 0 && live.length === 0
          ? <EmptyCard msg="오늘 예정된 경기가 없어요" />
          : upcoming.map(g => <GameCard key={g.id} game={g} onPick={onPick} animPick={animPick} />)
        }
      </Section>

      {/* 종료된 경기 */}
      {ended.length > 0 && (
        <Section title={`✅ 오늘 종료된 경기 (${ended.length})`}>
          {ended.map(g => <GameCard key={g.id} game={g} onPick={onPick} animPick={animPick} />)}
        </Section>
      )}

      {/* 어제 경기 결과 */}
      {upcoming.length > 0 && live.length === 0 && ended.length === 0 && yesterdayGames && yesterdayGames.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <Section title="✅ 이전 경기 결과">
            {yesterdayGames.map(g => <GameCard key={g.id} game={g} />)}
          </Section>
        </div>
      )}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: C.sub, marginBottom: 8, paddingLeft: 2 }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function GameCard({ game, onPick, animPick }) {
  const home = TEAMS[game.home];
  const away = TEAMS[game.away];
  const isEnded = game.status === "ended";
  const homeWon = game.result === "home";
  const awayWon = game.result === "away";
  const pickHome = game.pick === "home";
  const pickAway = game.pick === "away";
  const correct = game.pick && game.pick === game.result;
  const wrong   = game.pick && game.result && game.pick !== game.result;

  const animH = animPick === `${game.id}-home`;
  const animA = animPick === `${game.id}-away`;

  return (
    <div style={{
      background: C.card, borderRadius: 14, marginBottom: 10,
      border: `1.5px solid ${correct ? "#22C55E33" : wrong ? "#EF444433" : C.border}`,
      overflow: "hidden",
      boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
    }}>
      {/* 경기 상단 정보 */}
      <div style={{
        padding: "8px 14px", background: "#F9FAFB",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        borderBottom: `1px solid ${C.border}`,
      }}>
        <span style={{ fontSize: 11, color: C.sub }}>{game.stadium}</span>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {isEnded && (
            <span style={{
              fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 4,
              background: correct ? "#DCFCE7" : wrong ? "#FEE2E2" : "#F3F4F6",
              color: correct ? "#16A34A" : wrong ? "#DC2626" : C.sub,
            }}>
              {correct ? "✓ 적중" : wrong ? "✗ 실패" : "종료"}
            </span>
          )}
          <span style={{ fontSize: 12, fontWeight: 600, color: isEnded ? C.sub : (game.status === "live" ? C.red : C.text) }}>
            {isEnded ? "경기 종료" : game.status === "live" ? "🔴 LIVE" : `⏰ ${game.time}`}
          </span>
        </div>
      </div>

      {/* 팀 대결 */}
      <div style={{ padding: "14px 14px 12px", display: "flex", alignItems: "center", gap: 8 }}>
        {/* 원정팀 */}
        <TeamButton
          team={away} side="away" game={game}
          picked={pickAway} won={awayWon} isEnded={isEnded}
          anim={animA} onPick={onPick}
          odds={game.awayOdds}
        />

        {/* VS / 스코어 */}
        <div style={{ flex: "0 0 52px", textAlign: "center" }}>
          {isEnded || game.status === "live" ? (
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: game.status === "live" ? C.red : C.text, letterSpacing: -1 }}>
                {game.awayScore} <span style={{ color: C.border, fontWeight: 400 }}>:</span> {game.homeScore}
              </div>
              <div style={{ fontSize: 10, color: game.status === "live" ? C.red : C.sub, fontWeight: game.status === "live" ? 700 : 400 }}>
                {game.status === "live" ? "진행중" : "최종"}
              </div>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: C.sub }}>VS</div>
              <div style={{ fontSize: 10, color: "#CCC" }}>원정 · 홈</div>
            </div>
          )}
        </div>

        {/* 홈팀 */}
        <TeamButton
          team={home} side="home" game={game}
          picked={pickHome} won={homeWon} isEnded={isEnded}
          anim={animH} onPick={onPick}
          odds={game.homeOdds}
          isHome
        />
      </div>
    </div>
  );
}

function TeamButton({ team, side, game, picked, won, isEnded, anim, onPick, odds, isHome }) {
  const active = picked;
  const correct = picked && won;
  const wrong   = picked && isEnded && !won;

  return (
    <button
      onClick={() => !isEnded && onPick(game.id, side)}
      style={{
        flex: 1, border: "none", cursor: isEnded ? "default" : "pointer",
        borderRadius: 10, padding: "10px 6px",
        background: correct ? "#DCFCE7"
                  : wrong   ? "#FEE2E2"
                  : active  ? `${team.color}15`
                  : isEnded && won ? "#F0F9FF"
                  : "rgba(255,255,255,0.4)",
        border: `1.5px solid ${
          correct   ? "#86EFAC"
          : wrong   ? "#FCA5A5"
          : active  ? team.color
          : isEnded && won ? "#BAE6FD"
          : "transparent"
        }`,
        transition: "all 0.2s",
        transform: anim ? "scale(0.94)" : "scale(1)",
        textAlign: "center",
      }}
    >
      <div style={{ width: 56, height: 56, marginBottom: 6, display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", margin: "0 auto" }}>
        <img 
          src={team.logo} 
          alt={team.name} 
          style={{ 
            maxWidth: "100%", 
            maxHeight: "100%", 
            objectFit: "contain", 
            background: "transparent",
            transform: team.short === "두산" ? "scale(1.15)" : "none" 
          }} 
        />
      </div>
      <div style={{ fontSize: 11, fontWeight: 700, color: C.text, marginBottom: 1 }}>
        {team.short}
      </div>
      {!isEnded && (
        <div style={{ fontSize: 10, color: active ? team.color : C.sub }}>
          {active ? "✓ 선택됨" : `배율 ${odds}`}
        </div>
      )}
      {isEnded && won && (
        <div style={{ fontSize: 10, color: "#0284C7", fontWeight: 600 }}>승리</div>
      )}
      {isEnded && !won && (
        <div style={{ fontSize: 10, color: C.sub }}>패배</div>
      )}
    </button>
  );
}

function EmptyCard({ msg }) {
  return (
    <div style={{
      background: C.card, borderRadius: 14, padding: "24px 0",
      textAlign: "center", color: C.sub, fontSize: 13,
      border: `1.5px solid ${C.border}`,
    }}>
      {msg}
    </div>
  );
}

// ── 통계 탭 ───────────────────────────────────────────────
function StatsTab({ totalWins, total, streak, pickedGames }) {
  if (total === 0 && (!pickedGames || pickedGames.length === 0)) {
    return (
      <div style={{ padding: "80px 24px", textAlign: "center" }}>
        <div style={{ fontSize: 64, marginBottom: 20 }}>📊</div>
        <div style={{ fontSize: 18, fontWeight: 800, color: C.text, marginBottom: 8 }}>
          아직 예측 기록이 없습니다
        </div>
        <div style={{ fontSize: 14, color: C.sub, lineHeight: 1.6 }}>
          오늘의 경기를 예측하고<br/>첫 번째 적중 기록을 만들어보세요!
        </div>
      </div>
    );
  }

  const rate = pct(totalWins, total);

  const getRateColor = (r) =>
    r >= 70 ? "#22C55E" : r >= 50 ? C.gold : C.red;

  return (
    <div style={{ padding: "16px 16px 8px" }}>
      {/* 메인 적중률 카드 */}
      <div style={{
        background: C.navy, borderRadius: 18, padding: "24px 20px",
        marginBottom: 16, textAlign: "center",
      }}>
        <div style={{ color: "#8899BB", fontSize: 12, marginBottom: 8 }}>나의 전체 적중률</div>
        <div style={{
          fontSize: 64, fontWeight: 900, color: getRateColor(rate),
          lineHeight: 1, letterSpacing: -2,
        }}>
          {rate}<span style={{ fontSize: 28, color: "#8899BB" }}>%</span>
        </div>
        <div style={{ color: "#8899BB", fontSize: 12, marginTop: 8 }}>
          총 {total}경기 중 {totalWins}경기 적중
        </div>

        {/* 진행 바 */}
        <div style={{
          height: 6, background: "rgba(255,255,255,0.1)", borderRadius: 3,
          marginTop: 14, overflow: "hidden",
        }}>
          <div style={{
            width: `${rate}%`, height: "100%",
            background: getRateColor(rate), borderRadius: 3,
            transition: "width 1s ease",
          }} />
        </div>
      </div>

      {/* 스탯 카드 3개 */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 16 }}>
        {[
          { label: "총 예측", value: total, unit: "경기", icon: "⚾" },
          { label: "적중",    value: totalWins, unit: "경기", icon: "✅" },
          { label: "연속 적중", value: streak, unit: "연속", icon: "🔥" },
        ].map(s => (
          <div key={s.label} style={{
            background: C.card, borderRadius: 12, padding: "12px 10px",
            textAlign: "center", border: `1px solid ${C.border}`,
          }}>
            <div style={{ fontSize: 20, marginBottom: 4 }}>{s.icon}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: C.text }}>{s.value}</div>
            <div style={{ fontSize: 10, color: C.sub }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* 히스토리 */}
      <div style={{
        background: C.card, borderRadius: 14, overflow: "hidden",
        border: `1px solid ${C.border}`,
      }}>
        <div style={{
          padding: "12px 16px", borderBottom: `1px solid ${C.border}`,
          fontSize: 13, fontWeight: 700, color: C.text,
        }}>
          최근 예측 기록
        </div>
        {HISTORY.map((h, i) => {
          const home = TEAMS[h.home];
          const away = TEAMS[h.away];
          const pickedTeam = h.pick === "home" ? home : away;
          return (
            <div key={i} style={{
              padding: "11px 16px",
              borderBottom: i < HISTORY.length - 1 ? `1px solid ${C.border}` : "none",
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 38, height: 38, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <img src={pickedTeam.logo} alt={pickedTeam.name} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: C.text }}>
                    {away.short} vs {home.short}
                  </div>
                  <div style={{ fontSize: 11, color: C.sub }}>
                    {h.date} · {pickedTeam.short} 예측
                  </div>
                </div>
              </div>
              <span style={{
                fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 6,
                background: h.win ? "#DCFCE7" : "#FEE2E2",
                color: h.win ? "#16A34A" : "#DC2626",
              }}>
                {h.win ? "✓ 적중" : "✗ 실패"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── 랭킹 탭 ───────────────────────────────────────────────
// ── 유저 랭킹 탭 ──────────────────────────────────────────
function RankingTab({ rankings }) {
  const medalColor = (r) =>
    r === 1 ? C.gold : r === 2 ? C.silver : r === 3 ? C.bronze : C.sub;

  if (!rankings || rankings.length === 0) {
    return (
      <div style={{ 
        padding: "80px 24px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center"
      }}>
        <div style={{ fontSize: 64, marginBottom: 20 }}>🌵</div>
        <div style={{ fontSize: 18, fontWeight: 800, color: C.text, marginBottom: 8 }}>
          아직 승부예측을 한 사람이 없습니다
        </div>
        <div style={{ fontSize: 14, color: C.sub, lineHeight: 1.6 }}>
          오늘 경기의 첫 번째 주인공이 되어보세요!<br/>
          승리를 예측하고 랭킹을 올려보세요.
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "16px 16px 8px" }}>
      {/* 상위 3인 포디움 */}
      {rankings.length >= 3 && (
        <div style={{
          background: C.navy, borderRadius: 18, padding: "20px 16px 16px",
          marginBottom: 16,
        }}>
          <div style={{ textAlign: "center", color: "#8899BB", fontSize: 11, marginBottom: 16 }}>
            🏆 이번 시즌 랭킹
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "center", gap: 8 }}>
            {[rankings[1], rankings[0], rankings[2]].map((r, idx) => {
              const isFirst = idx === 1;
              return (
                <div key={r.rank} style={{ textAlign: "center", flex: 1 }}>
                  <div style={{ fontSize: isFirst ? 28 : 22, marginBottom: 4 }}>
                    {r.rank === 1 ? "🥇" : r.rank === 2 ? "🥈" : "🥉"}
                  </div>
                  <div style={{
                    fontSize: 12, fontWeight: 700, color: "#fff",
                    marginBottom: 2,
                  }}>{r.name}</div>
                  <div style={{ fontSize: 11, color: "#8899BB" }}>
                    {pct(r.correct, r.total)}%
                  </div>
                  <div style={{
                    marginTop: 8,
                    height: isFirst ? 52 : idx === 0 ? 36 : 28,
                    background: `${medalColor(r.rank)}33`,
                    borderRadius: "6px 6px 0 0",
                    border: `1.5px solid ${medalColor(r.rank)}55`,
                  }} />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 전체 랭킹 리스트 */}
      <div style={{
        background: C.card, borderRadius: 14, overflow: "hidden",
        border: `1px solid ${C.border}`,
      }}>
        <div style={{
          padding: "12px 16px", borderBottom: `1px solid ${C.border}`,
          display: "flex", justifyContent: "space-between",
          fontSize: 11, color: C.sub, fontWeight: 600,
        }}>
          <span>순위 · 닉네임</span>
          <span>적중률 (적중/총)</span>
        </div>
        {rankings.map((r, i) => (
          <div key={r.rank} style={{
            padding: "13px 16px",
            borderBottom: i < rankings.length - 1 ? `1px solid ${C.border}` : "none",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            background: r.isMe ? "#EFF6FF" : "transparent",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{
                fontSize: r.rank <= 3 ? 18 : 13,
                fontWeight: r.rank <= 3 ? 400 : 700,
                color: medalColor(r.rank),
                minWidth: 24, textAlign: "center",
              }}>
                {r.rank <= 3 ? (r.rank === 1 ? "🥇" : r.rank === 2 ? "🥈" : "🥉") : r.rank}
              </span>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: r.isMe ? "#1D4ED8" : C.text }}>
                    {r.name}
                  </span>
                  {r.isMe && (
                    <span style={{
                      fontSize: 9, fontWeight: 700, padding: "1px 5px",
                      background: "#DBEAFE", color: "#1D4ED8", borderRadius: 4,
                    }}>나</span>
                  )}
                </div>
                {r.streak > 0 && (
                  <div style={{ fontSize: 10, color: C.sub }}>
                    🔥 {r.streak}연속 적중
                  </div>
                )}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{
                fontSize: 15, fontWeight: 800,
                color: pct(r.correct, r.total) >= 70 ? C.green : C.text,
              }}>
                {pct(r.correct, r.total)}%
              </div>
              <div style={{ fontSize: 10, color: C.sub }}>
                {r.correct}/{r.total}경기
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── 하단 탭 바 ────────────────────────────────────────────
function BottomNav({ tab, setTab }) {
  const tabs = [
    { id: "home",    label: "홈",    icon: "🏠" },
    { id: "league",  label: "KBO 순위",  icon: "🏆" },
    { id: "stats",   label: "내 기록", icon: "📊" },
    { id: "ranking", label: "유저",  icon: "👤" },
  ];

  return (
    <div style={{
      position: "fixed", bottom: 0, left: "50%",
      transform: "translateX(-50%)", width: "100%", maxWidth: 430,
      background: C.card, borderTop: `1px solid ${C.border}`,
      display: "flex", padding: "8px 0 12px",
      zIndex: 100,
    }}>
      {tabs.map(t => (
        <button key={t.id} onClick={() => setTab(t.id)}
          style={{
            flex: 1, border: "none", background: "transparent",
            cursor: "pointer", padding: "4px 0",
            display: "flex", flexDirection: "column",
            alignItems: "center", gap: 3,
          }}
        >
          <span style={{ fontSize: 20 }}>{t.icon}</span>
          <span style={{
            fontSize: 10, fontWeight: 600,
            color: tab === t.id ? C.navy : C.sub,
          }}>{t.label}</span>
          {tab === t.id && (
            <div style={{
              width: 20, height: 2.5, background: C.red,
              borderRadius: 2, marginTop: 1,
            }} />
          )}
        </button>
      ))}
    </div>
  );
}

// ── 토스트 ────────────────────────────────────────────────
function Toast({ msg }) {
  return (
    <div style={{
      position: "fixed", top: 74, left: "50%",
      transform: "translateX(-50%)",
      background: C.navy, color: "#fff",
      padding: "10px 20px", borderRadius: 24,
      fontSize: 13, fontWeight: 600,
      boxShadow: "0 4px 16px rgba(0,0,0,0.25)",
      zIndex: 999, whiteSpace: "nowrap",
      animation: "fadeIn 0.2s ease",
    }}>
      ⚾ {msg}
      <style>{`@keyframes fadeIn { from { opacity:0; transform:translateX(-50%) translateY(-8px); } to { opacity:1; transform:translateX(-50%) translateY(0); } }`}</style>
    </div>
  );
}

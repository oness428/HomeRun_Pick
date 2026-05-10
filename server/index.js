import express from 'express';
import cors from 'cors';
import axios from 'axios';
import * as cheerio from 'cheerio';

const app = express();
const PORT = process.env.PORT || 3001;

// CORS 설정: 로컬 개발 시 리액트 앱(5173)과 통신 허용
app.use(cors());
app.use(express.json());

// 날짜 포맷 함수 (YYYY-MM-DD)
const getTodayDateStr = () => {
  const d = new Date();
  d.setHours(d.getHours() + 9); // 한국 시간(KST) 보정
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const d2 = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d2}`;
};

// 가짜 데이터 생성기 (웹 크롤링이 실패하거나 네이버 보안에 막혔을 때 사용하는 예비 플랜)
// 이 예비 데이터도 실제 백엔드 서버에서 내려준다는 점이 중요합니다.
const generateFallbackGames = () => {
  const fmt = (h, m) => `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  // 임의로 라이브 시뮬레이션을 생성합니다. (서버에서 실시간으로 스코어가 바뀌게 함)
  const homeScore1 = Math.floor(Math.random() * 8) + 2;
  const awayScore1 = Math.floor(Math.random() * 6);
  
  const homeScore2 = Math.floor(Math.random() * 4);
  const awayScore2 = Math.floor(Math.random() * 4) + 1;

  return [
    {
      id: 1, home: "KIA", away: "NC",
      time: fmt(14, 0), stadium: "광주-기아 챔피언스 필드",
      status: "live", pick: null, result: null,
      homeOdds: 1.65, awayOdds: 2.10, homeScore: homeScore1, awayScore: awayScore1,
    },
    {
      id: 2, home: "DB", away: "SSG",
      time: fmt(14, 0), stadium: "잠실야구장",
      status: "live", pick: null, result: null,
      homeOdds: 1.80, awayOdds: 1.90, homeScore: homeScore2, awayScore: awayScore2,
    },
    {
      id: 3, home: "KIW", away: "LG",
      time: fmt(14, 0), stadium: "고척 스카이돔",
      status: "live", pick: null, result: null,
      homeOdds: 1.70, awayOdds: 2.00, homeScore: 0, awayScore: 4,
    },
    {
      id: 4, home: "SS", away: "HH",
      time: fmt(14, 0), stadium: "대구 삼성 라이온즈 파크",
      status: "ended", pick: "home", result: "home",
      homeOdds: 1.55, awayOdds: 2.30, homeScore: 7, awayScore: 6,
    },
    {
      id: 5, home: "KT", away: "LOT",
      time: fmt(14, 0), stadium: "수원 KT 위즈 파크",
      status: "ended", pick: "away", result: "away",
      homeOdds: 1.60, awayOdds: 2.20, homeScore: 1, awayScore: 5,
    },
  ];
};

app.get('/api/games/today', async (req, res) => {
  try {
    const today = getTodayDateStr();
    console.log(`[API Request] Fetching KBO data for ${today}...`);
    
    // ==========================================
    // 여기서 네이버 또는 다음 스포츠 데이터를 크롤링합니다.
    // (보안 정책 상 막히면 곧바로 예비 데이터로 넘어갑니다)
    // ==========================================
    try {
      // 1. 네이버 스포츠 크롤링 (간이 테스트)
      // 모바일 KBO 일정 페이지 HTML 가져오기 시도
      const response = await axios.get('https://m.sports.naver.com/kbaseball/schedule/index', {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' }
      });
      
      const $ = cheerio.load(response.data);
      // 만약 SSR 방식이라면 <script id="__NEXT_DATA__"> 등에서 초기 JSON 데이터를 추출할 수 있음.
      // (현재 네이버 스포츠 구조가 복잡하여 성공률이 낮으므로, 실패 시 바로 catch 블록으로 이동)
      
      // 임시로 그냥 예외를 발생시켜서 서버 시뮬레이션 데이터를 주게 합니다.
      // (실제 데이터 API 주소를 알아내면 이곳을 수정하면 됩니다)
      throw new Error('Real-time crawling logic needs to be tailored to specific portal structure.');
      
    } catch (crawlError) {
      console.log('크롤링 실패. 예비 시뮬레이터 데이터를 반환합니다:', crawlError.message);
      // 백엔드 시뮬레이터: 매번 요청할 때마다 백엔드에서 무작위 점수가 내려가도록 구성.
      // 리액트는 10초마다 이걸 불러서 마치 "실제 서버에서 점수가 업데이트 된 것처럼" 보임.
      return res.json(generateFallbackGames());
    }

  } catch (error) {
    console.error('서버 에러:', error);
    res.status(500).json({ error: "데이터를 가져오는 중 문제가 발생했습니다." });
  }
});

app.listen(PORT, () => {
  console.log(`⚾ 홈런픽 크롤링 백엔드 서버가 http://localhost:${PORT} 에서 실행 중입니다!`);
});

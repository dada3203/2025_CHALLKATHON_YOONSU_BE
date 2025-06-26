const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'data', 'loveData.json');
const USERS_FILE = path.join(__dirname, 'data', 'users.json');

app.use(cors());
app.use(express.json());

function loadJSON(filePath) {
  try {
    if (!fs.existsSync(filePath)) return [];
    const data = fs.readFileSync(filePath, 'utf-8');
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error(`JSON 로드 오류 (${filePath}):`, error);
    return [];
  }
}

function saveJSON(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error(`JSON 저장 오류 (${filePath}):`, error);
  }
}

const authRouter = express.Router();

authRouter.post('/signup', (req, res) => {
  const { username, password } = req.body;
  const users = loadJSON(USERS_FILE);

  if (users.find(u => u.username === username)) {
    return res.status(400).json({ error: '이미 존재하는 사용자입니다.' });
  }

  users.push({ username, password });
  saveJSON(USERS_FILE, users);

  res.json({ message: '회원가입 성공', username });
});

authRouter.post('/login', (req, res) => {
  const { username, password } = req.body;
  const users = loadJSON(USERS_FILE);

  const user = users.find(u => u.username === username && u.password === password);
  if (!user) return res.status(401).json({ error: '아이디 또는 비밀번호가 잘못되었습니다.' });

  res.json({ message: '로그인 성공', username });
});

app.use('/api/auth', authRouter); 

const loveRouter = express.Router();

// 오늘 날짜 연락 조회
loveRouter.get('/today', (req, res) => {
  const today = new Date().toISOString().slice(0, 10);
  const loveData = loadJSON(DATA_FILE);
  res.json(loveData.filter(entry => entry.contact_date === today));
});

// 연락 데이터 추가
loveRouter.post('/', (req, res) => {
  const entry = req.body;
  const loveData = loadJSON(DATA_FILE);

  const exists = loveData.find(e => e.name === entry.name && e.contact_date === entry.contact_date);
  if (exists) return res.status(400).json({ error: '이미 입력된 정보' });

  loveData.push(entry);
  saveJSON(DATA_FILE, loveData);

  res.json(entry);
});

// 특정 이름으로 연락 데이터 조회
loveRouter.get('/:name', (req, res) => {
  const name = req.params.name;
  const loveData = loadJSON(DATA_FILE);
  res.json(loveData.filter(entry => entry.name === name));
});

app.use('/api/love', loveRouter); 

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 서버 실행 중: http://localhost:${PORT}`);
});

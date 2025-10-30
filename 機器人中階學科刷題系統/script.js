// 存放應用狀態的全域變數
let mode = 'menu';
let questionIndices = [];
let currentExamIndex = 0; // exam 模式中當前題目在 questionIndices 中的索引
let userAnswers = {}; // 對於 exam 模式，儲存使用者答案 (key: questionIndex value: selectedOption)

// 在考試模式中使用的題目概覽覆蓋層
// 此元素會在 renderExam 時初始化一次，之後重複利用
let overviewOverlay;

/**
 * 初始化背景粒子動畫。
 * 使用簡易的粒子連線效果，讓背景更加動態且具有互動感。
 */
function initBackgroundCanvas() {
  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  // 粒子配置
  const numParticles = 60;
  const threshold = 120;
  const particles = [];
  // 滑鼠位置，用於連線互動
  const mouse = { x: null, y: null };
  // 調整畫布大小
  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resize);
  resize();
  // 初始化粒子
  for (let i = 0; i < numParticles; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.6,
      vy: (Math.random() - 0.5) * 0.6,
      radius: 1.5 + Math.random() * 1.5,
    });
  }
  // 記錄滑鼠位置
  canvas.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });
  canvas.addEventListener('mouseleave', () => {
    mouse.x = null;
    mouse.y = null;
  });
  // 動畫循環
  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // 更新並繪製粒子
    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      // 邊界反彈
      if (p.x <= 0 || p.x >= canvas.width) p.vx *= -1;
      if (p.y <= 0 || p.y >= canvas.height) p.vy *= -1;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.fill();
    }
    // 繪製連線
    for (let i = 0; i < particles.length; i++) {
      const p1 = particles[i];
      for (let j = i + 1; j < particles.length; j++) {
        const p2 = particles[j];
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        const dist = Math.hypot(dx, dy);
        if (dist < threshold) {
          const alpha = 1 - dist / threshold;
          ctx.beginPath();
          ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.5})`;
          ctx.lineWidth = 1;
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
        }
      }
      // 與滑鼠的連線
      if (mouse.x !== null) {
        const dx2 = p1.x - mouse.x;
        const dy2 = p1.y - mouse.y;
        const dist2 = Math.hypot(dx2, dy2);
        if (dist2 < threshold) {
          const alpha2 = 1 - dist2 / threshold;
          ctx.beginPath();
          ctx.strokeStyle = `rgba(255, 255, 255, ${alpha2})`;
          ctx.lineWidth = 1;
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.stroke();
        }
      }
    }
    requestAnimationFrame(animate);
  }
  animate();
}

/**
 * 更新題目概覽覆蓋層，根據目前的答題情況設定每個題號的狀態
 * 已作答的題目會加上 .answered，未作答則為 .unanswered，
 * 當前題目額外加上 .current
 */
function updateOverview() {
  if (!overviewOverlay) return;
  const grid = overviewOverlay.querySelector('.overview-grid');
  if (!grid) return;
  // 清空原有項目
  grid.innerHTML = '';
  questionIndices.forEach((qIndex, idx) => {
    const item = document.createElement('div');
    item.className = 'overview-item';
    // 標記已作答或未作答
    if (userAnswers[qIndex] !== undefined) {
      item.classList.add('answered');
    } else {
      item.classList.add('unanswered');
    }
    if (idx === currentExamIndex) {
      item.classList.add('current');
    }
    item.textContent = idx + 1;
    item.addEventListener('click', () => {
      // 跳轉到該題目
      currentExamIndex = idx;
      overviewOverlay.style.display = 'none';
      renderExam();
    });
    grid.appendChild(item);
  });
}

/**
 * 更新狀態欄顯示
 * 顯示目前題號、總題數、已作答題數、未作答題數
 * @param {HTMLElement} bar 狀態欄元素
 */
function updateStatusBar(bar) {
  const total = questionIndices.length;
  // 計算已作答題數
  let answeredCount = 0;
  questionIndices.forEach((qIndex) => {
    if (userAnswers[qIndex] !== undefined) answeredCount++;
  });
  const unansweredCount = total - answeredCount;
  bar.innerHTML = `目前第 ${currentExamIndex + 1} / ${total} 題　|　已作答：${answeredCount}　|　未作答：${unansweredCount}`;
}


// 初始化深色模式切換
function initDarkMode() {
  const toggle = document.getElementById('darkModeToggle');
  let isDark = localStorage.getItem('darkMode') === 'true';
  if (isDark) {
    document.body.classList.add('dark-mode');
    toggle.textContent = '☀️';
  } else {
    toggle.textContent = '🌙';
  }
  toggle.addEventListener('click', () => {
    isDark = !isDark;
    document.body.classList.toggle('dark-mode', isDark);
    toggle.textContent = isDark ? '☀️' : '🌙';
    localStorage.setItem('darkMode', isDark);
  });
}

// 初始化背景畫布特效
function initBackgroundCanvas() {
  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  // 粒子配置
  const numParticles = 60;
  const particles = [];
  for (let i = 0; i < numParticles; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 2 + 1,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
    });
  }
  let mouseX = canvas.width / 2;
  let mouseY = canvas.height / 2;
  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });
  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    particles.forEach((p) => {
      // 移動
      p.x += p.vx;
      p.y += p.vy;
      // 碰到邊緣反彈
      if (p.x <= 0 || p.x >= canvas.width) p.vx *= -1;
      if (p.y <= 0 || p.y >= canvas.height) p.vy *= -1;
      // 鼠標互動：靠近鼠標時略微偏移遠離
      const dx = mouseX - p.x;
      const dy = mouseY - p.y;
      const distSq = dx * dx + dy * dy;
      if (distSq < 200 * 200) {
        p.vx -= dx / 50000;
        p.vy -= dy / 50000;
      }
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    });
    requestAnimationFrame(animate);
  }
  animate();
}

// 顯示主選單
function showMenu() {
  mode = 'menu';
  const app = document.getElementById('app');
  app.innerHTML = '';
  // 建立模式選擇卡片
  const card = document.createElement('div');
  card.className = 'card glass fade-in';
  // 標題
  const title = document.createElement('h2');
  title.textContent = '選擇模式';
  card.appendChild(title);
  // 說明文字
  const subtitle = document.createElement('p');
  subtitle.textContent = '請選擇練習或測驗模式：';
  card.appendChild(subtitle);
  // 模式選擇容器
  const options = document.createElement('div');
  options.className = 'mode-options';
  // 自由參考模式項目
  const itemPractice = document.createElement('div');
  itemPractice.className = 'mode-item';
  const ptTitle = document.createElement('div');
  ptTitle.className = 'mode-title';
  ptTitle.textContent = '自由參考模式';
  const ptDesc = document.createElement('div');
  ptDesc.className = 'mode-desc';
  ptDesc.textContent = '逐題瀏覽題庫，答題後立即顯示正確答案與解析，適合自由練習。';
  const ptBtn = document.createElement('button');
  ptBtn.textContent = '開始';
  ptBtn.className = 'button';
  ptBtn.addEventListener('click', () => { startPractice(); });
  itemPractice.appendChild(ptTitle);
  itemPractice.appendChild(ptDesc);
  itemPractice.appendChild(ptBtn);
  options.appendChild(itemPractice);
  // 自訂範圍測驗項目
  const itemRange = document.createElement('div');
  itemRange.className = 'mode-item';
  const rngTitle = document.createElement('div');
  rngTitle.className = 'mode-title';
  rngTitle.textContent = '自訂範圍測驗';
  const rngDesc = document.createElement('div');
  rngDesc.className = 'mode-desc';
  rngDesc.textContent = '輸入題號範圍，從選定區間隨機抽取 50 題進行測驗並於結束後統計成績。';
  const rngBtn = document.createElement('button');
  rngBtn.textContent = '開始';
  rngBtn.className = 'button';
  rngBtn.addEventListener('click', () => { showRangeInput(); });
  itemRange.appendChild(rngTitle);
  itemRange.appendChild(rngDesc);
  itemRange.appendChild(rngBtn);
  options.appendChild(itemRange);
  // 模擬考試模式項目
  const itemExam = document.createElement('div');
  itemExam.className = 'mode-item';
  const exTitle = document.createElement('div');
  exTitle.className = 'mode-title';
  exTitle.textContent = '模擬考試模式';
  const exDesc = document.createElement('div');
  exDesc.className = 'mode-desc';
  exDesc.textContent = '從整個題庫中隨機抽取 50 題進行正式模擬測驗，結束後顯示完整成績。';
  const exBtn = document.createElement('button');
  exBtn.textContent = '開始';
  exBtn.className = 'button';
  exBtn.addEventListener('click', () => { startFullExam(); });
  itemExam.appendChild(exTitle);
  itemExam.appendChild(exDesc);
  itemExam.appendChild(exBtn);
  options.appendChild(itemExam);
  // 加入選項容器
  card.appendChild(options);
  // 插入頁面
  app.appendChild(card);
}

// 顯示首頁：一個開始使用按鈕，引導進入模式選擇
function showIntro() {
  mode = 'intro';
  const app = document.getElementById('app');
  app.innerHTML = '';
  const card = document.createElement('div');
  card.className = 'card glass fade-in intro-card';
  // 標題
  const heading = document.createElement('h2');
  heading.textContent = '歡迎使用學科刷題系統';
  card.appendChild(heading);
  // 說明文字
  const introDesc = document.createElement('p');
  introDesc.textContent = '準備好開始練習或測驗了嗎？';
  card.appendChild(introDesc);
  // 開始按鈕
  const startBtn = document.createElement('button');
  startBtn.textContent = '開始使用';
  startBtn.className = 'button big';
  startBtn.addEventListener('click', showMenu);
  card.appendChild(startBtn);
  // 加入頁面
  app.appendChild(card);
}

// 開始自由參考模式
function startPractice() {
  mode = 'practice';
  const app = document.getElementById('app');
  app.innerHTML = '';
  // 從第 0 題開始
  let current = 0;
  const totalQuestions = question.length;
  /**
   * 渲染自由參考模式題目
   * 可以前往上一題、下一題，或輸入題號跳轉
   */
  function renderPractice() {
    // 若超出範圍則結束
    if (current < 0) current = 0;
    if (current >= totalQuestions) {
      // 練習結束
      const endCard = document.createElement('div');
      endCard.className = 'card fade-in';
      endCard.classList.add('glass');
      const msg = document.createElement('p');
      msg.textContent = '已經沒有更多題目了。';
      endCard.appendChild(msg);
      const backBtn = document.createElement('button');
      backBtn.textContent = '返回主選單';
      backBtn.className = 'button';
      backBtn.addEventListener('click', showMenu);
      endCard.appendChild(backBtn);
      app.innerHTML = '';
      app.appendChild(endCard);
      return;
    }
    // 顯示當前題目
    const q = question[current];
    app.innerHTML = '';
    const card = document.createElement('div');
    card.className = 'card fade-in';
    // 練習模式使用毛玻璃效果
    card.classList.add('glass');

    const qNumber = document.createElement('div');
    qNumber.className = 'question-number';
    qNumber.textContent = `第 ${current + 1} 題`;
    card.appendChild(qNumber);

    const qText = document.createElement('div');
    qText.className = 'question-text';
    qText.innerHTML = q.question;
    card.appendChild(qText);

    // 顯示圖片（若有）
    if (q.questionimage && q.questionimage !== 'null' && q.questionimage !== '') {
      const img = document.createElement('img');
      img.className = 'question-image';
      // 若題目圖片名稱已包含路徑，則直接使用；否則預設從 image 目錄載入
      let imgSrc = q.questionimage;
      if (!imgSrc.includes('/')) {
        imgSrc = `image/${imgSrc}`;
      }
      img.src = imgSrc;
      img.alt = '題目圖片';
      card.appendChild(img);
    }

    // 選項區
    const optionsContainer = document.createElement('div');
    optionsContainer.className = 'options';
    // 解析區容器
    const explanationContainer = document.createElement('div');
    q.option.forEach((opt, idx) => {
      const btn = document.createElement('button');
      btn.className = 'option-button';
      const optionLabel = String.fromCharCode(65 + idx);
      // 判斷選項是否為圖片檔名（支援 jpg/png/jpeg）
      const isImg = typeof opt === 'string' && /\.(jpg|png|jpeg)$/i.test(opt.trim());
      let optHtml = `<strong>${optionLabel}.</strong> `;
      if (isImg) {
        // 處理圖片路徑：如無路徑則加上 image/ 前綴
        let imgSrc = opt.trim();
        if (!imgSrc.includes('/')) {
          imgSrc = `image/${imgSrc}`;
        }
        optHtml += `<img src="${imgSrc}" class="option-image" alt="選項圖片">`;
      } else {
        optHtml += `${opt}${q.optionend || ''}`;
      }
      btn.innerHTML = optHtml;
      btn.addEventListener('click', () => {
        // 顯示答案與解析
        const isCorrect = idx === q.answer;
        // 將所有選項設為 disabled 並標示正確選項
        Array.from(optionsContainer.children).forEach((child, i) => {
          child.classList.add('disabled');
          if (i === q.answer) {
            child.classList.add('correct');
          }
        });
        if (!isCorrect) {
          btn.classList.add('wrong');
        }
        // 顯示解析內容
        explanationContainer.innerHTML = '';
        const expl = document.createElement('div');
        expl.className = 'explanation';
        expl.innerHTML = `<p><strong>正確答案：</strong>${String.fromCharCode(65 + q.answer)}</p>`;
        if (q.explain && q.explain.trim() !== '') {
          expl.innerHTML += `<p><strong>解析：</strong>${q.explain}</p>`;
        }
        explanationContainer.appendChild(expl);
      });
      optionsContainer.appendChild(btn);
    });
    card.appendChild(optionsContainer);
    card.appendChild(explanationContainer);

    // 控制按鈕容器
    const controls = document.createElement('div');
    controls.className = 'controls';

    // 上一題按鈕
    const prevBtn = document.createElement('button');
    prevBtn.textContent = '上一題';
    prevBtn.className = 'button';
    prevBtn.disabled = current === 0;
    prevBtn.addEventListener('click', () => {
      current -= 1;
      renderPractice();
    });
    controls.appendChild(prevBtn);

    // 下一題按鈕 (若已到最後一題則顯示"結束")
    const nextBtn = document.createElement('button');
    nextBtn.textContent = current + 1 >= totalQuestions ? '結束' : '下一題';
    nextBtn.className = 'button';
    nextBtn.addEventListener('click', () => {
      current += 1;
      renderPractice();
    });
    controls.appendChild(nextBtn);

    // 跳轉輸入框
    const jumpInput = document.createElement('input');
    jumpInput.type = 'number';
    jumpInput.min = 1;
    jumpInput.max = totalQuestions;
    jumpInput.placeholder = '題號';
    jumpInput.className = 'jump-input';
    controls.appendChild(jumpInput);

    // 跳轉按鈕
    const jumpBtn = document.createElement('button');
    jumpBtn.textContent = '跳轉';
    jumpBtn.className = 'button';
    // 縮小跳轉按鈕的最大寬度，使其與輸入框同一行更顯緊湊
    jumpBtn.style.maxWidth = '100px';
    jumpBtn.addEventListener('click', () => {
      const val = parseInt(jumpInput.value);
      if (!isNaN(val) && val >= 1 && val <= totalQuestions) {
        current = val - 1;
        renderPractice();
      } else {
        alert(`請輸入 1-${totalQuestions} 的題號`);
      }
    });
    controls.appendChild(jumpBtn);

    // 返回主選單
    const backBtn = document.createElement('button');
    backBtn.textContent = '返回主選單';
    backBtn.className = 'button';
    backBtn.addEventListener('click', showMenu);
    controls.appendChild(backBtn);

    card.appendChild(controls);

    app.appendChild(card);
  }
  renderPractice();
}

// 顯示自訂範圍輸入表單
function showRangeInput() {
  mode = 'rangeInput';
  const app = document.getElementById('app');
  app.innerHTML = '';
  const card = document.createElement('div');
  card.className = 'card';
  // 範圍模式也使用毛玻璃效果
  card.classList.add('glass');
  const title = document.createElement('h2');
  title.textContent = '自訂範圍測驗';
  card.appendChild(title);

  const note = document.createElement('p');
  note.textContent = `目前共有 ${question.length} 題，請輸入您要抽題的範圍（起始題號和結束題號）：`;
  card.appendChild(note);

  const startGroup = document.createElement('div');
  startGroup.className = 'input-group';
  const startLabel = document.createElement('label');
  startLabel.textContent = '起始題號';
  const startInput = document.createElement('input');
  startInput.type = 'number';
  startInput.min = 1;
  startInput.max = question.length;
  startInput.placeholder = '例如 1';
  startGroup.appendChild(startLabel);
  startGroup.appendChild(startInput);

  const endGroup = document.createElement('div');
  endGroup.className = 'input-group';
  const endLabel = document.createElement('label');
  endLabel.textContent = '結束題號';
  const endInput = document.createElement('input');
  endInput.type = 'number';
  endInput.min = 1;
  endInput.max = question.length;
  endInput.placeholder = `例如 ${question.length}`;
  endGroup.appendChild(endLabel);
  endGroup.appendChild(endInput);

  card.appendChild(startGroup);
  card.appendChild(endGroup);

  // 按鈕容器，使用 controls 樣式以獲得統一的間距和換行
  const controls = document.createElement('div');
  controls.className = 'controls';
  // 開始測驗按鈕
  const startBtn = document.createElement('button');
  startBtn.textContent = '開始測驗';
  startBtn.className = 'button';
  startBtn.addEventListener('click', () => {
    const startVal = parseInt(startInput.value);
    const endVal = parseInt(endInput.value);
    if (isNaN(startVal) || isNaN(endVal) || startVal < 1 || endVal < 1 || startVal > question.length || endVal > question.length || startVal > endVal) {
      alert('請輸入有效的題號範圍！');
      return;
    }
    startRangeExam(startVal, endVal);
  });
  controls.appendChild(startBtn);
  // 返回主選單按鈕
  const backBtn = document.createElement('button');
  backBtn.textContent = '返回主選單';
  backBtn.className = 'button';
  backBtn.addEventListener('click', showMenu);
  controls.appendChild(backBtn);
  card.appendChild(controls);
  app.appendChild(card);
}

// 開始自訂範圍測驗
function startRangeExam(start, end) {
  mode = 'exam';
  // 取得範圍內的索引陣列（題號從1起算）
  const indices = [];
  for (let i = start - 1; i <= end - 1; i++) {
    indices.push(i);
  }
  // 隨機打亂
  shuffleArray(indices);
  // 取前50題或範圍題數
  questionIndices = indices.slice(0, Math.min(50, indices.length));
  currentExamIndex = 0;
  userAnswers = {};
  renderExam();
}

// 開始模擬考試（從全題庫隨機抽取50題）
function startFullExam() {
  mode = 'exam';
  const indices = [];
  for (let i = 0; i < question.length; i++) {
    indices.push(i);
  }
  shuffleArray(indices);
  questionIndices = indices.slice(0, Math.min(50, indices.length));
  currentExamIndex = 0;
  userAnswers = {};
  renderExam();
}

// 渲染測驗頁面
function renderExam() {
  const app = document.getElementById('app');
  // 清空畫面
  app.innerHTML = '';
  // 若已完成所有題目則顯示結果
  if (currentExamIndex >= questionIndices.length) {
    showResult();
    return;
  }

  // 建立概覽浮層（僅在第一次進入考試模式時建立）
  if (!overviewOverlay) {
    overviewOverlay = document.createElement('div');
    overviewOverlay.className = 'overview-overlay';
    // 初始隱藏
    overviewOverlay.style.display = 'none';
    // 點擊背景區域關閉浮層
    overviewOverlay.addEventListener('click', (e) => {
      if (e.target === overviewOverlay) {
        overviewOverlay.style.display = 'none';
      }
    });
    // 建立內容容器
    const content = document.createElement('div');
    content.className = 'overview-content';
    // 建立題號網格容器
    const grid = document.createElement('div');
    grid.className = 'overview-grid';
    content.appendChild(grid);
    overviewOverlay.appendChild(content);
    // 將浮層加入 body 方便覆蓋整個頁面
    document.body.appendChild(overviewOverlay);
  }

  // 取得當前題目索引與資料
  const qIndex = questionIndices[currentExamIndex];
  const q = question[qIndex];

  // 建立題目卡片，使用毛玻璃與淡入效果
  const card = document.createElement('div');
  // 使用毛玻璃效果與淡入動畫，不需重複加入 glass
  card.className = 'card glass fade-in';

  // 狀態列：當前題號/總題數與已作答/未作答統計
  const answeredCount = questionIndices.reduce((acc, idx) => acc + (userAnswers[idx] !== undefined ? 1 : 0), 0);
  const statusBar = document.createElement('div');
  statusBar.className = 'exam-status';
  statusBar.textContent = `題號 ${currentExamIndex + 1}/${questionIndices.length} - 已作答 ${answeredCount} 題，未作答 ${questionIndices.length - answeredCount} 題`;
  card.appendChild(statusBar);

  // 進度條顯示（第幾題/總題數）
  const progress = document.createElement('div');
  progress.className = 'progress';
  progress.textContent = `第 ${currentExamIndex + 1} / ${questionIndices.length} 題`;
  card.appendChild(progress);

  // 題號顯示
  const qNumber = document.createElement('div');
  qNumber.className = 'question-number';
  qNumber.textContent = `題號 ${qIndex + 1}`;
  card.appendChild(qNumber);

  // 題目文本
  const qText = document.createElement('div');
  qText.className = 'question-text';
  qText.innerHTML = q.question;
  card.appendChild(qText);

  // 顯示題目圖片（若有）
  if (q.questionimage && q.questionimage !== 'null' && q.questionimage !== '') {
    const img = document.createElement('img');
    img.className = 'question-image';
    // 若題目圖片名稱已包含路徑，則直接使用；否則預設從 image 目錄載入
    let imgSrc = q.questionimage;
    if (!imgSrc.includes('/')) {
      imgSrc = `image/${imgSrc}`;
    }
    img.src = imgSrc;
    img.alt = '題目圖片';
    card.appendChild(img);
  }

  // 建立選項容器
  const optionsContainer = document.createElement('div');
  optionsContainer.className = 'options';
  q.option.forEach((opt, idx) => {
    const btn = document.createElement('button');
    btn.className = 'option-button';
    const optionLabel = String.fromCharCode(65 + idx);
    // 判斷選項是否為圖片檔名（支援 jpg/png/jpeg）
    const isImgOpt = typeof opt === 'string' && /\.(jpg|png|jpeg)$/i.test(opt.trim());
    let optHtml = `<strong>${optionLabel}.</strong> `;
    if (isImgOpt) {
      // 如果是圖片選項，處理圖片路徑
      let imgPath = opt.trim();
      if (!imgPath.includes('/')) {
        imgPath = `image/${imgPath}`;
      }
      optHtml += `<img src="${imgPath}" class="option-image" alt="選項圖片">`;
    } else {
      optHtml += `${opt}${q.optionend || ''}`;
    }
    btn.innerHTML = optHtml;
    btn.addEventListener('click', () => {
      // 紀錄使用者的答案
      userAnswers[qIndex] = idx;
      // 移除其他選項的選中狀態並標記新的選項
      Array.from(optionsContainer.children).forEach((child) => {
        child.classList.remove('selected');
      });
      btn.classList.add('selected');
      // 更新題目概覽（刷新已作答/未作答狀態及當前高亮）
      updateOverview();
      // 更新狀態列文字：目前題號、已作答與未作答統計
      const statusBarEl = document.querySelector('.exam-status');
      if (statusBarEl) {
        updateStatusBar(statusBarEl);
      }
      // 更新下一題按鈕文字：最後一題顯示提交測驗
      const controlsEl = document.querySelector('.controls');
      if (controlsEl) {
        const btns = controlsEl.querySelectorAll('button');
        const nextBtnDom = btns[1];
        if (nextBtnDom) {
          nextBtnDom.textContent = (currentExamIndex + 1 === questionIndices.length ? '提交測驗' : '下一題');
        }
      }
    });
    // 如該選項已被選中則標記
    if (userAnswers[qIndex] === idx) {
      btn.classList.add('selected');
    }
    optionsContainer.appendChild(btn);
  });
  card.appendChild(optionsContainer);

  // 控制按鈕容器
  const controls = document.createElement('div');
  controls.className = 'controls';

  // 上一題按鈕
  const prevBtn = document.createElement('button');
  prevBtn.textContent = '上一題';
  prevBtn.className = 'button';
  prevBtn.disabled = currentExamIndex === 0;
  prevBtn.addEventListener('click', () => {
    if (currentExamIndex > 0) {
      currentExamIndex -= 1;
      renderExam();
    }
  });
  controls.appendChild(prevBtn);

  // 下一題或提交按鈕
  const nextBtn = document.createElement('button');
  nextBtn.textContent = currentExamIndex + 1 === questionIndices.length ? '提交測驗' : '下一題';
  nextBtn.className = 'button';
  nextBtn.addEventListener('click', () => {
    if (currentExamIndex + 1 === questionIndices.length) {
      // 提交測驗
      currentExamIndex += 1;
      renderExam();
    } else {
      currentExamIndex += 1;
      renderExam();
    }
  });
  controls.appendChild(nextBtn);

  // 跳轉輸入框
  const jumpInput = document.createElement('input');
  jumpInput.type = 'number';
  jumpInput.min = 1;
  jumpInput.max = questionIndices.length;
  jumpInput.placeholder = '題號';
  jumpInput.className = 'jump-input';
  controls.appendChild(jumpInput);

  // 跳轉按鈕
  const jumpBtn = document.createElement('button');
  jumpBtn.textContent = '跳轉';
  jumpBtn.className = 'button';
  jumpBtn.style.maxWidth = '100px';
  jumpBtn.addEventListener('click', () => {
    const val = parseInt(jumpInput.value);
    if (!isNaN(val) && val >= 1 && val <= questionIndices.length) {
      currentExamIndex = val - 1;
      renderExam();
    } else {
      alert(`請輸入 1-${questionIndices.length} 的題號`);
    }
  });
  controls.appendChild(jumpBtn);

  // 題目概覽按鈕
  const overviewBtn = document.createElement('button');
  overviewBtn.textContent = '題目概覽';
  overviewBtn.className = 'button';
  overviewBtn.addEventListener('click', () => {
    updateOverview();
    overviewOverlay.style.display = 'flex';
  });
  controls.appendChild(overviewBtn);

  // 返回主選單按鈕
  const backBtn = document.createElement('button');
  backBtn.textContent = '返回主選單';
  backBtn.className = 'button';
  backBtn.addEventListener('click', () => {
    // 隱藏概覽浮層
    if (overviewOverlay) {
      overviewOverlay.style.display = 'none';
    }
    showMenu();
  });
  controls.appendChild(backBtn);

  card.appendChild(controls);
  // 將卡片加入頁面
  app.appendChild(card);
}

// 顯示測驗結果
function showResult() {
  mode = 'result';
  const app = document.getElementById('app');
  app.innerHTML = '';
  // 計算正確題數
  let correctCount = 0;
  for (const qIndex of questionIndices) {
    const userAns = userAnswers[qIndex];
    const correctAns = question[qIndex].answer;
    if (userAns === correctAns) correctCount++;
  }
  const total = questionIndices.length;
  const accuracy = total > 0 ? Math.round((correctCount / total) * 100) : 0;

  // 隱藏題目概覽浮層（若存在）
  if (overviewOverlay) {
    overviewOverlay.style.display = 'none';
  }
  // 建立結果卡片包裹區，套用毛玻璃效果
  const card = document.createElement('div');
  card.className = 'card glass fade-in';

  // 成績摘要
  const summary = document.createElement('div');
  summary.className = 'result-summary';
  summary.innerHTML = `作答完畢！共 ${total} 題，答對 ${correctCount} 題，正確率 ${accuracy}%`;
  card.appendChild(summary);

  // 建立滑動結果容器
  const container = document.createElement('div');
  container.className = 'result-container';
  // 為每一題建立滑動頁面
  questionIndices.forEach((qIndex, idx) => {
    const qItem = question[qIndex];
    const slide = document.createElement('div');
    slide.className = 'result-slide';
    // 取得使用者答案與正確答案
    const userAns = userAnswers[qIndex];
    const correctAns = qItem.answer;
    const isCorrect = userAns === correctAns;
    // 顯示答對或答錯標記
    const resultLabel = document.createElement('div');
    resultLabel.className = 'result-status';
    if (isCorrect) {
      resultLabel.classList.add('correct');
      resultLabel.textContent = '答對';
    } else {
      resultLabel.classList.add('wrong');
      resultLabel.textContent = '答錯';
    }
    slide.appendChild(resultLabel);
    // 顯示題號與總題數
    const qNum = document.createElement('div');
    qNum.className = 'question-number';
    qNum.textContent = `第 ${idx + 1} 題（題號 ${qIndex + 1}）`;
    slide.appendChild(qNum);
    // 題目文字
    const qTxt = document.createElement('div');
    qTxt.className = 'question-text';
    qTxt.innerHTML = qItem.question;
    slide.appendChild(qTxt);
    // 顯示題目圖片（若有）
    if (qItem.questionimage && qItem.questionimage !== 'null' && qItem.questionimage !== '') {
      const img = document.createElement('img');
      img.className = 'question-image';
      // 若題目圖片名稱已包含路徑，則直接使用；否則預設從 image 目錄載入
      let imgSrc = qItem.questionimage;
      if (!imgSrc.includes('/')) {
        imgSrc = `image/${imgSrc}`;
      }
      img.src = imgSrc;
      img.alt = '題目圖片';
      slide.appendChild(img);
    }
    // 選項列表於結果頁呈現
    const opts = document.createElement('div');
    opts.className = 'result-options';
    qItem.option.forEach((opt, optionIndex) => {
      const optDiv = document.createElement('div');
      optDiv.className = 'option-item';
      const label = String.fromCharCode(65 + optionIndex);
      // 判斷是否為圖片選項
      const isImgOpt = typeof opt === 'string' && /\.(jpg|png|jpeg)$/i.test(opt.trim());
      let inner = `${label}. `;
      if (isImgOpt) {
        let imgPath = opt.trim();
        if (!imgPath.includes('/')) {
          imgPath = `image/${imgPath}`;
        }
        inner += `<img src="${imgPath}" class="result-option-image" alt="選項圖片">`;
      } else {
        inner += `${opt}${qItem.optionend || ''}`;
      }
      optDiv.innerHTML = inner;
      // 標記正確答案
      if (optionIndex === correctAns) {
        optDiv.classList.add('correct');
      }
      // 標記使用者的作答
      if (userAns === optionIndex) {
        optDiv.classList.add('user-answer');
      }
      opts.appendChild(optDiv);
    });
    slide.appendChild(opts);
    container.appendChild(slide);
  });
  card.appendChild(container);

  // 返回主選單按鈕
  const backBtn = document.createElement('button');
  backBtn.textContent = '返回主選單';
  backBtn.className = 'button';
  backBtn.addEventListener('click', showMenu);
  card.appendChild(backBtn);

  app.appendChild(card);
}

// 洗牌陣列
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

// 初始化
window.addEventListener('DOMContentLoaded', () => {
  initDarkMode();
  // 啟用背景粒子特效
  initBackgroundCanvas();
  // 預設顯示首頁歡迎畫面，按下「開始使用」後才進入模式選擇
  showIntro();
});

// State
let allCards = [];
let filteredCards = [];
let currentIndex = 0;
let isFlipped = false;
let currentCategory = '전체';
let currentType = '전체';
let currentFreq = '전체';
let examMode = false;

// DOM references
const cardEl = document.getElementById('card');
const cardFrontEl = document.getElementById('cardFront');
const cardBackEl = document.getElementById('cardBack');
const cardFrontContent = document.getElementById('cardFrontContent');
const cardBackContent = document.getElementById('cardBackContent');
const categoryBadge = document.getElementById('categoryBadge');
const categoryBadgeBack = document.getElementById('categoryBadgeBack');
const cardCounter = document.getElementById('cardCounter');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const shuffleBtn = document.getElementById('shuffleBtn');
const filterBtns = document.querySelectorAll('.filter-btn');
const typeBtns = document.querySelectorAll('.type-btn');
const freqBtns = document.querySelectorAll('.freq-btn');
const examBtn = document.getElementById('examBtn');

// Sanitize HTML output - strip dangerous tags while keeping markdown-generated ones
function sanitizeHtml(html) {
  const allowed = new Set(['p','strong','em','ul','ol','li','table','thead','tbody','tr','th','td',
    'h1','h2','h3','h4','h5','h6','br','hr','a','code','pre','blockquote','span','div','del','sup','sub']);
  const div = document.createElement('div');
  div.innerHTML = html;
  div.querySelectorAll('*').forEach(el => {
    if (!allowed.has(el.tagName.toLowerCase())) {
      el.replaceWith(document.createTextNode(el.textContent));
    }
  });
  return div.innerHTML;
}

// Load data
fetch('data.json')
  .then(res => {
    if (!res.ok) throw new Error('data.json not found');
    return res.json();
  })
  .then(data => {
    allCards = Array.isArray(data) ? data : data.cards;
    applyFilters();
  })
  .catch(err => {
    cardFrontContent.innerHTML = '<span style="color:#e74c3c;">데이터를 불러올 수 없습니다.<br>data.json 파일을 확인해주세요.</span>';
    console.error(err);
  });

// Render current card
function renderCard() {
  if (filteredCards.length === 0) {
    cardFrontContent.innerHTML = '<span style="color:#aaa;">카드가 없습니다.</span>';
    cardBackContent.innerHTML = '';
    categoryBadge.textContent = '';
    categoryBadge.removeAttribute('data-cat');
    cardFrontEl.removeAttribute('data-cat');
    cardBackEl.removeAttribute('data-cat');
    updateCounter();
    return;
  }

  const card = filteredCards[currentIndex];
  const cat = card.category || '';
  const type = card.type || '';

  // Category badges with type
  const badgeText = type ? `${cat} · ${type}` : cat;
  [categoryBadge, categoryBadgeBack].forEach(el => {
    el.textContent = badgeText;
    el.setAttribute('data-cat', cat);
  });

  // Category color accent on faces
  cardFrontEl.setAttribute('data-cat', cat);
  cardBackEl.setAttribute('data-cat', cat);

  // Front: render markdown (for scenario-based questions with bold/newlines)
  const rawFront = card.front || '';
  cardFrontContent.innerHTML = sanitizeHtml(marked.parse(rawFront));

  // Back: answer rendered as markdown
  const rawAnswer = card.back || '';
  cardBackContent.innerHTML = sanitizeHtml(marked.parse(rawAnswer));

  updateCounter();
}

// Update counter display
function updateCounter() {
  if (filteredCards.length === 0) {
    cardCounter.textContent = '0 / 0';
  } else {
    cardCounter.textContent = `${currentIndex + 1} / ${filteredCards.length}`;
  }
}

// Flip card
function flipCard() {
  if (filteredCards.length === 0) return;
  isFlipped = !isFlipped;
  cardEl.classList.toggle('flipped', isFlipped);
}

// Navigate: instantly reset flip state, then render new card
function goTo(index) {
  if (filteredCards.length === 0) return;

  // Wrap around
  currentIndex = ((index % filteredCards.length) + filteredCards.length) % filteredCards.length;

  // Reset flip without animation
  isFlipped = false;
  cardEl.classList.add('no-transition');
  cardEl.classList.remove('flipped');
  void cardEl.offsetWidth;
  cardEl.classList.remove('no-transition');

  renderCard();
}

function goNext() {
  goTo(currentIndex + 1);
}

function goPrev() {
  goTo(currentIndex - 1);
}

// Fisher-Yates shuffle
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function shuffleCards() {
  filteredCards = shuffle(filteredCards);
  goTo(0);
}

// Combined filter (category + type)
function applyFilters() {
  filteredCards = allCards.filter(c => {
    const catMatch = currentCategory === '전체' || c.category === currentCategory;
    const typeMatch = currentType === '전체' || c.type === currentType;
    const freqMatch = currentFreq === '전체' || c.frequency === currentFreq;
    return catMatch && typeMatch && freqMatch;
  });

  // Update active buttons
  filterBtns.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.category === currentCategory);
  });
  typeBtns.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.type === currentType);
  });
  freqBtns.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.freq === currentFreq);
  });

  goTo(0);
}

// Exam mode - pick 10 random cards from current filters
function startExam() {
  // Get pool from current filter settings
  const pool = allCards.filter(c => {
    const catMatch = currentCategory === '전체' || c.category === currentCategory;
    const typeMatch = currentType === '전체' || c.type === currentType;
    const freqMatch = currentFreq === '전체' || c.frequency === currentFreq;
    return catMatch && typeMatch && freqMatch;
  });

  if (pool.length === 0) {
    alert('선택한 필터에 해당하는 카드가 없습니다.');
    return;
  }

  const count = Math.min(10, pool.length);
  filteredCards = shuffle(pool).slice(0, count);
  examMode = true;
  examBtn.classList.add('active');
  examBtn.textContent = '\u2716 시험 종료';
  goTo(0);
}

function stopExam() {
  examMode = false;
  examBtn.classList.remove('active');
  examBtn.textContent = '\u270D 시험';
  applyFilters();
}

function toggleExam() {
  if (examMode) {
    stopExam();
  } else {
    startExam();
  }
}

// Event listeners — card click
cardEl.addEventListener('click', flipCard);

// Navigation buttons
prevBtn.addEventListener('click', goPrev);
nextBtn.addEventListener('click', goNext);

// Shuffle button
shuffleBtn.addEventListener('click', shuffleCards);

// Exam button
examBtn.addEventListener('click', toggleExam);

// Category filter buttons
filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    if (examMode) stopExam();
    currentCategory = btn.dataset.category;
    applyFilters();
  });
});

// Type filter buttons
typeBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    if (examMode) stopExam();
    currentType = btn.dataset.type;
    applyFilters();
  });
});

// Frequency filter buttons
freqBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    if (examMode) stopExam();
    currentFreq = btn.dataset.freq;
    applyFilters();
  });
});

// Keyboard shortcuts
document.addEventListener('keydown', e => {
  if (e.code === 'Space') {
    e.preventDefault();
    flipCard();
  } else if (e.code === 'ArrowLeft') {
    e.preventDefault();
    goPrev();
  } else if (e.code === 'ArrowRight') {
    e.preventDefault();
    goNext();
  }
});

// Touch swipe
let touchStartX = 0;
let touchStartY = 0;

document.addEventListener('touchstart', e => {
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
}, { passive: true });

document.addEventListener('touchend', e => {
  const dx = e.changedTouches[0].clientX - touchStartX;
  const dy = e.changedTouches[0].clientY - touchStartY;

  if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
    if (dx < 0) {
      goNext();
    } else {
      goPrev();
    }
  }
}, { passive: true });

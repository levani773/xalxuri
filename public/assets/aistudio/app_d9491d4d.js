/**
 * Smart JSON Chatbot
 * ცოდნის ბაზა იტვირთება გარე ფაილიდან: knowledge.json
 * (გახსენი სერვერით: python -m http.server 8000)
 */

// config.js ადგენს რეჟიმს: publicMode=true ნიშნავს საჯარო საიტს (ბაზის პანელის გარეშე)
const CONFIG = Object.assign({
    publicMode: false,
    version: '',
    imageSearch: true,        // სურათით ძებნის ღილაკი
    imageThreshold: 0.7       // მსგავსების ზღვარი (0-1). შეცვალე config.js-ში, თუ შედეგები ზედმეტად მკაცრია/თავისუფალია
}, window.CHATBOT_CONFIG || {});
const IMAGE_NEAR_WINDOW = 0.08;   // ზღვარს ამდენით ქვემოთაც ვაჩვენებთ „ყველაზე ახლო“ შედეგს
const KB_URL = 'knowledge.json';
const STORAGE_KEY = 'smart_bot_kb';
const KB_SAVE_URL = 'api/kb';
const UNANSWERED_URL = 'api/unanswered';
const IMAGE_UPLOAD_URL = 'api/upload-image';
const UNANSWERED_KEY = 'smart_bot_unanswered';

// Global State
let DEFAULT_KNOWLEDGE_BASE = [];
let knowledgeBase = [];

// App Initialization
window.onload = async function () {
    if (CONFIG.publicMode) {
        document.getElementById('toggleKbBtn')?.remove();
        document.getElementById('mobileKbModal')?.remove();
    }

    if (!CONFIG.imageSearch) {
        document.getElementById('imageBtn')?.remove();
    }

    await loadKnowledgeBase();

    document.getElementById('initTime').innerText = getCurrentTime();

    renderKbList();
    updateRawJsonEditor();
    loadCategoryChips();

    document.getElementById('userInput').focus();
};

/* =========================================================================
   SMART MATCHING ALGORITHM (FUZZY & KEYWORD OVERLAP)
   ========================================================================= */

/**
 * Levenshtein Distance, ბეჭდვის შეცდომების ტოლერანტობისთვის.
 */
function levenshteinDistance(a, b) {
    const matrix = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)
                );
            }
        }
    }
    return matrix[b.length][a.length];
}

/**
 * ტექსტის ნორმალიზაცია: პატარა ასოები, პუნქტუაციის მოშორება.
 */
function normalizeText(text) {
    return String(text)
        .toLowerCase()
        .replace(/[.,?!:;()\-"']/g, '')
        .trim();
}

/**
 * ეძებს ყველაზე შესაბამის ჩანაწერს ბაზაში.
 */
function findBestAnswer(userQuery) {
    const cleanQuery = normalizeText(userQuery);
    if (!cleanQuery) return null;

    const queryWords = cleanQuery.split(/\s+/);
    let bestMatch = null;
    let highestScore = 0;

    knowledgeBase.forEach(item => {
        let score = 0;

        // 1. Keyword check
        (item.keywords || []).forEach(kw => {
            const cleanKw = normalizeText(kw);
            if (!cleanKw) return;

            if (cleanQuery === cleanKw) {
                score += 50;
            } else if (cleanQuery.includes(cleanKw)) {
                score += 30;
            } else {
                queryWords.forEach(w => {
                    if (w === cleanKw) {
                        score += 20;
                    } else if (w.length > 3 && cleanKw.length > 3) {
                        const dist = levenshteinDistance(w, cleanKw);
                        if (dist <= 2) score += 10;
                    }
                });
            }
        });

        // 2. Question phrase similarity
        if (item.questions && Array.isArray(item.questions)) {
            item.questions.forEach(q => {
                const cleanQ = normalizeText(q);
                if (!cleanQ) return;

                if (cleanQuery === cleanQ) score += 60;
                else if (cleanQuery.includes(cleanQ) || cleanQ.includes(cleanQuery)) score += 35;
            });
        }

        if (score > highestScore) {
            highestScore = score;
            bestMatch = item;
        }
    });

    return highestScore >= 10 ? bestMatch : null;
}

/* =========================================================================
   CHAT INTERACTION LOGIC
   ========================================================================= */

function handleUserSubmit(e) {
    e.preventDefault();
    const inputEl = document.getElementById('userInput');
    const text = inputEl.value.trim();
    if (!text) return;

    appendMessage('user', text);
    inputEl.value = '';

    showTypingIndicator();

    const responseDelay = Math.floor(Math.random() * 600) + 600;
    setTimeout(() => {
        removeTypingIndicator();
        const matchedItem = findBestAnswer(text);

        if (matchedItem) {
            renderEntryAnswer(matchedItem);
        } else {
            const fallbackMsg = CONFIG.publicMode
                ? "სამწუხაროდ, ამ კითხვაზე პასუხი ჩემს ბაზაში ვერ მოიძებნა. 😅\n\nსცადეთ სხვანაირად ჩამოაყალიბოთ კითხვა ან გამოიყენეთ სხვა საკვანძო სიტყვები."
                : "სამწუხაროდ, ამ კითხვაზე ზუსტი პასუხი ჩემს JSON ბაზაში ვერ მოიძებნა. 😅\n\n" +
                  "შეგიძლიათ სცადოთ სხვა კითხვა ან დაამატოთ ეს პასუხი მარჯვენა პანელიდან (JSON ბაზის მართვა).";
            appendMessage('bot', fallbackMsg);
            logUnanswered(text);
        }
    }, responseDelay);
}

/**
 * უპასუხო კითხვის ჩაწერა unanswered.json-ში (server.py-ის საშუალებით).
 * თუ სერვერი ვერ მუშაობს (მაგ. python -m http.server), კითხვა
 * დროებით ბრაუზერის localStorage-ში ინახება.
 */
async function logUnanswered(question) {
    if (CONFIG.publicMode) return;
    try {
        const res = await fetch(UNANSWERED_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ question })
        });
        if (!res.ok) throw new Error('HTTP ' + res.status);
    } catch (e) {
        console.warn('unanswered.json-ში ჩაწერა ვერ მოხერხდა, ვინახავ localStorage-ში:', e);
        try {
            const list = JSON.parse(localStorage.getItem(UNANSWERED_KEY) || '[]');
            list.push({ question, asked: new Date().toISOString() });
            localStorage.setItem(UNANSWERED_KEY, JSON.stringify(list));
        } catch (_) { /* ignore */ }
    }
}

function askQuickQuestion(text) {
    document.getElementById('userInput').value = text;
    handleUserSubmit(new Event('submit'));
}

function appendMessage(sender, text, title, extras = {}) {
    const container = document.getElementById('chatMessages');
    const isUser = sender === 'user';
    const timeStr = getCurrentTime();
    const titleHtml = title
        ? `<p class="text-sm font-semibold text-indigo-300 mb-2">${escapeHtml(title)}</p>`
        : '';
    const noteHtml = extras.note
        ? `<p class="text-[11px] text-emerald-300 mb-1.5">${escapeHtml(extras.note)}</p>`
        : '';

    // სურათი პასუხში
    const imgUrl = extras.image ? safeHttpUrl(extras.image, window.location.href) : '';
    const imageHtml = imgUrl
        ? `<img src="${escapeHtml(imgUrl)}" alt="" loading="lazy" onerror="this.remove()" class="mt-2.5 max-h-44 rounded-lg border border-slate-600/50 object-cover">`
        : '';

    // წყაროს ლინკი
    const srcUrl = extras.source ? safeHttpUrl(extras.source) : '';
    let sourceHtml = '';
    if (srcUrl) {
        const host = new URL(srcUrl).hostname.replace(/^www\./, '');
        const label = extras.sourceTitle || ('წყარო: ' + host);
        sourceHtml = `<div><a href="${escapeHtml(srcUrl)}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1.5 mt-2.5 text-xs text-indigo-300 hover:text-indigo-200 underline underline-offset-2"><i class="fa-solid fa-arrow-up-right-from-square text-[10px]"></i><span>${escapeHtml(label)}</span></a></div>`;
    }

    // მსგავსი შედეგები (სურათით ძებნისას)
    const relatedHtml = (extras.related && extras.related.length)
        ? `<div class="mt-3 pt-2.5 border-t border-slate-600/40">
               <div class="text-[11px] text-slate-400 mb-1.5">${escapeHtml(extras.relatedLabel || 'მსგავსი შედეგები:')}</div>
               <div class="flex flex-wrap gap-1.5">${extras.related.map(r => `
                   <button onclick="showEntryById('${escapeHtml(r.id)}')" class="bg-slate-600/60 hover:bg-indigo-600/80 text-slate-200 text-[11px] px-2 py-1 rounded-full transition border border-slate-500/40">${escapeHtml(r.label)} · ${r.pct}%</button>`).join('')}
               </div>
           </div>`
        : '';

    const msgHtml = isUser ? `
        <div class="flex items-start justify-end space-x-3 animate-fade-in">
            <div class="max-w-[85%] sm:max-w-[75%] bg-indigo-600 border border-indigo-500 rounded-2xl rounded-tr-none p-3.5 shadow-md text-white">
                <p class="text-sm leading-relaxed whitespace-pre-line">${escapeHtml(text)}</p>
                <span class="text-[10px] text-indigo-200 block text-right mt-1.5">${timeStr}</span>
            </div>
            <div class="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center text-indigo-300 shrink-0 mt-1 shadow-sm">
                <i class="fa-solid fa-user text-sm"></i>
            </div>
        </div>
    ` : `
        <div class="flex items-start space-x-3 animate-fade-in">
            <div class="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shrink-0 mt-1 shadow-md">
                <i class="fa-solid fa-robot text-sm"></i>
            </div>
            <div class="max-w-[85%] sm:max-w-[75%] bg-slate-700/70 border border-slate-600/40 rounded-2xl rounded-tl-none p-3.5 shadow-sm text-slate-100">
                ${titleHtml}${noteHtml}
                <p class="text-sm leading-relaxed whitespace-pre-line">${escapeHtml(text)}</p>
                ${imageHtml}${sourceHtml}${relatedHtml}
                <span class="text-[10px] text-slate-400 block text-right mt-1.5">${timeStr}</span>
            </div>
        </div>
    `;

    container.insertAdjacentHTML('beforeend', msgHtml);
    container.scrollTop = container.scrollHeight;
}

function showTypingIndicator() {
    const container = document.getElementById('chatMessages');
    const typingHtml = `
        <div id="typingIndicator" class="flex items-start space-x-3 animate-fade-in">
            <div class="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shrink-0 mt-1 shadow-md">
                <i class="fa-solid fa-robot text-sm"></i>
            </div>
            <div class="bg-slate-700/70 border border-slate-600/40 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm text-slate-300 flex items-center space-x-1.5">
                <span id="typingLabel" class="text-xs text-slate-400 mr-1">ბოტი წერს...</span>
                <div class="w-1.5 h-1.5 bg-indigo-400 rounded-full typing-dot"></div>
                <div class="w-1.5 h-1.5 bg-indigo-400 rounded-full typing-dot"></div>
                <div class="w-1.5 h-1.5 bg-indigo-400 rounded-full typing-dot"></div>
            </div>
        </div>
    `;
    container.insertAdjacentHTML('beforeend', typingHtml);
    container.scrollTop = container.scrollHeight;
}

function removeTypingIndicator() {
    const indicator = document.getElementById('typingIndicator');
    if (indicator) indicator.remove();
}

function clearChat() {
    const container = document.getElementById('chatMessages');
    container.innerHTML = `
        <div class="flex items-start space-x-3 animate-fade-in">
            <div class="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shrink-0 mt-1 shadow-md">
                <i class="fa-solid fa-robot text-sm"></i>
            </div>
            <div class="max-w-[85%] sm:max-w-[75%] bg-slate-700/70 border border-slate-600/40 rounded-2xl rounded-tl-none p-3.5 shadow-sm text-slate-100">
                <p class="text-sm leading-relaxed">
                    ჩატის ისტორია გასუფთავებულია. რით შემიძლია დაგეხმაროთ?
                </p>
                <span class="text-[10px] text-slate-400 block text-right mt-1.5">${getCurrentTime()}</span>
            </div>
        </div>
    `;
}

/* =========================================================================
   KNOWLEDGE BASE MANAGEMENT (knowledge.json + LOCAL STORAGE)
   ========================================================================= */

async function fetchDefaultKB() {
    const res = await fetch(KB_URL + '?v=' + (CONFIG.version || Date.now()), { cache: 'no-store' });
    if (!res.ok) throw new Error(`${KB_URL} ვერ ჩაიტვირთა (HTTP ${res.status})`);
    const data = await res.json();
    if (!Array.isArray(data)) throw new Error(`${KB_URL} უნდა შეიცავდეს მასივს (Array)`);
    return data;
}

async function loadKnowledgeBase() {
    // 1. საწყისი ბაზა knowledge.json-იდან
    try {
        DEFAULT_KNOWLEDGE_BASE = await fetchDefaultKB();
    } catch (e) {
        console.error(e);
        DEFAULT_KNOWLEDGE_BASE = [];
        if (CONFIG.publicMode) {
            appendMessage('bot', 'ბაზის ჩატვირთვა ვერ მოხერხდა. გთხოვთ, სცადოთ გვერდის განახლება.');
        } else {
            alert(
                "knowledge.json ვერ ჩაიტვირთა.\n\n" +
                "დარწმუნდი, რომ გვერდი სერვერიდან გაქვს გახსნილი " +
                "(python server.py) და ფაილი იმავე საქაღალდეშია."
            );
        }
    }

    // 2. თუ მომხმარებელს ბრაუზერში შენახული ცვლილებები აქვს, ისინი გამოიყენება
    // საჯარო საიტზე ყოველთვის knowledge.json გამოიყენება
    if (CONFIG.publicMode) {
        localStorage.removeItem(STORAGE_KEY);
        knowledgeBase = [...DEFAULT_KNOWLEDGE_BASE];
        return;
    }

    // localStorage-ში ბაზა მხოლოდ მაშინ რჩება, თუ სერვერზე ჩაწერა ვერ მოხერხდა.
    // ასეთ შემთხვევაში ვიყენებთ მას და ვცდილობთ knowledge.json-ში გადატანას.
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        try {
            knowledgeBase = JSON.parse(saved);
            syncKbToServer();
            return;
        } catch (e) {
            console.error('Failed to parse saved KB', e);
        }
    }
    knowledgeBase = [...DEFAULT_KNOWLEDGE_BASE];
}

/**
 * მთელ ბაზას წერს knowledge.json-ში (server.py-ის საშუალებით).
 * თუ სერვერი ვერ მუშაობს, ცვლილებები localStorage-ში ინახება, რომ არ დაიკარგოს.
 */
async function syncKbToServer() {
    try {
        const res = await fetch(KB_SAVE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(knowledgeBase)
        });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        localStorage.removeItem(STORAGE_KEY);
        return true;
    } catch (e) {
        console.warn('knowledge.json-ში ჩაწერა ვერ მოხერხდა, ვინახავ localStorage-ში:', e);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(knowledgeBase));
        return false;
    }
}

async function saveKnowledgeBase() {
    renderKbList();
    updateRawJsonEditor();
    loadCategoryChips();
    const ok = await syncKbToServer();
    if (!ok) {
        alert('⚠️ knowledge.json-ში ჩაწერა ვერ მოხერხდა.\n' +
              'გაუშვი სერვერი ბრძანებით: python server.py\n' +
              'ცვლილებები დროებით ბრაუზერში შენახულია.');
    }
}

async function resetDefaultKB() {
    if (!confirm('ბაზა თავიდან ჩაიტვირთება knowledge.json-იდან. ბრაუზერში შენახული, ჯერ არგადატანილი ცვლილებები წაიშლება. გავაგრძელოთ?')) return;

    try {
        DEFAULT_KNOWLEDGE_BASE = await fetchDefaultKB();
    } catch (e) {
        alert('შეცდომა: ' + e.message);
        return;
    }
    knowledgeBase = [...DEFAULT_KNOWLEDGE_BASE];
    localStorage.removeItem(STORAGE_KEY);
    renderKbList();
    updateRawJsonEditor();
    loadCategoryChips();
}

// Q&A ბარათების გამოტანა გვერდით პანელში
function renderKbList() {
    const container = document.getElementById('kbItemsContainer');
    const searchVal = (document.getElementById('kbSearch')?.value || '').toLowerCase();
    const badge = document.getElementById('itemCountBadge');

    if (badge) badge.innerText = `${knowledgeBase.length} Q&A`;
    if (!container) return;

    const filtered = knowledgeBase.filter(item =>
        (item.category || '').toLowerCase().includes(searchVal) ||
        (item.keywords || []).some(k => k.toLowerCase().includes(searchVal)) ||
        (item.answer || '').toLowerCase().includes(searchVal)
    );

    if (filtered.length === 0) {
        container.innerHTML = `<div class="text-center text-xs text-slate-500 py-6">მონაცემები ვერ მოიძებნა</div>`;
        return;
    }

    container.innerHTML = filtered.map(item => `
        <div class="bg-slate-900/60 border border-slate-700/60 rounded-xl p-2.5 space-y-1.5 text-xs hover:border-slate-600 transition">
            <div class="flex items-center justify-between">
                <span class="flex items-center gap-1.5">
                    <span class="text-[10px] font-semibold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">${escapeHtml(item.category || '')}</span>
                    ${item.source ? '<i class="fa-solid fa-link text-[10px] text-slate-400" title="აქვს წყაროს ლინკი"></i>' : ''}
                    ${(item.images && item.images.length) ? `<span class="text-[10px] text-slate-400" title="საცნობარო სურათები"><i class="fa-solid fa-image"></i> ${item.images.length}</span>` : ''}
                </span>
                <button onclick="deleteQaItem('${escapeHtml(item.id)}')" class="text-slate-500 hover:text-red-400 transition" title="წაშლა">
                    <i class="fa-solid fa-trash-can"></i>
                </button>
            </div>
            <div class="text-slate-200 font-medium">${escapeHtml((item.questions && item.questions[0]) || (item.keywords && item.keywords[0]) || '')}</div>
            <div class="text-slate-400 text-[11px] line-clamp-2">${escapeHtml(item.answer || '')}</div>
        </div>
    `).join('');
}

function deleteQaItem(id) {
    knowledgeBase = knowledgeBase.filter(item => item.id !== id);
    saveKnowledgeBase();
}

async function saveNewQaPair() {
    const title = document.getElementById('newTitle').value.trim();
    const cat = document.getElementById('newCategory').value.trim() || 'ზოგადი';
    const kwRaw = document.getElementById('newKeywords').value.trim();
    const qRaw = document.getElementById('newQuestions').value.trim();
    const ans = document.getElementById('newAnswer').value.trim();
    const sourceRaw = document.getElementById('newSource').value.trim();
    const sourceTitle = document.getElementById('newSourceTitle').value.trim();
    const imageFiles = Array.from(document.getElementById('newImages').files || []);

    if (!kwRaw || !ans) {
        alert('გთხოვთ შეავსოთ საკვანძო სიტყვები და ბოტის პასუხი!');
        return;
    }

    let source = '';
    if (sourceRaw) {
        source = safeHttpUrl(sourceRaw);
        if (!source) {
            alert('წყაროს ლინკი უნდა იწყებოდეს http:// ან https://');
            return;
        }
    }

    // სურათების ატვირთვა სერვერზე (images/ საქაღალდეში)
    const images = [];
    for (const file of imageFiles) {
        try {
            images.push(await uploadReferenceImage(file));
        } catch (e) {
            alert('სურათის ატვირთვა ვერ მოხერხდა: ' + file.name + '\n' + e.message +
                  '\n\nდარწმუნდი, რომ გაშვებულია: python server.py');
            return;
        }
    }

    const keywords = kwRaw.split(',').map(s => s.trim()).filter(Boolean);
    const questions = qRaw
        ? qRaw.split('\n').map(s => s.trim()).filter(Boolean)
        : [keywords[0]];

    knowledgeBase.push({
        id: 'custom_' + Date.now(),
        ...(title && { title }),
        ...(source && { source }),
        ...(source && sourceTitle && { source_title: sourceTitle }),
        ...(images.length && { images }),
        category: cat,
        keywords: keywords,
        questions: questions,
        answer: ans
    });
    saveKnowledgeBase();

    document.getElementById('newTitle').value = '';
    document.getElementById('newSource').value = '';
    document.getElementById('newSourceTitle').value = '';
    document.getElementById('newImages').value = '';
    document.getElementById('newCategory').value = '';
    document.getElementById('newKeywords').value = '';
    document.getElementById('newQuestions').value = '';
    document.getElementById('newAnswer').value = '';

    switchKbTab('list');
}

// RAW JSON ნახვა / იმპორტი / ექსპორტი
function updateRawJsonEditor() {
    const editor = document.getElementById('rawJsonEditor');
    if (editor) {
        editor.value = JSON.stringify(knowledgeBase, null, 2);
    }
}

function applyRawJson() {
    const editor = document.getElementById('rawJsonEditor');
    try {
        const parsed = JSON.parse(editor.value);
        if (Array.isArray(parsed)) {
            knowledgeBase = parsed;
            saveKnowledgeBase();
            alert('JSON ბაზა წარმატებით განახლდა!');
        } else {
            alert('შეცდომა: JSON უნდა იყოს მასივი (Array)!');
        }
    } catch (err) {
        alert('არასწორი JSON ფორმატი: ' + err.message);
    }
}

function exportJsonFile() {
    const dataStr = 'data:text/json;charset=utf-8,' +
        encodeURIComponent(JSON.stringify(knowledgeBase, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', dataStr);
    dlAnchor.setAttribute('download', 'knowledge.json');
    document.body.appendChild(dlAnchor);
    dlAnchor.click();
    dlAnchor.remove();
}

function importJsonFile(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const importedData = JSON.parse(e.target.result);
            if (Array.isArray(importedData)) {
                knowledgeBase = importedData;
                saveKnowledgeBase();
                alert('ახალი JSON ფაილი წარმატებით აიტვირთა!');
            } else {
                alert('შეცდომა: ატვირთული ფაილი უნდა შეიცავდეს JSON მასივს.');
            }
        } catch (err) {
            alert('ფაილის წაკითხვის შეცდომა: ' + err.message);
        }
    };
    reader.readAsText(file);
}

// სწრაფი შეკითხვების ღილაკები
function loadCategoryChips() {
    const container = document.getElementById('quickChips');
    if (!container) return;

    const sampleQuestions = [];
    knowledgeBase.forEach(item => {
        if (item.questions && item.questions.length > 0) {
            sampleQuestions.push(item.questions[0]);
        } else if (item.keywords && item.keywords.length > 0) {
            sampleQuestions.push(item.keywords[0]);
        }
    });

    const shuffled = sampleQuestions.sort(() => 0.5 - Math.random()).slice(0, 6);

    container.innerHTML = shuffled.map(q => `
        <button
            onclick="askQuickQuestion('${escapeHtml(q)}')"
            class="bg-slate-700/80 hover:bg-indigo-600/80 hover:text-white text-slate-300 text-xs px-2.5 py-1 rounded-full transition border border-slate-600/50 truncate max-w-[200px]"
        >
            ${escapeHtml(q)}
        </button>
    `).join('');
}

/* =========================================================================
   UI TABS, THEME TOGGLE, MODAL
   ========================================================================= */

function switchKbTab(tabName) {
    const tabs = {
        list: document.getElementById('tabList'),
        add: document.getElementById('tabAdd'),
        raw: document.getElementById('tabRaw')
    };
    const views = {
        list: document.getElementById('kbTabList'),
        add: document.getElementById('kbTabAdd'),
        raw: document.getElementById('kbTabRaw')
    };

    Object.values(tabs).forEach(t => {
        t.className = 'flex-1 py-2.5 text-center text-slate-400 hover:text-slate-200 transition';
    });
    Object.values(views).forEach(v => v.classList.add('hidden'));

    tabs[tabName].className =
        'flex-1 py-2.5 text-center text-indigo-400 border-b-2 border-indigo-500 transition font-semibold';
    views[tabName].classList.remove('hidden');

    if (tabName === 'raw') updateRawJsonEditor();
}

function toggleTheme() {
    const html = document.documentElement;
    const themeIcon = document.getElementById('themeIcon');
    if (html.classList.contains('dark')) {
        html.classList.remove('dark');
        themeIcon.className = 'fa-solid fa-moon';
    } else {
        html.classList.add('dark');
        themeIcon.className = 'fa-solid fa-sun';
    }
}

function toggleKBModal() {
    // JSON პანელი ნაგულისხმევად დამალულია და გვერდიდან გამოსრიალდება ღილაკზე დაჭერით
    document.getElementById('mobileKbModal').classList.toggle('hidden');
}

/* =========================================================================
   ENTRY RENDERING, SOURCE LINKS, IMAGE SEARCH
   ========================================================================= */

/** პასუხის გამოტანა ბაზის ჩანაწერიდან (სათაური, სურათი, წყაროს ლინკი) */
function renderEntryAnswer(item, extras = {}) {
    appendMessage('bot', item.answer, item.title, Object.assign({
        source: item.source,
        sourceTitle: item.source_title,
        image: item.images && item.images[0]
    }, extras));
}

function showEntryById(id) {
    const item = knowledgeBase.find(i => i.id === id);
    if (item) renderEntryAnswer(item);
}

function entryLabel(item) {
    return item.title || (item.questions && item.questions[0]) || (item.keywords && item.keywords[0]) || item.id;
}

/** მხოლოდ http/https ლინკები (javascript: და სხვა სქემები იბლოკება) */
function safeHttpUrl(value, base) {
    if (!value || typeof value !== 'string') return '';
    try {
        const url = base ? new URL(value.trim(), base) : new URL(value.trim());
        return (url.protocol === 'http:' || url.protocol === 'https:') ? url.href : '';
    } catch (_) {
        return '';
    }
}

/** საცნობარო სურათის ატვირთვა server.py-ზე; აბრუნებს ბილიკს (images/...) */
async function uploadReferenceImage(file) {
    const res = await fetch(IMAGE_UPLOAD_URL, {
        method: 'POST',
        headers: { 'Content-Type': file.type || 'application/octet-stream' },
        body: file
    });
    let data = {};
    try { data = await res.json(); } catch (_) { /* ignore */ }
    if (!res.ok || !data.path) {
        throw new Error(data.error || ('HTTP ' + res.status));
    }
    return data.path;
}

// ---- სურათით ძებნა: MobileNet (TensorFlow.js) ვექტორები + cosine მსგავსება ----
const TFJS_URL = 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.22.0/dist/tf.min.js';
const MOBILENET_URL = 'https://cdn.jsdelivr.net/npm/@tensorflow-models/mobilenet@2.1.1/dist/mobilenet.min.js';
const MOBILENET_MODEL_URL = 'https://storage.googleapis.com/tfjs-models/savedmodel/mobilenet_v2_1.0_224/model.json';
const MAX_UPLOAD_IMAGE_BYTES = 12 * 1024 * 1024;

let imageModelPromise = null;
let embCache = null;
const EMB_CACHE_KEY = 'smart_bot_img_emb_' + (CONFIG.version || 'dev');

function loadScriptOnce(src) {
    return new Promise((resolve, reject) => {
        if (document.querySelector(`script[data-lib="${src}"]`)) {
            resolve();
            return;
        }
        const s = document.createElement('script');
        s.src = src;
        s.async = true;
        s.dataset.lib = src;
        s.onload = () => resolve();
        s.onerror = () => reject(new Error('ბიბლიოთეკა ვერ ჩაიტვირთა: ' + src));
        document.head.appendChild(s);
    });
}

function getImageModel() {
    if (!imageModelPromise) {
        imageModelPromise = (async () => {
            await loadScriptOnce(TFJS_URL);
            await loadScriptOnce(MOBILENET_URL);
            let lastErr;
            for (const modelUrl of [MOBILENET_MODEL_URL, null]) {
                try {
                    const opts = { version: 2, alpha: 1.0 };
                    if (modelUrl) opts.modelUrl = modelUrl;
                    return await window.mobilenet.load(opts);
                } catch (e) {
                    lastErr = e;
                    console.warn('MobileNet ჩატვირთვა ვერ მოხერხდა:', modelUrl || 'default', e);
                }
            }
            throw lastErr;
        })();
        imageModelPromise.catch(() => { imageModelPromise = null; });
    }
    return imageModelPromise;
}

function loadImageElement(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('სურათი ვერ გაიხსნა'));
        img.src = src;
    });
}

async function embedImage(model, img) {
    const tensor = model.infer(img, true);
    const data = await tensor.data();
    if (tensor.dispose) tensor.dispose();
    let norm = 0;
    for (let i = 0; i < data.length; i++) norm += data[i] * data[i];
    norm = Math.sqrt(norm) || 1;
    return Array.from(data, v => Math.round((v / norm) * 10000) / 10000);
}

function cosine(a, b) {
    let s = 0;
    const n = Math.min(a.length, b.length);
    for (let i = 0; i < n; i++) s += a[i] * b[i];
    return s;
}

function getEmbCache() {
    if (!embCache) {
        try { embCache = JSON.parse(localStorage.getItem(EMB_CACHE_KEY) || '{}'); }
        catch (_) { embCache = {}; }
    }
    return embCache;
}

function saveEmbCache() {
    try { localStorage.setItem(EMB_CACHE_KEY, JSON.stringify(embCache)); }
    catch (_) { /* ადგილი შეივსო, არაუშავს */ }
}

function collectReferenceImages() {
    const refs = [];
    knowledgeBase.forEach(item => {
        (item.images || []).forEach(src => {
            const url = safeHttpUrl(src, window.location.href);
            if (url) refs.push({ id: item.id, url });
        });
    });
    return refs;
}

function setTypingLabel(text) {
    const el = document.getElementById('typingLabel');
    if (el) el.textContent = text;
}

function appendUserImage(objectUrl) {
    const container = document.getElementById('chatMessages');
    container.insertAdjacentHTML('beforeend', `
        <div class="flex items-start justify-end space-x-3 animate-fade-in">
            <div class="max-w-[85%] sm:max-w-[75%] bg-indigo-600 border border-indigo-500 rounded-2xl rounded-tr-none p-2.5 shadow-md text-white">
                <img src="${objectUrl}" alt="" class="max-h-48 rounded-lg">
                <span class="text-[10px] text-indigo-200 block text-right mt-1.5">${getCurrentTime()}</span>
            </div>
            <div class="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center text-indigo-300 shrink-0 mt-1 shadow-sm">
                <i class="fa-solid fa-user text-sm"></i>
            </div>
        </div>
    `);
    container.scrollTop = container.scrollHeight;
}

function handleImageSelected(event) {
    const input = event.target;
    const file = input.files && input.files[0];
    input.value = '';   // იმავე ფაილის ხელახლა არჩევა რომ შეიძლებოდეს
    if (file) searchByImage(file);
}

async function searchByImage(file) {
    if (!file.type.startsWith('image/')) {
        appendMessage('bot', 'გთხოვთ აირჩიოთ სურათის ფაილი (JPG, PNG, WEBP).');
        return;
    }
    if (file.size > MAX_UPLOAD_IMAGE_BYTES) {
        appendMessage('bot', 'სურათი ზედმეტად დიდია (მაქსიმუმ 12 MB).');
        return;
    }

    const objectUrl = URL.createObjectURL(file);
    appendUserImage(objectUrl);
    showTypingIndicator();

    try {
        const refs = collectReferenceImages();
        if (refs.length === 0) {
            appendMessage('bot', 'ბაზაში ჯერ არცერთ ჩანაწერს არ აქვს საცნობარო სურათი, ამიტომ სურათით ძებნა ვერ შევძელი. 📷');
            return;
        }

        setTypingLabel('მოდელი იტვირთება...');
        const model = await getImageModel();

        setTypingLabel('სურათი მუშავდება...');
        const queryVec = await embedImage(model, await loadImageElement(objectUrl));

        // საცნობარო სურათების ვექტორები (ქეშირდება ბრაუზერში)
        const cache = getEmbCache();
        let done = 0;
        let computed = 0;
        for (const ref of refs) {
            done++;
            if (!cache[ref.url]) {
                setTypingLabel(`საცნობარო სურათები: ${done}/${refs.length}`);
                try {
                    cache[ref.url] = await embedImage(model, await loadImageElement(ref.url));
                    computed++;
                } catch (e) {
                    console.warn('საცნობარო სურათი გამოტოვებულია:', ref.url, e);
                }
            }
        }
        if (computed > 0) saveEmbCache();

        // თითო ჩანაწერის ქულა = მისი სურათებიდან საუკეთესო
        const best = new Map();
        refs.forEach(ref => {
            const vec = cache[ref.url];
            if (!vec) return;
            const score = cosine(queryVec, vec);
            if (!best.has(ref.id) || score > best.get(ref.id)) best.set(ref.id, score);
        });

        const ranked = [...best.entries()]
            .map(([id, score]) => ({ item: knowledgeBase.find(i => i.id === id), score }))
            .filter(r => r.item)
            .sort((a, b) => b.score - a.score);

        console.log('სურათით ძებნის ქულები:', ranked.map(r => [entryLabel(r.item), r.score.toFixed(3)]));

        const thr = CONFIG.imageThreshold;
        const asRelated = r => ({ id: r.item.id, label: entryLabel(r.item), pct: Math.round(r.score * 100) });

        if (ranked.length && ranked[0].score >= thr) {
            const top = ranked[0];
            renderEntryAnswer(top.item, {
                note: `📷 სურათით მოძებნილი · მსგავსება ${Math.round(top.score * 100)}%`,
                related: ranked.slice(1, 4).filter(r => r.score >= thr).map(asRelated)
            });
        } else if (ranked.length && ranked[0].score >= thr - IMAGE_NEAR_WINDOW) {
            appendMessage('bot', 'ზუსტი დამთხვევა ვერ ვიპოვე, მაგრამ ყველაზე ახლოს ეს ჩანაწერებია. შეგიძლიათ დააჭიროთ და გადახედოთ: 🔎', '', {
                related: ranked.slice(0, 3).filter(r => r.score >= thr - IMAGE_NEAR_WINDOW).map(asRelated),
                relatedLabel: 'ყველაზე ახლო:'
            });
        } else {
            appendMessage('bot', 'ამ სურათით მსგავსი ჩანაწერი ბაზაში ვერ მოიძებნა. 😅\n\nსცადეთ უფრო მკაფიო სურათი ან ჩაწერეთ კითხვა ტექსტით.');
        }
    } catch (e) {
        console.error('სურათით ძებნის შეცდომა:', e);
        appendMessage('bot', 'სურათის დამუშავება ვერ მოხერხდა. შეამოწმეთ ინტერნეტი და სცადეთ თავიდან.\n(' + e.message + ')');
    } finally {
        removeTypingIndicator();
    }
}

/* =========================================================================
   HELPERS
   ========================================================================= */

function getCurrentTime() {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

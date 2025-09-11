// 공문서 검증 및 교정 프로그램 - 완전히 수정된 버전

// 문서 유형 설정
let documentType = 'external';

// 검증 규칙
const validationRules = {
    dateFormat: {
        message: "날짜는 '2025. 9. 10.(월)' 형식으로 표기해야 합니다.",
        severity: "error"
    },
    timeFormat: {
        message: "시간은 24시각제로 '09:00' 형식으로 표기해야 합니다.",
        severity: "error"
    },
    moneyFormat: {
        message: "금액은 '금113,560원(금일십일만삼천오백육십원)' 형식으로 표기해야 합니다.",
        severity: "error"
    }
};

// 맞춤법 및 띄어쓰기 오류 목록
const commonMistakes = [
    // 맞춤법 오류들
    { wrong: "워크샵", correct: "워크숍", type: "spelling" },
    { wrong: "레크레이션", correct: "레크리에이션", type: "spelling" },
    { wrong: "리더쉽", correct: "리더십", type: "spelling" },
    { wrong: "윈도우", correct: "윈도", type: "spelling" },
    { wrong: "사료됨", correct: "생각함", type: "spelling" },
    { wrong: "몇일", correct: "며칠", type: "spelling" },
    { wrong: "몇 일", correct: "며칠", type: "spelling" },

    // 조사/어미 띄어쓰기 오류들
    { wrong: "계획인 바", correct: "계획인바", type: "spacing" },
    { wrong: "요청한 바", correct: "요청한바", type: "spacing" },
    { wrong: "문서 입니다", correct: "문서입니다", type: "spacing" },
    { wrong: "요청 드립니다", correct: "요청드립니다", type: "spacing" },
    { wrong: "협조 바랍니다", correct: "협조바랍니다", type: "spacing" },

    // 접두사 띄어쓰기 오류들
    { wrong: "재 교육", correct: "재교육", type: "spacing" },
    { wrong: "재 검토", correct: "재검토", type: "spacing" },
    { wrong: "또 한", correct: "또한", type: "spacing" },

    // 시간 관련 띄어쓰기 오류들
    { wrong: "계약시", correct: "계약 시", type: "spacing" },
    { wrong: "승인시", correct: "승인 시", type: "spacing" },
    { wrong: "승인후", correct: "승인 후", type: "spacing" },
    { wrong: "완료후", correct: "완료 후", type: "spacing" },
    { wrong: "기한내", correct: "기한 내", type: "spacing" },

    // 단위/숫자 띄어쓰기 오류들
    { wrong: "1 개", correct: "1개", type: "spacing" },
    { wrong: "2 개", correct: "2개", type: "spacing" },
    { wrong: "1 부", correct: "1부", type: "spacing" },
    { wrong: "2 부", correct: "2부", type: "spacing" },
    { wrong: "1 명", correct: "1명", type: "spacing" },
    { wrong: "2 명", correct: "2명", type: "spacing" },
    { wrong: "1 학년", correct: "1학년", type: "spacing" },
    { wrong: "2 학년", correct: "2학년", type: "spacing" },
    { wrong: "고 1", correct: "고1", type: "spacing" },
    { wrong: "고 2", correct: "고2", type: "spacing" },
    { wrong: "제 1조", correct: "제1조", type: "spacing" },
    { wrong: "제 2조", correct: "제2조", type: "spacing" },

    // 공문서 특수 표현 띄어쓰기 오류들
    { wrong: "관련 하여", correct: "관련하여", type: "spacing" },
    { wrong: "대하 여", correct: "대하여", type: "spacing" },
    { wrong: "의하 여", correct: "의하여", type: "spacing" },
    { wrong: "따르 면", correct: "따르면", type: "spacing" },

    // 존칭 관련 오류들
    { wrong: "교육장님", correct: "교육장", type: "spelling" },
    { wrong: "교장님", correct: "교장", type: "spelling" },
    { wrong: "부장님", correct: "부장", type: "spelling" }
];

// 예시 문서
const sampleDocument = `수신 ○○○기관장

제목 2024년도 업무협조 요청

1. 관련: 교육부-1234(2024. 11. 1.)

○○○○와 관련하여 다음과 같이 협조를 요청드리오니 검토 후 회신하여 주시기 바랍니다.

1. 협조사항

가. 관련 자료 제출
나. 담당자 지정

2. 협조기한: 2024. 12. 31.(화) 14:00까지

3. 소요예산: 금5,000,000원(금오백만원)

4. 회의 개최

가. 일시: 2024. 12. 15.(일) 09:00~13:30
나. 장소: 경기도의정부교육지원청 3층 회의실
다. 대상: 교육장, 교장 등 관계자

붙임  1. ○○○ 계획서 1부.
  2. ○○○ 서류 1부.  끝.`;

// 전역 상태
let currentValidationResults = {
    errors: [],
    warnings: [],
    suggestions: [],
    originalText: '',
    correctedText: ''
};

// DOM 요소 참조
let elements = {};

// 초기화 함수
function init() {
    console.log('Initializing validation app...');

    elements = {
        documentInput: document.getElementById('documentInput'),
        documentType: document.getElementById('documentType'),
        charCount: document.getElementById('charCount'),
        validateBtn: document.getElementById('validateBtn'),
        clearBtn: document.getElementById('clearBtn'),
        sampleBtn: document.getElementById('sampleBtn'),
        validationSummary: document.getElementById('validationSummary'),
        validationProgress: document.getElementById('validationProgress'),
        progressFill: document.getElementById('progressFill'),
        progressText: document.getElementById('progressText'),
        resultsTabs: document.getElementById('resultsTabs'),
        resultsContent: document.getElementById('resultsContent'),
        correctedPreview: document.getElementById('correctedPreview'),
        correctedDocument: document.getElementById('correctedDocument'),
        copyBtn: document.getElementById('copyBtn'),
        downloadBtn: document.getElementById('downloadBtn'),
        summaryStats: document.getElementById('summaryStats'),
        errorCount: document.getElementById('errorCount'),
        warningCount: document.getElementById('warningCount'),
        suggestionCount: document.getElementById('suggestionCount')
    };

    setupEventListeners();
    updateCharCount();
    console.log('App initialized successfully');
}

// 이벤트 리스너 설정
function setupEventListeners() {
    if (elements.documentType) {
        elements.documentType.addEventListener('change', function(e) {
            documentType = e.target.value;
        });
    }

    if (elements.documentInput) {
        elements.documentInput.addEventListener('input', updateCharCount);
    }

    if (elements.validateBtn) {
        elements.validateBtn.addEventListener('click', startValidation);
    }

    if (elements.clearBtn) {
        elements.clearBtn.addEventListener('click', clearDocument);
    }

    if (elements.sampleBtn) {
        elements.sampleBtn.addEventListener('click', loadSampleDocument);
    }

    if (elements.copyBtn) {
        elements.copyBtn.addEventListener('click', copyToClipboard);
    }

    if (elements.downloadBtn) {
        elements.downloadBtn.addEventListener('click', downloadDocument);
    }

    if (elements.resultsTabs) {
        elements.resultsTabs.addEventListener('click', handleTabClick);
    }
}

// 글자수 업데이트
function updateCharCount() {
    if (!elements.documentInput || !elements.charCount) return;

    const text = elements.documentInput.value;
    const count = text.length;
    const maxCount = 10000;

    elements.charCount.textContent = count;

    const charCountElement = elements.charCount.parentElement;
    if (charCountElement) {
        charCountElement.classList.remove('warning', 'error');

        if (count > maxCount * 0.9) {
            charCountElement.classList.add('warning');
        }

        if (count >= maxCount) {
            charCountElement.classList.add('error');
        }
    }
}

// 검증 시작
async function startValidation() {
    if (!elements.documentInput) return;

    const text = elements.documentInput.value.trim();
    if (!text) {
        showMessage('검증할 문서를 입력해주세요.', 'warning');
        return;
    }

    if (elements.validateBtn) {
        elements.validateBtn.disabled = true;
        elements.validateBtn.innerHTML = '<span class="loading-spinner"></span> 검증 중...';
    }

    if (elements.validationProgress) {
        elements.validationProgress.classList.remove('hidden');
    }

    try {
        await performValidation(text);
        displayValidationResults();
    } catch (error) {
        console.error('Validation error:', error);
        showMessage('검증 중 오류가 발생했습니다.', 'error');
    } finally {
        if (elements.validateBtn) {
            elements.validateBtn.disabled = false;
            elements.validateBtn.innerHTML = '🔍 검증 시작';
        }

        if (elements.validationProgress) {
            elements.validationProgress.classList.add('hidden');
        }
    }
}

// 검증 수행
async function performValidation(text) {
    currentValidationResults = {
        errors: [],
        warnings: [],
        suggestions: [],
        originalText: text,
        correctedText: text
    };

    const steps = [
        { name: '날짜/시간 표기법 검사', progress: 20, fn: () => checkDateTimeFormat(text) },
        { name: '맞춤법 및 띄어쓰기 검사', progress: 40, fn: () => checkSpellingAndSpacing(text) },
        { name: '문서 구조 검사', progress: 60, fn: () => checkDocumentStructure(text) },
        { name: '붙임 표기법 검사', progress: 80, fn: () => checkAttachmentFormat(text) },
        { name: '종합 검토', progress: 100, fn: () => generateCorrectedText() }
    ];

    for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        updateProgress(step.progress, step.name);

        step.fn();

        await new Promise(resolve => setTimeout(resolve, 200));
    }
}

// 진행률 업데이트
function updateProgress(progress, text) {
    if (elements.progressFill) {
        elements.progressFill.style.width = progress + '%';
    }

    if (elements.progressText) {
        elements.progressText.textContent = text;
    }
}

// 날짜/시간 표기법 검사 - 단순하고 확실한 버전
function checkDateTimeFormat(text) {
    const issues = [];

    // 1. 년월일 한국어 표기 검사
    const koreanDateRegex = /\d{4}년\s*\d{1,2}월\s*\d{1,2}일/g;
    let match;
    while ((match = koreanDateRegex.exec(text)) !== null) {
        const original = match[0];
        const corrected = original.replace(/(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일/, '$1. $2. $3.');

        issues.push({
            id: 'korean-date-' + match.index,
            type: 'error',
            title: '잘못된 날짜 표기법',
            description: '날짜는 "2025. 9. 10." 형식으로 표기해야 합니다.',
            position: match.index,
            original: original,
            suggestion: corrected,
            rule: '공문서 작성 편람'
        });
    }

    // 2. 하이픈 날짜 검사
    const hyphenDateRegex = /\d{4}-\d{2}-\d{2}/g;
    while ((match = hyphenDateRegex.exec(text)) !== null) {
        const original = match[0];
        const parts = original.split('-');
        const year = parts[0];
        const month = parseInt(parts[1]).toString(); // 앞자리 0 제거
        const day = parseInt(parts[2]).toString();   // 앞자리 0 제거
        const corrected = year + '. ' + month + '. ' + day + '.';

        issues.push({
            id: 'hyphen-date-' + match.index,
            type: 'error',
            title: '잘못된 날짜 표기법',
            description: '날짜는 "2025. 9. 10." 형식으로 표기해야 합니다.',
            position: match.index,
            original: original,
            suggestion: corrected,
            rule: '공문서 작성 편람'
        });
    }

    // 3. 잘못된 온점 날짜 검사 (띄어쓰기 없거나 앞자리 0이 있는 경우)
    const dotDateRegex = /\d{4}\.\d{1,2}\.\d{1,2}\./g;
    while ((match = dotDateRegex.exec(text)) !== null) {
        const original = match[0];
        // 올바른 형식인지 확인 (띄어쓰기가 있는지)
        const hasSpaces = /\d{4}\. \d{1,2}\. \d{1,2}\./.test(original);

        if (!hasSpaces) {
            // 띄어쓰기 추가
            const corrected = original.replace(/(\d{4})\.(\d{1,2})\.(\d{1,2})\./, '$1. $2. $3.');

            issues.push({
                id: 'dot-spacing-' + match.index,
                type: 'error',
                title: '날짜 띄어쓰기 오류',
                description: '온점 뒤에 한 칸 띄어써야 합니다.',
                position: match.index,
                original: original,
                suggestion: corrected,
                rule: '공문서 작성 편람'
            });
        }
    }

    // 4. 앞자리 0이 있는 날짜 검사
    const zeroDateRegex = /\d{4}\. 0(\d)\. /g;
    while ((match = zeroDateRegex.exec(text)) !== null) {
        const original = match[0];
        const corrected = original.replace('0' + match[1], match[1]);

        issues.push({
            id: 'zero-date-' + match.index,
            type: 'error',
            title: '날짜 앞자리 0 오류',
            description: '월과 일이 한자리일 때는 앞에 0을 붙이지 않습니다.',
            position: match.index,
            original: original,
            suggestion: corrected,
            rule: '공문서 작성 편람'
        });
    }

    // 5. 시간 표기 검사 - 16시 30분
    const koreanTimeRegex = /\d{1,2}시\s*\d{1,2}분/g;
    while ((match = koreanTimeRegex.exec(text)) !== null) {
        const original = match[0];
        const timeMatch = original.match(/(\d{1,2})시\s*(\d{1,2})분/);
        if (timeMatch) {
            const hour = timeMatch[1].padStart(2, '0');
            const minute = timeMatch[2].padStart(2, '0');
            const corrected = hour + ':' + minute;

            issues.push({
                id: 'korean-time-' + match.index,
                type: 'error',
                title: '잘못된 시간 표기법',
                description: '시간은 "16:30" 형식으로 표기해야 합니다.',
                position: match.index,
                original: original,
                suggestion: corrected,
                rule: '공문서 작성 편람'
            });
        }
    }

    // 6. 시간만 있는 경우 - 16시
    const koreanHourRegex = /\d{1,2}시(?!\s*\d)/g;
    while ((match = koreanHourRegex.exec(text)) !== null) {
        const original = match[0];
        const hourMatch = original.match(/(\d{1,2})시/);
        if (hourMatch) {
            const hour = hourMatch[1].padStart(2, '0');
            const corrected = hour + ':00';

            issues.push({
                id: 'korean-hour-' + match.index,
                type: 'error',
                title: '잘못된 시간 표기법',
                description: '시간은 "16:00" 형식으로 표기해야 합니다.',
                position: match.index,
                original: original,
                suggestion: corrected,
                rule: '공문서 작성 편람'
            });
        }
    }

    currentValidationResults.errors.push(...issues);
}

// 문서 구조 검사
function checkDocumentStructure(text) {
    const issues = [];

    // 끝 표시법 검사
    const trimmedText = text.trim();
    if (!trimmedText.endsWith('.  끝.')) {
        issues.push({
            id: 'ending-format',
            type: 'error',
            title: '끝 표시법 오류',
            description: '본문 마지막에 "마침표 + 2칸 띄어쓰기 + 끝."을 표시해야 합니다.',
            position: text.length - 10,
            original: '현재 형식',
            suggestion: '.  끝.',
            rule: '공문서 작성 편람'
        });
    }

    currentValidationResults.errors.push(...issues);
}

// 붙임 표기법 검사
function checkAttachmentFormat(text) {
    const issues = [];

    const lines = text.split('\n');
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // 붙임으로 시작하는 라인 검사
        if (line.startsWith('붙임')) {
            // 붙임 뒤 띄어쓰기 검사 - 정확히 2칸이어야 함
            const spaceMatch = line.match(/^붙임(\s*)/);
            if (spaceMatch && spaceMatch[1].length !== 2) {
                issues.push({
                    id: 'attachment-spacing-' + i,
                    type: 'error',
                    title: '붙임 띄어쓰기 오류',
                    description: '붙임 뒤에 정확히 2칸 띄어써야 합니다.',
                    position: text.indexOf(line),
                    original: '붙임' + spaceMatch[1],
                    suggestion: '붙임  ',
                    rule: '공문서 작성 편람'
                });
            }
        }
    }

    currentValidationResults.errors.push(...issues);
}

// 맞춤법 및 띄어쓰기 검사
function checkSpellingAndSpacing(text) {
    const issues = [];

    commonMistakes.forEach((mistake, index) => {
        const regex = new RegExp(mistake.wrong.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
        let match;
        while ((match = regex.exec(text)) !== null) {
            issues.push({
                id: mistake.type + '-' + index + '-' + match.index,
                type: mistake.type === 'spelling' ? 'error' : 'warning',
                title: mistake.type === 'spelling' ? '맞춤법 오류' : '띄어쓰기 오류',
                description: '"' + mistake.wrong + '"는 "' + mistake.correct + '"로 수정해야 합니다.',
                position: match.index,
                original: mistake.wrong,
                suggestion: mistake.correct,
                rule: mistake.type === 'spelling' ? '한글 맞춤법 규정' : '한글 띄어쓰기 규정'
            });
        }
    });

    issues.forEach(issue => {
        if (issue.type === 'error') {
            currentValidationResults.errors.push(issue);
        } else {
            currentValidationResults.warnings.push(issue);
        }
    });
}

// 교정된 텍스트 생성
function generateCorrectedText() {
    let corrected = currentValidationResults.originalText;

    const allIssues = [
        ...currentValidationResults.errors,
        ...currentValidationResults.warnings
    ];

    // 위치 기준으로 역순 정렬
    allIssues.sort((a, b) => b.position - a.position);

    allIssues.forEach(issue => {
        if (issue.original && issue.suggestion && 
            issue.original !== '현재 형식' && issue.original !== '없음') {
            // 전체 텍스트에서 첫 번째 발견된 것만 교체
            corrected = corrected.replace(issue.original, issue.suggestion);
        }
    });

    // 끝 표시법 처리
    const trimmed = corrected.trim();
    if (!trimmed.endsWith('.  끝.')) {
        // 기존 끝. 관련 표현 제거
        corrected = corrected.replace(/\.?\s*끝\.?\s*$/, '');
        corrected = corrected.trim() + '.  끝.';
    }

    currentValidationResults.correctedText = corrected;
}

// 검증 결과 표시
function displayValidationResults() {
    const { errors, warnings, suggestions } = currentValidationResults;

    updateSummaryStats(errors.length, warnings.length, suggestions.length);
    updateValidationSummary();

    if (elements.resultsTabs) {
        elements.resultsTabs.classList.remove('hidden');
    }

    showTabContent('all');

    if (currentValidationResults.correctedText !== currentValidationResults.originalText) {
        showCorrectedPreview();
    }
}

// 통계 업데이트
function updateSummaryStats(errorCount, warningCount, suggestionCount) {
    if (elements.summaryStats) {
        elements.summaryStats.classList.remove('hidden');
    }

    if (elements.errorCount) {
        elements.errorCount.textContent = errorCount;
    }

    if (elements.warningCount) {
        elements.warningCount.textContent = warningCount;
    }

    if (elements.suggestionCount) {
        elements.suggestionCount.textContent = suggestionCount;
    }
}

// 검증 요약 업데이트
function updateValidationSummary() {
    if (!elements.validationSummary) return;

    const { errors, warnings } = currentValidationResults;

    elements.validationSummary.classList.remove('has-errors', 'has-warnings', 'success');

    if (errors.length > 0) {
        elements.validationSummary.classList.add('has-errors');
        elements.validationSummary.textContent = errors.length + '개의 중요 오류가 발견되었습니다.';
    } else if (warnings.length > 0) {
        elements.validationSummary.classList.add('has-warnings');
        elements.validationSummary.textContent = warnings.length + '개의 주의사항이 있습니다.';
    } else {
        elements.validationSummary.classList.add('success');
        elements.validationSummary.textContent = '검증이 완료되었습니다. 오류가 발견되지 않았습니다.';
    }
}

// 탭 클릭 처리
function handleTabClick(e) {
    if (e.target.classList.contains('tab-btn')) {
        const tab = e.target.dataset.tab;

        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('tab-btn--active');
        });
        e.target.classList.add('tab-btn--active');

        showTabContent(tab);
    }
}

// 탭 내용 표시
function showTabContent(tab) {
    if (!elements.resultsContent) return;

    const { errors, warnings, suggestions } = currentValidationResults;
    let issues = [];

    switch (tab) {
        case 'all':
            issues = [...errors, ...warnings, ...suggestions];
            break;
        case 'errors':
            issues = errors;
            break;
        case 'warnings':
            issues = warnings;
            break;
        case 'suggestions':
            issues = suggestions;
            break;
    }

    if (issues.length === 0) {
        elements.resultsContent.innerHTML = 
            '<div class="results-placeholder">' +
                '<div class="placeholder-icon">✅</div>' +
                '<h3>문제가 없습니다</h3>' +
                '<p>이 범주에서 발견된 문제가 없습니다.</p>' +
            '</div>';
        return;
    }

    let html = '';
    issues.forEach(issue => {
        html += createIssueHTML(issue);
    });
    elements.resultsContent.innerHTML = html;
}

// 이슈 HTML 생성
function createIssueHTML(issue) {
    const severityClass = issue.type === 'error' ? 'error' : 'warning';
    const severityIcon = issue.type === 'error' ? '🔴' : '🟡';
    const severityText = issue.type === 'error' ? '오류' : '주의';

    return `
        <div class="validation-issue validation-issue--${severityClass}">
            <div class="issue-header">
                <h4 class="issue-title">${issue.title}</h4>
                <div class="issue-severity">
                    <span class="status status--${severityClass}">
                        ${severityIcon} ${severityText}
                    </span>
                </div>
            </div>
            <p class="issue-description">${issue.description}</p>
            ${issue.original && issue.suggestion && issue.original !== '현재 형식' && issue.original !== '없음' ? `
                <div class="issue-correction">
                    <span class="correction-wrong">${escapeHtml(issue.original)}</span>
                    <span class="correction-arrow">→</span>
                    <span class="correction-right">${escapeHtml(issue.suggestion)}</span>
                </div>
                <div class="issue-actions">
                    <button class="btn btn--primary btn--xs" onclick="applySingleCorrection('${issue.id}')">
                        적용
                    </button>
                </div>
            ` : ''}
        </div>
    `;
}

// 교정된 문서 미리보기 표시
function showCorrectedPreview() {
    if (!elements.correctedPreview || !elements.correctedDocument) return;

    elements.correctedDocument.textContent = currentValidationResults.correctedText;
    elements.correctedPreview.classList.remove('hidden');
}

// 문서 초기화
function clearDocument() {
    if (elements.documentInput) {
        elements.documentInput.value = '';
        updateCharCount();
    }

    resetValidationResults();
}

// 예시 문서 로드
function loadSampleDocument() {
    if (elements.documentInput) {
        elements.documentInput.value = sampleDocument;
        updateCharCount();
    }
}

// 검증 결과 초기화
function resetValidationResults() {
    if (elements.validationSummary) {
        elements.validationSummary.textContent = '검증을 시작하려면 좌측에 공문서를 입력하고 "검증 시작" 버튼을 클릭하세요.';
        elements.validationSummary.className = 'validation-summary';
    }

    if (elements.summaryStats) {
        elements.summaryStats.classList.add('hidden');
    }

    if (elements.resultsTabs) {
        elements.resultsTabs.classList.add('hidden');
    }

    if (elements.resultsContent) {
        elements.resultsContent.innerHTML = '';
    }

    if (elements.correctedPreview) {
        elements.correctedPreview.classList.add('hidden');
    }
}

// 클립보드에 복사
async function copyToClipboard() {
    try {
        await navigator.clipboard.writeText(currentValidationResults.correctedText);
        showMessage('교정된 문서가 클립보드에 복사되었습니다.', 'success');
    } catch (err) {
        console.error('복사 실패:', err);
        showMessage('복사에 실패했습니다.', 'error');
    }
}

// 문서 다운로드
function downloadDocument() {
    const blob = new Blob([currentValidationResults.correctedText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '교정된_공문서.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// 단일 수정 적용
function applySingleCorrection(issueId) {
    const issue = findIssueById(issueId);
    if (!issue || !elements.documentInput) return;

    let currentText = elements.documentInput.value;

    if (issue.original && issue.suggestion) {
        currentText = currentText.replace(issue.original, issue.suggestion);
    }

    elements.documentInput.value = currentText;
    showMessage('수정사항이 적용되었습니다.', 'success');
    updateCharCount();
}

// 유틸리티 함수들
function findIssueById(id) {
    const allIssues = [
        ...currentValidationResults.errors,
        ...currentValidationResults.warnings,
        ...currentValidationResults.suggestions
    ];
    return allIssues.find(issue => issue.id === id);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showMessage(message, type) {
    type = type || 'info';
    const toast = document.createElement('div');
    toast.className = 'status status--' + type;
    toast.textContent = message;
    toast.style.cssText = 'position:fixed;top:20px;right:20px;z-index:9999;min-width:300px;padding:12px;border-radius:4px;color:white;font-weight:bold;';

    if (type === 'success') {
        toast.style.backgroundColor = '#28a745';
    } else if (type === 'error') {
        toast.style.backgroundColor = '#dc3545';
    } else if (type === 'warning') {
        toast.style.backgroundColor = '#ffc107';
        toast.style.color = '#212529';
    } else {
        toast.style.backgroundColor = '#17a2b8';
    }

    document.body.appendChild(toast);

    setTimeout(() => {
        if (document.body.contains(toast)) {
            document.body.removeChild(toast);
        }
    }, 3000);
}

// DOM이 로드되면 초기화
document.addEventListener('DOMContentLoaded', init);
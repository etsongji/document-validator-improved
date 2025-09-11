// 공문서 검증 및 교정 프로그램 JavaScript - 완전히 수정된 버전

// 문서 유형 설정
let documentType = 'external';

// 검증 규칙
const validationRules = {
    dateFormat: {
        message: "날짜는 '2024. 8. 1.(목)' 형식으로 표기해야 합니다.",
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

// 숫자를 한글로 변환하는 함수
function numberToKorean(num) {
    const units = ['', '십', '백', '천', '만', '십만', '백만', '천만', '억'];
    const digits = ['', '일', '이', '삼', '사', '오', '육', '칠', '팔', '구'];

    if (num === 0) return '영';

    let result = '';

    if (num < 10) {
        return digits[num];
    } else if (num < 100) {
        let tens = Math.floor(num / 10);
        let ones = num % 10;
        result = (tens === 1 ? '십' : digits[tens] + '십');
        if (ones > 0) result += digits[ones];
        return result;
    } else if (num < 1000) {
        let hundreds = Math.floor(num / 100);
        let remainder = num % 100;
        result = digits[hundreds] + '백';
        if (remainder > 0) result += numberToKorean(remainder);
        return result;
    } else if (num < 10000) {
        let thousands = Math.floor(num / 1000);
        let remainder = num % 1000;
        result = digits[thousands] + '천';
        if (remainder > 0) result += numberToKorean(remainder);
        return result;
    } else if (num < 100000000) {
        let tenThousands = Math.floor(num / 10000);
        let remainder = num % 10000;
        result = numberToKorean(tenThousands) + '만';
        if (remainder > 0) result += numberToKorean(remainder);
        return result;
    }

    return '복잡한수';
}

// 맞춤법 및 띄어쓰기 오류 목록
const commonMistakes = [
    { wrong: "워크샵", correct: "워크숍", type: "spelling" },
    { wrong: "레크레이션", correct: "레크리에이션", type: "spelling" },
    { wrong: "리더쉽", correct: "리더십", type: "spelling" },
    { wrong: "윈도우", correct: "윈도", type: "spelling" },
    { wrong: "사료됨", correct: "생각함", type: "spelling" },
    { wrong: "목표 년도", correct: "목표 연도", type: "spelling" },
    { wrong: "몇일", correct: "며칠", type: "spelling" },
    { wrong: "몇 일", correct: "며칠", type: "spelling" },
    { wrong: "계획인 바", correct: "계획인바", type: "spacing" },
    { wrong: "요청한 바", correct: "요청한바", type: "spacing" },
    { wrong: "문서 입니다", correct: "문서입니다", type: "spacing" },
    { wrong: "요청 드립니다", correct: "요청드립니다", type: "spacing" },
    { wrong: "협조 바랍니다", correct: "협조바랍니다", type: "spacing" },
    { wrong: "재 교육", correct: "재교육", type: "spacing" },
    { wrong: "또 한", correct: "또한", type: "spacing" },
    { wrong: "계약시", correct: "계약 시", type: "spacing" },
    { wrong: "승인시", correct: "승인 시", type: "spacing" },
    { wrong: "승인후", correct: "승인 후", type: "spacing" },
    { wrong: "완료후", correct: "완료 후", type: "spacing" },
    { wrong: "기한내", correct: "기한 내", type: "spacing" },
    { wrong: "개시 할", correct: "개시할", type: "spacing" },
    { wrong: "진행 할", correct: "진행할", type: "spacing" },
    { wrong: "제 1조", correct: "제1조", type: "spacing" },
    { wrong: "제 2조", correct: "제2조", type: "spacing" },
    { wrong: "1 개", correct: "1개", type: "spacing" },
    { wrong: "2 개", correct: "2개", type: "spacing" },
    { wrong: "1 부", correct: "1부", type: "spacing" },
    { wrong: "2 부", correct: "2부", type: "spacing" },
    { wrong: "교육장님", correct: "교육장", type: "spelling" },
    { wrong: "교장님", correct: "교장", type: "spelling" }
];

// 예시 문서
const sampleDocument = `수신 ○○○기관장

제목 2024년도 업무협조 요청

1. 관련: 교육부-1234(2024. 11. 1.)

○○○○와 관련하여 다음과 같이 협조를 요청드리오니 검토 후 회신하여 주시기 바랍니다.

1. 협조사항

가. 관련 자료 제출

나. 담당자 지정

1) 업무 담당자

2) 연락처

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
    charCountElement.classList.remove('warning', 'error');

    if (count > maxCount * 0.9) {
        charCountElement.classList.add('warning');
    }

    if (count >= maxCount) {
        charCountElement.classList.add('error');
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
        { name: '문서 구조 및 항목 기호 검사', progress: 14, fn: () => checkDocumentStructure(text) },
        { name: '금액 표기법 검사', progress: 28, fn: () => checkMoneyFormat(text) },
        { name: '날짜/시간 표기법 검사', progress: 42, fn: () => checkDateTimeFormat(text) },
        { name: '붙임 및 관련 표기법 검사', progress: 56, fn: () => checkAttachmentFormat(text) },
        { name: '맞춤법 및 띄어쓰기 검사', progress: 70, fn: () => checkSpellingAndSpacing(text) },
        { name: '쌍점 및 문장부호 검사', progress: 84, fn: () => checkPunctuationFormat(text) },
        { name: '끝 표시법 검사', progress: 92, fn: () => checkEndingFormat(text) },
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

// 문서 구조 및 항목 기호 검사
function checkDocumentStructure(text) {
    const issues = [];

    // 항목 기호 뒤 띄어쓰기 검사
    const lines = text.split('\n');
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // 각 항목 기호 패턴 확인
        const patterns = [
            /^(\s*\d+\.)([^\s])/,  // 1.
            /^(\s*[가나다라마바사아자차카타파하]\.)([^\s])/,  // 가.
            /^(\s*\d+\))([^\s])/,  // 1)
            /^(\s*[가나다라마바사아자차카타파하]\))([^\s])/,  // 가)
            /^(\s*\(\d+\))([^\s])/,  // (1)
            /^(\s*\([가나다라마바사아자차카타파하]\))([^\s])/ // (가)
        ];

        for (const pattern of patterns) {
            const match = pattern.exec(line);
            if (match) {
                issues.push({
                    id: 'item-no-space-' + i,
                    type: 'error',
                    title: '항목 기호 띄어쓰기 오류',
                    description: '항목 기호 뒤에 한 칸 띄어써야 합니다.',
                    position: text.indexOf(line),
                    original: match[1],
                    suggestion: match[1] + ' ',
                    rule: '공문서 작성 편람 - 항목 표시법'
                });
            }
        }
    }

    currentValidationResults.errors.push(...issues.filter(i => i.type === 'error'));
    currentValidationResults.warnings.push(...issues.filter(i => i.type === 'warning'));
}

// 금액 표기법 검사
function checkMoneyFormat(text) {
    const issues = [];

    // 괄호 없는 금액
    const noBracketPattern = /(금|총)\d{1,3}(,\d{3})*원(?!\()/g;
    let match;
    while ((match = noBracketPattern.exec(text)) !== null) {
        const amount = match[0];
        const numStr = amount.replace(/[금총원,]/g, '');
        const num = parseInt(numStr);
        const koreanNum = numberToKorean(num);

        issues.push({
            id: 'money-no-bracket-' + match.index,
            type: 'error',
            title: '금액 표기법 오류',
            description: '금액 뒤에 괄호 안에 한글 표기가 필요합니다.',
            position: match.index,
            original: amount,
            suggestion: amount + '(금' + koreanNum + '원)',
            rule: '행정업무운영 편람 - 금액 표기법'
        });
    }

    currentValidationResults.errors.push(...issues.filter(i => i.type === 'error'));
    currentValidationResults.warnings.push(...issues.filter(i => i.type === 'warning'));
}

// 날짜/시간 표기법 검사
function checkDateTimeFormat(text) {
    const issues = [];

    // 잘못된 날짜 형식 검사
    const wrongDatePattern = /\d{4}년\s*\d{1,2}월\s*\d{1,2}일/g;
    let match;
    while ((match = wrongDatePattern.exec(text)) !== null) {
        const corrected = match[0].replace(/(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일/, '$1. $2. $3.');
        issues.push({
            id: 'date-format-error-' + match.index,
            type: 'error',
            title: '잘못된 날짜 표기법',
            description: '날짜는 온점(.)으로 구분하여 표기해야 합니다.',
            position: match.index,
            original: match[0],
            suggestion: corrected,
            rule: '공문서 작성 편람 - 날짜 표기법'
        });
    }

    currentValidationResults.errors.push(...issues.filter(i => i.type === 'error'));
    currentValidationResults.warnings.push(...issues.filter(i => i.type === 'warning'));
}

// 붙임 및 관련 표기법 검사 (수정된 로직)
function checkAttachmentFormat(text) {
    const issues = [];

    // 붙임 앞 띄어쓰기 검사 - 줄 시작에서만
    const lines = text.split('\n');
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // 줄이 공백으로 시작하고 붙임이 나오는 경우만 오류
        if (/^\s+붙임/.test(line)) {
            issues.push({
                id: 'attachment-space-' + i,
                type: 'error',
                title: '붙임 앞 띄어쓰기 오류',
                description: '붙임은 줄 시작에서 띄어쓰기 없이 시작해야 합니다.',
                position: text.indexOf(line),
                original: line.match(/^(\s+붙임)/)[0],
                suggestion: '붙임',
                rule: '공문서 작성 편람 - 붙임 표기법'
            });
        }

        // 붙임 뒤 띄어쓰기 검사 - 정확히 2칸
        const attachmentMatch = /^붙임(\s*)(.+)/.exec(line);
        if (attachmentMatch) {
            const spaces = attachmentMatch[1];
            const followingText = attachmentMatch[2];

            if (followingText && spaces.length !== 2) {
                issues.push({
                    id: 'attachment-after-space-' + i,
                    type: 'error',
                    title: '붙임 뒤 띄어쓰기 오류',
                    description: '붙임 뒤에 정확히 2칸 띄어써야 합니다.',
                    position: text.indexOf(line),
                    original: '붙임' + spaces,
                    suggestion: '붙임  ',
                    rule: '공문서 작성 편람 - 붙임 표기법'
                });
            }
        }
    }

    currentValidationResults.errors.push(...issues.filter(i => i.type === 'error'));
    currentValidationResults.warnings.push(...issues.filter(i => i.type === 'warning'));
}

// 맞춤법 및 띄어쓰기 검사
function checkSpellingAndSpacing(text) {
    const issues = [];

    commonMistakes.forEach((mistake, index) => {
        if (text.includes(mistake.wrong)) {
            let position = 0;
            let searchText = text;

            while (true) {
                const foundIndex = searchText.indexOf(mistake.wrong);
                if (foundIndex === -1) break;

                position += foundIndex;

                issues.push({
                    id: `mistake-${mistake.type}-${index}-${position}`,
                    type: mistake.type === 'spelling' ? 'error' : 'warning',
                    title: mistake.type === 'spelling' ? '맞춤법 오류' : '띄어쓰기 오류',
                    description: `"${mistake.wrong}"는 "${mistake.correct}"로 수정해야 합니다.`,
                    position: position,
                    original: mistake.wrong,
                    suggestion: mistake.correct,
                    rule: mistake.type === 'spelling' ? '한글 맞춤법 규정' : '한글 띄어쓰기 규정'
                });

                position += mistake.wrong.length;
                searchText = text.substring(position);
            }
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

// 쌍점 및 문장부호 검사
function checkPunctuationFormat(text) {
    const issues = [];

    // 쌍점 뒤 띄어쓰기 검사 (시간 표기 제외)
    const generalColonPattern = /:(?![0-9])/g;
    let match;
    while ((match = generalColonPattern.exec(text)) !== null) {
        const nextChar = text.charAt(match.index + 1);

        if (nextChar && nextChar !== ' ' && nextChar !== '\n' && nextChar !== '\t') {
            issues.push({
                id: 'colon-spacing-' + match.index,
                type: 'warning',
                title: '쌍점 띄어쓰기 오류',
                description: '쌍점(:) 뒤에 한 칸 띄어써야 합니다.',
                position: match.index,
                original: ':' + nextChar,
                suggestion: ': ' + nextChar,
                rule: '공문서 작성 편람 - 쌍점 표기법'
            });
        }
    }

    // 괄호 앞 불필요한 띄어쓰기
    const bracketSpacePattern = /\s+\(/g;
    let bracketMatch;
    while ((bracketMatch = bracketSpacePattern.exec(text)) !== null) {
        issues.push({
            id: 'bracket-space-' + bracketMatch.index,
            type: 'warning',
            title: '괄호 앞 띄어쓰기 오류',
            description: '괄호 앞에는 띄어쓰지 않습니다.',
            position: bracketMatch.index,
            original: bracketMatch[0] + '(',
            suggestion: '(',
            rule: '공문서 작성 편람'
        });
    }

    currentValidationResults.warnings.push(...issues);
}

// 끝 표시법 검사
function checkEndingFormat(text) {
    const issues = [];
    const trimmedText = text.trim();

    if (!trimmedText.includes('끝.')) {
        issues.push({
            id: 'ending-missing',
            type: 'error',
            title: '끝 표시법 누락',
            description: '본문 마지막에 "마침표 + 2칸 띄어쓰기 + 끝."을 표시해야 합니다.',
            position: text.length,
            original: '없음',
            suggestion: '.  끝.',
            rule: '공문서 작성 편람 - 끝 표시법'
        });
    } else if (!trimmedText.endsWith('.  끝.')) {
        issues.push({
            id: 'ending-format-wrong',
            type: 'error',
            title: '끝 표시법 오류',
            description: '올바른 형식: "마침표 + 2칸 띄어쓰기 + 끝." 순서로 표기해야 합니다.',
            position: trimmedText.lastIndexOf('끝.'),
            original: '현재 형식',
            suggestion: '.  끝.',
            rule: '공문서 작성 편람 - 끝 표시법'
        });
    }

    currentValidationResults.errors.push(...issues);
}

// 교정된 텍스트 생성
function generateCorrectedText() {
    let corrected = currentValidationResults.originalText;

    const allIssues = [
        ...currentValidationResults.errors,
        ...currentValidationResults.warnings
    ];

    allIssues.sort((a, b) => b.position - a.position);

    allIssues.forEach(issue => {
        if (issue.original && issue.suggestion && 
            issue.original !== '없음' && issue.original !== '현재 형식') {
            corrected = corrected.replace(issue.original, issue.suggestion);
        }
    });

    // 끝 표시법 처리
    if (!corrected.trim().endsWith('.  끝.')) {
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

    const { errors, warnings, suggestions } = currentValidationResults;
    const totalIssues = errors.length + warnings.length + suggestions.length;

    elements.validationSummary.classList.remove('has-errors', 'has-warnings', 'success');

    if (errors.length > 0) {
        elements.validationSummary.classList.add('has-errors');
        elements.validationSummary.textContent = `${errors.length}개의 중요 오류가 발견되었습니다. 수정이 필요합니다.`;
    } else if (warnings.length > 0) {
        elements.validationSummary.classList.add('has-warnings');
        elements.validationSummary.textContent = `${warnings.length}개의 주의사항이 있습니다. 검토해보세요.`;
    } else if (totalIssues === 0) {
        elements.validationSummary.classList.add('success');
        elements.validationSummary.textContent = '검증이 완료되었습니다. 오류가 발견되지 않았습니다.';
    } else {
        elements.validationSummary.textContent = `${suggestions.length}개의 개선 제안이 있습니다.`;
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
    const severityClass = getSeverityClass(issue.type);
    const severityIcon = getSeverityIcon(issue.type);
    const severityText = getSeverityText(issue.type);

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
            ${issue.original && issue.suggestion && issue.original !== '없음' && issue.original !== '현재 형식' ? `
                <div class="issue-correction">
                    <span class="correction-wrong">${escapeHtml(issue.original)}</span>
                    <span class="correction-arrow">→</span>
                    <span class="correction-right">${escapeHtml(issue.suggestion)}</span>
                </div>
            ` : ''}
            <div class="issue-actions">
                ${issue.suggestion && issue.original !== '없음' && issue.original !== '현재 형식' ? `
                    <button class="btn btn--primary btn--xs" onclick="applySingleCorrection('${issue.id}')">
                        적용
                    </button>
                ` : ''}
                <button class="btn btn--secondary btn--xs" onclick="showIssueDetails('${issue.id}')">
                    자세히
                </button>
            </div>
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
        elements.resultsContent.innerHTML = 
            '<div class="results-placeholder">' +
                '<div class="placeholder-icon">🔍</div>' +
                '<h3>검증 대기 중</h3>' +
                '<p>공문서를 입력하고 검증을 시작해주세요.</p>' +
            '</div>';
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

// 단일 수정 적용 (수정된 로직)
function applySingleCorrection(issueId) {
    const issue = findIssueById(issueId);
    if (!issue || !elements.documentInput) return;

    let currentText = elements.documentInput.value;

    // 끝 표시법 처리
    if (issue.id.includes('ending')) {
        // 기존 끝. 제거
        currentText = currentText.replace(/\.?\s*끝\.?\s*$/g, '');
        currentText = currentText.trim() + '.  끝.';
    }
    // 괄호 앞 띄어쓰기 처리
    else if (issue.id.includes('bracket-space')) {
        currentText = currentText.replace(/\s+\(/g, '(');
    }
    // 붙임 앞 띄어쓰기 처리
    else if (issue.id.includes('attachment-space')) {
        currentText = currentText.replace(/^(\s+)붙임/gm, '붙임');
    }
    // 일반적인 교정
    else if (issue.original && issue.suggestion) {
        currentText = currentText.replace(issue.original, issue.suggestion);
    }

    elements.documentInput.value = currentText;
    showMessage('수정사항이 적용되었습니다.', 'success');
    updateCharCount();
}

// 유틸리티 함수들
function getSeverityClass(type) {
    switch (type) {
        case 'error': return 'error';
        case 'warning': return 'warning';
        case 'suggestion': return 'info';
        default: return 'info';
    }
}

function getSeverityIcon(type) {
    switch (type) {
        case 'error': return '🔴';
        case 'warning': return '🟡';
        case 'suggestion': return '🔵';
        default: return '🔵';
    }
}

function getSeverityText(type) {
    switch (type) {
        case 'error': return '오류';
        case 'warning': return '주의';
        case 'suggestion': return '제안';
        default: return '정보';
    }
}

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
    toast.style.position = 'fixed';
    toast.style.top = '20px';
    toast.style.right = '20px';
    toast.style.zIndex = '9999';
    toast.style.minWidth = '300px';

    document.body.appendChild(toast);

    setTimeout(() => {
        if (document.body.contains(toast)) {
            document.body.removeChild(toast);
        }
    }, 3000);
}

function showIssueDetails(issueId) {
    const issue = findIssueById(issueId);
    if (!issue) return;

    alert('상세 정보:\n\n제목: ' + issue.title + '\n설명: ' + issue.description + '\n규정: ' + issue.rule);
}

// DOM이 로드되면 초기화
document.addEventListener('DOMContentLoaded', init);
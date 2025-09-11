// 공문서 검증 및 교정 프로그램 JavaScript

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
    }
};

// 맞춤법 및 띄어쓰기 오류 목록
const commonMistakes = [
    { wrong: "워크샵", correct: "워크숍", type: "spelling" },
    { wrong: "레크레이션", correct: "레크리에이션", type: "spelling" },
    { wrong: "리더쉽", correct: "리더십", type: "spelling" },
    { wrong: "윈도우", correct: "윈도", type: "spelling" },
    { wrong: "사료됨", correct: "생각함", type: "spelling" },
    { wrong: "목표 년도", correct: "목표 연도", type: "spelling" },
    { wrong: "동 건은", correct: "이 건은", type: "spelling" },
    { wrong: "익일", correct: "다음날", type: "spelling" },
    { wrong: "몇일", correct: "며칠", type: "spacing" },
    { wrong: "제작년", correct: "재작년", type: "spelling" },
    { wrong: "계획인 바", correct: "계획인바", type: "spacing" },
    { wrong: "문서 입니다", correct: "문서입니다", type: "spacing" },
    { wrong: "또 한", correct: "또한", type: "spacing" },
    { wrong: "계약시", correct: "계약 시", type: "spacing" },
    { wrong: "승인후", correct: "승인 후", type: "spacing" },
    { wrong: "기한내", correct: "기한 내", type: "spacing" },
    { wrong: "개시 할", correct: "개시할", type: "spacing" }
];

// 용어 순화 제안
const terminologyRefinement = [
    { difficult: "시행", easy: "실시" },
    { difficult: "제출", easy: "내기" },
    { difficult: "검토", easy: "살펴보기" },
    { difficult: "협조", easy: "도움" },
    { difficult: "승인", easy: "허가" },
    { difficult: "통보", easy: "알림" },
    { difficult: "이행", easy: "실행" },
    { difficult: "준수", easy: "지키기" },
    { difficult: "활용", easy: "이용" }
];

// 예시 문서
const sampleDocument = `수신 ○○○기관장

제목 2024년도 업무협조 요청

○○○○와 관련하여 다음과 같이 협조를 요청드리오니 검토 후 회신하여 주시기 바랍니다.

1. 협조사항

가. 관련 자료 제출

나. 담당자 지정

2. 협조기한: 2024. 12. 31.(화)까지

붙임 관련 서류 1부. 끝.`;

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

    // DOM 요소들 가져오기
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
    // 문서 유형 변경
    if (elements.documentType) {
        elements.documentType.addEventListener('change', function(e) {
            documentType = e.target.value;
            console.log('Document type changed to:', documentType);
        });
    }

    // 문서 입력
    if (elements.documentInput) {
        elements.documentInput.addEventListener('input', updateCharCount);
    }

    // 버튼 이벤트들
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

    // 탭 클릭
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

    // 글자수에 따른 스타일 변경
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

    // UI 상태 변경
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
        // UI 상태 복원
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
    // 결과 초기화
    currentValidationResults = {
        errors: [],
        warnings: [],
        suggestions: [],
        originalText: text,
        correctedText: text
    };

    const steps = [
        { name: '문서 구조 분석', progress: 15, fn: () => checkDocumentStructure(text) },
        { name: '날짜/시간 표기법 검사', progress: 30, fn: () => checkDateTimeFormat(text) },
        { name: '맞춤법 및 띄어쓰기 검사', progress: 50, fn: () => checkSpellingAndSpacing(text) },
        { name: '끝 표시법 검사', progress: 70, fn: () => checkEndingFormat(text) },
        { name: '용어 순화 검사', progress: 85, fn: () => checkTerminology(text) },
        { name: '종합 검토', progress: 100, fn: () => generateCorrectedText() }
    ];

    for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        updateProgress(step.progress, step.name);

        step.fn();

        // 진행 시뮬레이션
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

// 문서 구조 검사
function checkDocumentStructure(text) {
    const issues = [];

    // 항목 기호 검사
    const itemPattern = /\d+\)/g;
    let match;
    while ((match = itemPattern.exec(text)) !== null) {
        issues.push({
            id: 'item-symbol-' + match.index,
            type: 'warning',
            title: '잘못된 항목 기호',
            description: '항목 기호는 1. → 가. → 1) → 가) 순서로 사용해야 합니다.',
            position: match.index,
            original: match[0],
            suggestion: match[0].replace(')', '.'),
            rule: '공문서 작성 편람'
        });
    }

    currentValidationResults.warnings.push(...issues);
}

// 날짜/시간 표기법 검사
function checkDateTimeFormat(text) {
    const issues = [];

    // 년월일 형식 검사
    if (text.includes('년') && text.includes('월') && text.includes('일')) {
        issues.push({
            id: 'date-format-error',
            type: 'error',
            title: '잘못된 날짜 표기법',
            description: '날짜는 온점(.)으로 구분하여 표기해야 합니다.',
            position: 0,
            original: '년월일 표기',
            suggestion: '2024. 8. 1.(목) 형식',
            rule: '공문서 작성 편람 - 날짜 표기법'
        });
    }

    // 하이픈 날짜 형식 검사
    if (text.includes('-') && /\d{4}-\d{1,2}-\d{1,2}/.test(text)) {
        issues.push({
            id: 'hyphen-date-error',
            type: 'error',
            title: '잘못된 날짜 표기법',
            description: '날짜는 하이픈(-) 대신 온점(.)으로 구분해야 합니다.',
            position: 0,
            original: '하이픈 날짜',
            suggestion: '온점 날짜',
            rule: '공문서 작성 편람'
        });
    }

    // 시간 형식 검사
    if (text.includes('시') || text.includes('분')) {
        issues.push({
            id: 'time-format-error',
            type: 'error',
            title: '잘못된 시간 표기법',
            description: '24시각제를 사용하여 00:00 형식으로 표기해야 합니다.',
            position: 0,
            original: '시분 표기',
            suggestion: '14:30 형식',
            rule: '공문서 작성 편람'
        });
    }

    currentValidationResults.errors.push(...issues);
}

// 맞춤법 및 띄어쓰기 검사
function checkSpellingAndSpacing(text) {
    const issues = [];

    commonMistakes.forEach((mistake, index) => {
        if (text.includes(mistake.wrong)) {
            issues.push({
                id: 'mistake-' + index,
                type: mistake.type === 'spelling' ? 'error' : 'warning',
                title: mistake.type === 'spelling' ? '맞춤법 오류' : '띄어쓰기 오류',
                description: `"${mistake.wrong}"는 "${mistake.correct}"로 수정해야 합니다.`,
                position: text.indexOf(mistake.wrong),
                original: mistake.wrong,
                suggestion: mistake.correct,
                rule: '한글 맞춤법 규정'
            });
        }
    });

    // 에러와 경고 분류
    issues.forEach(issue => {
        if (issue.type === 'error') {
            currentValidationResults.errors.push(issue);
        } else {
            currentValidationResults.warnings.push(issue);
        }
    });
}

// 끝 표시법 검사
function checkEndingFormat(text) {
    const issues = [];

    if (!text.trim().endsWith('끝.')) {
        issues.push({
            id: 'ending-missing',
            type: 'error',
            title: '끝 표시법 오류',
            description: '본문 마지막에 "끝."을 표시해야 합니다.',
            position: text.length,
            original: '없음',
            suggestion: ' 끝.',
            rule: '공문서 작성 편람'
        });
    }

    currentValidationResults.errors.push(...issues);
}

// 용어 순화 검사
function checkTerminology(text) {
    const suggestions = [];

    terminologyRefinement.forEach((term, index) => {
        if (text.includes(term.difficult)) {
            suggestions.push({
                id: 'terminology-' + index,
                type: 'suggestion',
                title: '용어 순화 제안',
                description: `"${term.difficult}"을 "${term.easy}"로 바꾸면 더 쉽게 이해할 수 있습니다.`,
                position: text.indexOf(term.difficult),
                original: term.difficult,
                suggestion: term.easy,
                rule: '쉬운 공문서 작성 가이드'
            });
        }
    });

    currentValidationResults.suggestions.push(...suggestions);
}

// 교정된 텍스트 생성
function generateCorrectedText() {
    let corrected = currentValidationResults.originalText;

    // 모든 오류와 경고를 교정
    const allIssues = [
        ...currentValidationResults.errors,
        ...currentValidationResults.warnings
    ];

    // 간단한 교정 적용
    allIssues.forEach(issue => {
        if (issue.original && issue.suggestion && issue.original !== '없음') {
            corrected = corrected.replaceAll(issue.original, issue.suggestion);
        }
    });

    // 끝 표시 추가
    if (!corrected.trim().endsWith('끝.')) {
        corrected = corrected.trim() + ' 끝.';
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

        // 탭 활성화 상태 변경
        document.querySelectorAll('.tab-btn').forEach(function(btn) {
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
    issues.forEach(function(issue) {
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
            ${issue.original && issue.suggestion ? `
                <div class="issue-correction">
                    <span class="correction-wrong">${escapeHtml(issue.original)}</span>
                    <span class="correction-arrow">→</span>
                    <span class="correction-right">${escapeHtml(issue.suggestion)}</span>
                </div>
            ` : ''}
            <div class="issue-actions">
                ${issue.suggestion ? `
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
        elements.validationSummary.textContent = '검증을 시작하려면 좌측에 공문서를 입력하고 \'검증 시작\' 버튼을 클릭하세요.';
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

// 단일 수정 적용
function applySingleCorrection(issueId) {
    const issue = findIssueById(issueId);
    if (!issue || !elements.documentInput) return;

    let currentText = elements.documentInput.value;
    currentText = currentText.replace(issue.original, issue.suggestion);
    elements.documentInput.value = currentText;

    showMessage(`"${issue.original}"을 "${issue.suggestion}"로 수정했습니다.`, 'success');
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
    return allIssues.find(function(issue) {
        return issue.id === id;
    });
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

    setTimeout(function() {
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
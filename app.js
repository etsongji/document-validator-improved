// 공문서 검증 및 교정 프로그램 JavaScript

// 검증 데이터 및 규칙
const validationRules = {
    dateFormat: {
        correct: [/\d{4}\. \d{1,2}\. \d{1,2}\./g],
        incorrect: [/\d{4}년 \d{1,2}월 \d{1,2}일/g, /\d{4}-\d{1,2}-\d{1,2}/g, /\d{4}\/\d{1,2}\/\d{1,2}/g],
        message: "날짜는 '2024. 1. 1.' 형식으로 표기해야 합니다.",
        severity: "error"
    },
    timeFormat: {
        correct: [/\d{1,2}:\d{2}/g],
        incorrect: [/오전 \d{1,2}시 \d{1,2}분/g, /오후 \d{1,2}시 \d{1,2}분/g, /\d{1,2}시 \d{1,2}분/g],
        message: "시간은 24시각제로 '15:30' 형식으로 표기해야 합니다.",
        severity: "error"
    }
};

// 끝 표시법 규칙들
const endingRules = [
    {
        type: "no_spacing",
        pattern: /\.끝\.$/,
        correct: ".  끝.",
        message: "마침표 다음에 2칸 띄어쓰기가 필요합니다."
    },
    {
        type: "single_space", 
        pattern: /\. 끝\.$/,
        correct: ".  끝.",
        message: "마침표 다음에 2칸 띄어쓰기가 필요합니다."
    },
    {
        type: "multiple_spaces",
        pattern: /\.   끝\.$/,
        correct: ".  끝.",
        message: "마침표 다음에 정확히 2칸 띄어쓰기가 필요합니다."
    },
    {
        type: "no_period_after_end",
        pattern: /\.  끝$/,
        correct: ".  끝.",
        message: "'끝' 뒤에 마침표가 필요합니다."
    }
];

const commonMistakes = [
    { wrong: "그 동안", correct: "그동안", type: "spacing" },
    { wrong: "첫 해", correct: "첫해", type: "spacing" },
    { wrong: "이 날", correct: "이날", type: "spacing" },
    { wrong: "더욱 더", correct: "더욱더", type: "spacing" },
    { wrong: "두가지", correct: "두 가지", type: "spacing" },
    { wrong: "안됩니다", correct: "안 됩니다", type: "spacing" },
    { wrong: "50%이상", correct: "50% 이상", type: "spacing" },
    { wrong: "변동없음", correct: "변동 없음", type: "spacing" },
    { wrong: "사용중인", correct: "사용 중인", type: "spacing" },
    { wrong: "참여시", correct: "참여 시", type: "spacing" }
];

const terminologyRefinement = [
    { difficult: "시행", easy: "실시" },
    { difficult: "제출", easy: "내기" },
    { difficult: "검토", easy: "살펴보기" },
    { difficult: "협조", easy: "도움" },
    { difficult: "승인", easy: "허가" },
    { difficult: "통보", easy: "알림" },
    { difficult: "이행", easy: "실행" },
    { difficult: "준수", easy: "지키기" }
];

const sampleDocument = `수신  ○○○기관장

제목  2024년도 업무협조 요청

○○○○와 관련하여 다음과 같이 협조를 요청드리오니 검토 후 회신하여 주시기 바랍니다.

1. 협조사항
  가. 관련 자료 제출
  나. 담당자 지정

2. 협조기한: 2024. 12. 31.까지

붙임  관련 서류 1부.  끝.`;

const errorDocument = `수신 ○○○기관장

제목 2024년도업무협조요청

○○○○와관련하여 다음과같이 협조를요청드리오니 검토후 회신하여주시기바랍니다.

1)협조사항
가)관련자료제출
나)담당자지정

2)협조기한:2024년12월31일까지

붙임:관련서류1부. 끝.`;

// 전역 상태
let currentValidationResults = {
    errors: [],
    warnings: [],
    suggestions: [],
    originalText: '',
    correctedText: ''
};

let selectedCorrections = new Set();

// DOM 요소 참조
let elements = {};

// 초기화
function init() {
    console.log('Initializing validation app...');
    
    elements = {
        documentInput: document.getElementById('documentInput'),
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
        
        // 모달 요소들
        correctionModal: document.getElementById('correctionModal'),
        batchCorrectionModal: document.getElementById('batchCorrectionModal'),
        correctionPreview: document.getElementById('correctionPreview'),
        batchPreview: document.getElementById('batchPreview'),
        selectedCount: document.getElementById('selectedCount'),
        
        // 모달 버튼들
        applyCorrectionBtn: document.getElementById('applyCorrectionBtn'),
        cancelCorrectionBtn: document.getElementById('cancelCorrectionBtn'),
        applyBatchBtn: document.getElementById('applyBatchBtn'),
        cancelBatchBtn: document.getElementById('cancelBatchBtn'),
        modalCloses: document.querySelectorAll('.modal-close')
    };
    
    setupEventListeners();
    updateCharCount();
    console.log('App initialized successfully');
}

// 이벤트 리스너 설정
function setupEventListeners() {
    // 문서 입력 이벤트
    if (elements.documentInput) {
        elements.documentInput.addEventListener('input', updateCharCount);
    }
    
    // 버튼 이벤트
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
    
    // 탭 버튼 이벤트
    if (elements.resultsTabs) {
        elements.resultsTabs.addEventListener('click', handleTabClick);
    }
    
    // 모달 이벤트
    if (elements.modalCloses) {
        elements.modalCloses.forEach(btn => {
            btn.addEventListener('click', closeModals);
        });
    }
    
    if (elements.applyCorrectionBtn) {
        elements.applyCorrectionBtn.addEventListener('click', applySingleCorrection);
    }
    if (elements.cancelCorrectionBtn) {
        elements.cancelCorrectionBtn.addEventListener('click', closeModals);
    }
    if (elements.applyBatchBtn) {
        elements.applyBatchBtn.addEventListener('click', applyBatchCorrections);
    }
    if (elements.cancelBatchBtn) {
        elements.cancelBatchBtn.addEventListener('click', closeModals);
    }
    
    // 키보드 단축키
    document.addEventListener('keydown', handleKeydown);
    
    // 모달 배경 클릭으로 닫기
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            closeModals();
        }
    });
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
        // 검증 실행
        await performValidation(text);
        
        // 결과 표시
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
        
        // 실제 검증 수행
        step.fn();
        
        // 시뮬레이션 지연
        await new Promise(resolve => setTimeout(resolve, 150));
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
    
    // 수신자 정보 확인
    if (!text.includes('수신')) {
        issues.push({
            id: 'missing-recipient',
            type: 'error',
            title: '수신자 정보 누락',
            description: '공문서에는 반드시 수신자 정보가 포함되어야 합니다.',
            position: 0,
            original: '',
            suggestion: '수신  ○○○기관장',
            rule: '공문서 작성 규정 제4조'
        });
    }
    
    // 제목 확인
    if (!text.includes('제목')) {
        issues.push({
            id: 'missing-title',
            type: 'error',
            title: '제목 누락',
            description: '공문서에는 명확한 제목이 필요합니다.',
            position: 0,
            original: '',
            suggestion: '제목  ○○○○에 관한 건',
            rule: '공문서 작성 규정 제5조'
        });
    }
    
    // 항목 기호 검사
    const itemSymbolPattern = /\d+\)/g;
    const matches = Array.from(text.matchAll(itemSymbolPattern));
    
    matches.forEach((match, index) => {
        issues.push({
            id: 'wrong-item-symbol-' + index,
            type: 'warning',
            title: '잘못된 항목 기호',
            description: '항목 기호는 1. → 가. → 1) 순서로 사용해야 합니다.',
            position: match.index,
            original: match[0],
            suggestion: match[0].replace(')', '.'),
            rule: '공문서 작성 규정 제12조'
        });
    });
    
    currentValidationResults.errors.push(...issues.filter(i => i.type === 'error'));
    currentValidationResults.warnings.push(...issues.filter(i => i.type === 'warning'));
}

// 날짜/시간 표기법 검사
function checkDateTimeFormat(text) {
    const issues = [];
    
    // 잘못된 날짜 형식 검사
    const wrongDatePattern = /\d{4}년 \d{1,2}월 \d{1,2}일/g;
    const dateMatches = Array.from(text.matchAll(wrongDatePattern));
    
    dateMatches.forEach((match, index) => {
        const corrected = match[0].replace(/(\d{4})년 (\d{1,2})월 (\d{1,2})일/, '$1. $2. $3.');
        issues.push({
            id: 'wrong-date-' + index,
            type: 'error',
            title: '잘못된 날짜 표기법',
            description: '날짜는 온점(.)으로 구분하여 표기해야 합니다.',
            position: match.index,
            original: match[0],
            suggestion: corrected,
            rule: '공문서 작성 규정 제8조'
        });
    });
    
    currentValidationResults.errors.push(...issues);
}

// 맞춤법 및 띄어쓰기 검사
function checkSpellingAndSpacing(text) {
    const issues = [];
    
    commonMistakes.forEach((mistake, index) => {
        const regex = new RegExp(mistake.wrong.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
        const matches = Array.from(text.matchAll(regex));
        
        matches.forEach((match, matchIndex) => {
            issues.push({
                id: 'spelling-' + index + '-' + matchIndex,
                type: mistake.type === 'redundancy' ? 'warning' : 'error',
                title: mistake.type === 'redundancy' ? '중복 표현' : '띄어쓰기 오류',
                description: `"${mistake.wrong}"는 "${mistake.correct}"로 수정해야 합니다.`,
                position: match.index,
                original: mistake.wrong,
                suggestion: mistake.correct,
                rule: '한글 맞춤법 규정'
            });
        });
    });
    
    // 쌍점 띄어쓰기 검사
    const colonPattern = /(\w)\s*:\s*(\w)/g;
    const colonMatches = Array.from(text.matchAll(colonPattern));
    
    colonMatches.forEach((match, index) => {
        if (!match[0].includes(': ')) {
            issues.push({
                id: 'colon-spacing-' + index,
                type: 'warning',
                title: '쌍점 띄어쓰기 오류',
                description: '쌍점 앞은 붙이고 뒤는 한 칸 띄어쓰기해야 합니다.',
                position: match.index,
                original: match[0],
                suggestion: match[0].replace(/(\w)\s*:\s*(\w)/, '$1: $2'),
                rule: '공문서 작성 규정 제10조'
            });
        }
    });
    
    currentValidationResults.errors.push(...issues.filter(i => i.type === 'error'));
    currentValidationResults.warnings.push(...issues.filter(i => i.type === 'warning'));
}

// 끝 표시법 검사 (가장 중요한 새 기능)
function checkEndingFormat(text) {
    const issues = [];
    
    // 문서 마지막에 "끝." 표시가 있는지 확인
    const hasEnding = /끝\.$/.test(text);
    
    if (!hasEnding) {
        // "끝" 표시가 아예 없는 경우
        issues.push({
            id: 'missing-ending',
            type: 'error',
            title: '끝 표시 누락',
            description: '공문서 마지막에 "끝." 표시가 누락되었습니다.',
            position: text.length - 10,
            original: text.slice(-10),
            suggestion: text.slice(-10) + '  끝.',
            rule: '행정업무의 효율적 운영에 관한 규정 시행규칙 제4조제5항'
        });
    } else {
        // "끝" 표시는 있지만 형식이 잘못된 경우들을 검사
        endingRules.forEach((rule, index) => {
            if (rule.pattern.test(text)) {
                const match = text.match(rule.pattern);
                if (match) {
                    issues.push({
                        id: 'ending-format-' + index,
                        type: 'warning',
                        title: '끝 표시법 오류',
                        description: rule.message,
                        position: text.lastIndexOf(match[0]),
                        original: match[0],
                        suggestion: rule.correct,
                        rule: '행정업무의 효율적 운영에 관한 규정 시행규칙 제4조제5항'
                    });
                }
            }
        });
        
        // 붙임이 있는 경우의 특별 검사
        const attachmentEndingPattern = /붙임[^\.]*\.\s*끝\./;
        if (attachmentEndingPattern.test(text)) {
            const beforeEndPattern = /붙임[^\.]*\.\s*끝\.$/;
            if (beforeEndPattern.test(text)) {
                const match = text.match(/붙임[^\.]*\.\s*(끝\.)$/);
                if (match && !text.match(/붙임[^\.]*\.\s\s끝\.$/)) {
                    issues.push({
                        id: 'attachment-ending-spacing',
                        type: 'warning',
                        title: '붙임 후 끝 표시법 오류',
                        description: '붙임 표시문 다음에 2타 띄우고 "끝" 표시해야 합니다.',
                        position: text.lastIndexOf(match[1]) - 5,
                        original: match[0],
                        suggestion: match[0].replace(/\.\s*끝\./, '.  끝.'),
                        rule: '행정업무의 효율적 운영에 관한 규정 시행규칙 제4조제5항'
                    });
                }
            }
        }
    }
    
    currentValidationResults.errors.push(...issues.filter(i => i.type === 'error'));
    currentValidationResults.warnings.push(...issues.filter(i => i.type === 'warning'));
}

// 용어 순화 검사
function checkTerminology(text) {
    const issues = [];
    
    terminologyRefinement.forEach((term, termIndex) => {
        const regex = new RegExp(term.difficult, 'g');
        const matches = Array.from(text.matchAll(regex));
        
        matches.forEach((match, matchIndex) => {
            issues.push({
                id: 'terminology-' + termIndex + '-' + matchIndex,
                type: 'info',
                title: '용어 순화 제안',
                description: `"${term.difficult}"를 더 쉬운 우리말 "${term.easy}"로 바꾸는 것을 권장합니다.`,
                position: match.index,
                original: term.difficult,
                suggestion: term.easy,
                rule: '쉬운 공문서 작성 지침'
            });
        });
    });
    
    currentValidationResults.suggestions.push(...issues);
}

// 교정된 텍스트 생성
function generateCorrectedText() {
    let correctedText = currentValidationResults.originalText;
    
    // 모든 수정사항을 적용 (위치 역순으로 정렬하여 인덱스 변경 문제 방지)
    const allIssues = [
        ...currentValidationResults.errors,
        ...currentValidationResults.warnings,
        ...currentValidationResults.suggestions
    ].sort((a, b) => b.position - a.position);
    
    allIssues.forEach(issue => {
        if (issue.original && issue.suggestion && issue.original !== issue.suggestion) {
            // 끝 표시 관련 특별 처리
            if (issue.id === 'missing-ending') {
                if (!correctedText.endsWith('.  끝.')) {
                    if (correctedText.endsWith('.')) {
                        correctedText = correctedText.replace(/\.$/, '.  끝.');
                    } else {
                        correctedText += '.  끝.';
                    }
                }
            } else {
                const regex = new RegExp(issue.original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
                correctedText = correctedText.replace(regex, issue.suggestion);
            }
        }
    });
    
    currentValidationResults.correctedText = correctedText;
}

// 검증 결과 표시
function displayValidationResults() {
    const totalErrors = currentValidationResults.errors.length;
    const totalWarnings = currentValidationResults.warnings.length;
    const totalSuggestions = currentValidationResults.suggestions.length;
    const totalIssues = totalErrors + totalWarnings + totalSuggestions;
    
    console.log('Displaying validation results:', {
        errors: totalErrors,
        warnings: totalWarnings,
        suggestions: totalSuggestions,
        total: totalIssues
    });
    
    // 요약 업데이트
    updateValidationSummary(totalErrors, totalWarnings, totalSuggestions, totalIssues);
    
    // 탭 개수 업데이트
    updateTabCounts(totalErrors, totalWarnings, totalSuggestions);
    
    // 기본 탭 표시
    showTab('overview');
    
    // 교정된 문서 미리보기 표시
    if (totalIssues > 0 && elements.correctedPreview && elements.correctedDocument) {
        elements.correctedPreview.classList.remove('hidden');
        elements.correctedDocument.textContent = currentValidationResults.correctedText;
    }
    
    selectedCorrections.clear();
}

// 검증 요약 업데이트
function updateValidationSummary(errors, warnings, suggestions, total) {
    if (!elements.validationSummary) return;
    
    const summaryElement = elements.validationSummary;
    summaryElement.classList.remove('has-errors', 'has-warnings', 'success');
    
    if (total === 0) {
        summaryElement.textContent = '🎉 완벽합니다! 발견된 오류가 없습니다.';
        summaryElement.classList.add('success');
    } else {
        let message = `총 ${total}개의 검토 사항이 발견되었습니다.`;
        if (errors > 0) {
            message += ` 중요 오류 ${errors}개`;
            summaryElement.classList.add('has-errors');
        }
        if (warnings > 0) {
            message += ` 주의 사항 ${warnings}개`;
            if (!summaryElement.classList.contains('has-errors')) {
                summaryElement.classList.add('has-warnings');
            }
        }
        if (suggestions > 0) {
            message += ` 제안 사항 ${suggestions}개`;
        }
        summaryElement.textContent = message;
    }
}

// 탭 개수 업데이트
function updateTabCounts(errors, warnings, suggestions) {
    if (!elements.resultsTabs) return;
    
    const tabs = elements.resultsTabs.querySelectorAll('.tab-btn');
    if (tabs.length >= 4) {
        tabs[1].textContent = `🔴 중요 오류 (${errors})`;
        tabs[2].textContent = `🟡 주의 사항 (${warnings})`;
        tabs[3].textContent = `🔵 제안 사항 (${suggestions})`;
    }
}

// 탭 클릭 처리
function handleTabClick(e) {
    if (!e.target.classList.contains('tab-btn')) return;
    
    const tabName = e.target.dataset.tab;
    showTab(tabName);
    
    // 탭 활성화 상태 업데이트
    if (elements.resultsTabs) {
        elements.resultsTabs.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('tab-btn--active');
        });
    }
    e.target.classList.add('tab-btn--active');
}

// 탭 내용 표시
function showTab(tabName) {
    if (!elements.resultsContent) return;
    
    const contentElement = elements.resultsContent;
    
    switch (tabName) {
        case 'overview':
            contentElement.innerHTML = generateOverviewContent();
            break;
        case 'errors':
            contentElement.innerHTML = generateIssuesContent(currentValidationResults.errors, '중요 오류');
            break;
        case 'warnings':
            contentElement.innerHTML = generateIssuesContent(currentValidationResults.warnings, '주의 사항');
            break;
        case 'suggestions':
            contentElement.innerHTML = generateIssuesContent(currentValidationResults.suggestions, '제안 사항');
            break;
    }
    
    // 이벤트 리스너 다시 설정
    setupIssueEventListeners();
}

// 전체 요약 내용 생성
function generateOverviewContent() {
    const totalErrors = currentValidationResults.errors.length;
    const totalWarnings = currentValidationResults.warnings.length;
    const totalSuggestions = currentValidationResults.suggestions.length;
    
    if (totalErrors + totalWarnings + totalSuggestions === 0) {
        return `
            <div class="results-placeholder">
                <div class="placeholder-icon">🎉</div>
                <h3>완벽한 공문서입니다!</h3>
                <p>검증 결과 모든 항목이 공문서 작성 규정에 적합합니다.</p>
            </div>
        `;
    }
    
    return `
        <div class="summary-stats">
            <div class="stat-item">
                <div class="stat-number error">${totalErrors}</div>
                <div class="stat-label">중요 오류</div>
            </div>
            <div class="stat-item">
                <div class="stat-number warning">${totalWarnings}</div>
                <div class="stat-label">주의 사항</div>
            </div>
            <div class="stat-item">
                <div class="stat-number info">${totalSuggestions}</div>
                <div class="stat-label">제안 사항</div>
            </div>
        </div>
        
        ${totalErrors + totalWarnings + totalSuggestions > 0 ? `
        <div class="batch-actions">
            <div class="batch-selection">
                <input type="checkbox" id="selectAll" />
                <label for="selectAll">모든 수정사항 선택</label>
            </div>
            <button class="btn btn--primary" id="applyBatchCorrections">
                일괄 수정 적용
            </button>
        </div>
        ` : ''}
        
        <div class="overview-preview">
            <h4>주요 검토 사항</h4>
            ${generateTopIssues()}
        </div>
    `;
}

// 주요 이슈 목록 생성
function generateTopIssues() {
    const allIssues = [
        ...currentValidationResults.errors.slice(0, 3),
        ...currentValidationResults.warnings.slice(0, 2)
    ];
    
    if (allIssues.length === 0) return '<p>검토 사항이 없습니다.</p>';
    
    return allIssues.map(issue => `
        <div class="validation-issue validation-issue--${issue.type}">
            <div class="issue-header">
                <h4 class="issue-title">${issue.title}</h4>
                <div class="issue-severity">
                    ${getSeverityIcon(issue.type)} ${getSeverityLabel(issue.type)}
                </div>
            </div>
            <p class="issue-description">${issue.description}</p>
            ${issue.original && issue.suggestion && issue.original !== issue.suggestion ? `
            <div class="issue-correction">
                <span class="correction-wrong">${escapeHtml(issue.original)}</span>
                <span class="correction-arrow">→</span>
                <span class="correction-right">${escapeHtml(issue.suggestion)}</span>
            </div>
            ` : ''}
        </div>
    `).join('');
}

// 이슈 목록 내용 생성
function generateIssuesContent(issues, title) {
    if (issues.length === 0) {
        return `
            <div class="results-placeholder">
                <div class="placeholder-icon">✅</div>
                <h3>${title}가 없습니다</h3>
                <p>이 항목에서는 문제가 발견되지 않았습니다.</p>
            </div>
        `;
    }
    
    return `
        <div class="batch-actions">
            <div class="batch-selection">
                <input type="checkbox" id="selectAll${title}" />
                <label for="selectAll${title}">모든 ${title} 선택</label>
            </div>
            <button class="btn btn--primary" id="applySelected${title}">
                선택 항목 적용
            </button>
        </div>
        
        ${issues.map(issue => `
            <div class="validation-issue validation-issue--${issue.type}">
                <div class="issue-header">
                    <div class="checkbox-wrapper">
                        <input type="checkbox" id="issue-${issue.id}" data-issue-id="${issue.id}" />
                        <h4 class="issue-title">${issue.title}</h4>
                    </div>
                    <div class="issue-severity">
                        ${getSeverityIcon(issue.type)} ${getSeverityLabel(issue.type)}
                    </div>
                </div>
                <p class="issue-description">${issue.description}</p>
                ${issue.original && issue.suggestion && issue.original !== issue.suggestion ? `
                <div class="issue-correction">
                    <span class="correction-wrong">${escapeHtml(issue.original)}</span>
                    <span class="correction-arrow">→</span>
                    <span class="correction-right">${escapeHtml(issue.suggestion)}</span>
                </div>
                ` : ''}
                <div class="issue-actions">
                    <button class="btn btn--primary btn--xs apply-single" data-issue-id="${issue.id}">
                        적용
                    </button>
                    <button class="btn btn--outline btn--xs ignore-issue" data-issue-id="${issue.id}">
                        무시
                    </button>
                </div>
                ${issue.rule ? `<small style="color: var(--color-text-secondary);">근거: ${issue.rule}</small>` : ''}
            </div>
        `).join('')}
    `;
}

// HTML 이스케이프 함수
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 심각도 아이콘 반환
function getSeverityIcon(type) {
    switch (type) {
        case 'error': return '🔴';
        case 'warning': return '🟡';
        case 'info': return '🔵';
        default: return '⚪';
    }
}

// 심각도 라벨 반환
function getSeverityLabel(type) {
    switch (type) {
        case 'error': return '중요 오류';
        case 'warning': return '주의 사항';
        case 'info': return '제안 사항';
        default: return '기타';
    }
}

// 이슈 이벤트 리스너 설정
function setupIssueEventListeners() {
    // 개별 적용 버튼
    document.querySelectorAll('.apply-single').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const issueId = e.target.dataset.issueId;
            applySingleCorrectionById(issueId);
        });
    });
    
    // 무시 버튼
    document.querySelectorAll('.ignore-issue').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const issueId = e.target.dataset.issueId;
            ignoreIssue(issueId);
        });
    });
    
    // 체크박스 이벤트
    document.querySelectorAll('input[type="checkbox"][data-issue-id]').forEach(checkbox => {
        checkbox.addEventListener('change', updateSelectedCorrections);
    });
    
    // 전체 선택 체크박스
    const selectAllCheckbox = document.getElementById('selectAll');
    if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener('change', toggleSelectAll);
    }
    
    // 일괄 적용 버튼
    const batchBtn = document.getElementById('applyBatchCorrections');
    if (batchBtn) {
        batchBtn.addEventListener('click', showBatchCorrectionModal);
    }
}

// 나머지 함수들은 길어져서 간단히 구현
function applySingleCorrectionById(issueId) {
    const issue = findIssueById(issueId);
    if (!issue || !elements.correctionModal) return;
    
    if (issue.original && issue.suggestion) {
        if (elements.correctionPreview) {
            elements.correctionPreview.innerHTML = `
                <div class="preview-item">
                    <span class="correction-wrong">${escapeHtml(issue.original)}</span>
                    <span class="correction-arrow">→</span>
                    <span class="correction-right">${escapeHtml(issue.suggestion)}</span>
                </div>
            `;
        }
        
        elements.correctionModal.classList.remove('hidden');
        elements.correctionModal.dataset.issueId = issueId;
    }
}

function findIssueById(issueId) {
    const allIssues = [
        ...currentValidationResults.errors,
        ...currentValidationResults.warnings,
        ...currentValidationResults.suggestions
    ];
    return allIssues.find(issue => issue.id === issueId);
}

function ignoreIssue(issueId) {
    currentValidationResults.errors = currentValidationResults.errors.filter(i => i.id !== issueId);
    currentValidationResults.warnings = currentValidationResults.warnings.filter(i => i.id !== issueId);
    currentValidationResults.suggestions = currentValidationResults.suggestions.filter(i => i.id !== issueId);
    
    displayValidationResults();
    showMessage('해당 항목이 무시되었습니다.', 'info');
}

function updateSelectedCorrections() {
    selectedCorrections.clear();
    document.querySelectorAll('input[type="checkbox"][data-issue-id]:checked').forEach(checkbox => {
        selectedCorrections.add(checkbox.dataset.issueId);
    });
    
    if (elements.selectedCount) {
        elements.selectedCount.textContent = selectedCorrections.size;
    }
}

function toggleSelectAll(e) {
    const isChecked = e.target.checked;
    document.querySelectorAll('input[type="checkbox"][data-issue-id]').forEach(checkbox => {
        checkbox.checked = isChecked;
    });
    updateSelectedCorrections();
}

function showBatchCorrectionModal() {
    if (selectedCorrections.size === 0) {
        showMessage('수정할 항목을 선택해주세요.', 'warning');
        return;
    }
    
    const selectedIssues = Array.from(selectedCorrections).map(id => findIssueById(id)).filter(Boolean);
    
    if (elements.batchPreview) {
        elements.batchPreview.innerHTML = selectedIssues.map(issue => `
            <div class="preview-item">
                <span class="correction-wrong">${escapeHtml(issue.original)}</span>
                <span class="correction-arrow">→</span>
                <span class="correction-right">${escapeHtml(issue.suggestion)}</span>
            </div>
        `).join('');
    }
    
    if (elements.selectedCount) {
        elements.selectedCount.textContent = selectedCorrections.size;
    }
    if (elements.batchCorrectionModal) {
        elements.batchCorrectionModal.classList.remove('hidden');
    }
}

function applySingleCorrection() {
    if (!elements.correctionModal) return;
    
    const issueId = elements.correctionModal.dataset.issueId;
    const issue = findIssueById(issueId);
    
    if (issue && issue.original && issue.suggestion && elements.documentInput) {
        let currentText = elements.documentInput.value;
        
        if (issue.id === 'missing-ending') {
            if (!currentText.endsWith('.  끝.')) {
                currentText = currentText.replace(/\.$/, '.  끝.');
            }
        } else {
            const regex = new RegExp(issue.original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
            currentText = currentText.replace(regex, issue.suggestion);
        }
        
        elements.documentInput.value = currentText;
        updateCharCount();
        
        ignoreIssue(issueId);
        showMessage('수정이 적용되었습니다.', 'success');
    }
    
    closeModals();
}

function applyBatchCorrections() {
    if (!elements.documentInput) return;
    
    let currentText = elements.documentInput.value;
    let appliedCount = 0;
    
    Array.from(selectedCorrections).forEach(issueId => {
        const issue = findIssueById(issueId);
        if (issue && issue.original && issue.suggestion) {
            if (issue.id === 'missing-ending') {
                if (!currentText.endsWith('.  끝.')) {
                    currentText = currentText.replace(/\.$/, '.  끝.');
                    appliedCount++;
                }
            } else {
                const regex = new RegExp(issue.original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
                if (regex.test(currentText)) {
                    currentText = currentText.replace(regex, issue.suggestion);
                    appliedCount++;
                }
            }
        }
    });
    
    elements.documentInput.value = currentText;
    updateCharCount();
    
    Array.from(selectedCorrections).forEach(issueId => {
        currentValidationResults.errors = currentValidationResults.errors.filter(i => i.id !== issueId);
        currentValidationResults.warnings = currentValidationResults.warnings.filter(i => i.id !== issueId);
        currentValidationResults.suggestions = currentValidationResults.suggestions.filter(i => i.id !== issueId);
    });
    
    displayValidationResults();
    showMessage(`${appliedCount}개의 수정사항이 적용되었습니다.`, 'success');
    
    closeModals();
}

function clearDocument() {
    if (!elements.documentInput) return;
    
    if (elements.documentInput.value.trim() && !confirm('작성된 내용이 모두 지워집니다. 계속하시겠습니까?')) {
        return;
    }
    
    elements.documentInput.value = '';
    updateCharCount();
    
    currentValidationResults = { errors: [], warnings: [], suggestions: [], originalText: '', correctedText: '' };
    
    if (elements.resultsContent) {
        elements.resultsContent.innerHTML = `
            <div class="results-placeholder">
                <div class="placeholder-icon">📝</div>
                <h3>검증 대기 중</h3>
                <p>공문서를 입력하고 검증을 시작해주세요.</p>
            </div>
        `;
    }
    
    if (elements.validationSummary) {
        elements.validationSummary.textContent = '검증을 시작하려면 좌측에 공문서를 입력하고 \'검증 시작\' 버튼을 클릭하세요.';
        elements.validationSummary.className = 'validation-summary';
    }
    
    if (elements.correctedPreview) {
        elements.correctedPreview.classList.add('hidden');
    }
    
    showMessage('문서가 초기화되었습니다.', 'info');
}

function loadSampleDocument() {
    if (!elements.documentInput) return;
    
    const choice = confirm('어떤 예시를 불러오시겠습니까?\n확인: 정상적인 공문\n취소: 오류가 있는 공문');
    const selectedSample = choice ? sampleDocument : errorDocument;
    const selectedName = choice ? '정상적인 공문 예시' : '오류가 있는 공문 예시';
    
    elements.documentInput.value = selectedSample;
    updateCharCount();
    
    showMessage(`${selectedName}가 로드되었습니다.`, 'info');
}

async function copyToClipboard() {
    try {
        const textToCopy = currentValidationResults.correctedText || (elements.documentInput ? elements.documentInput.value : '');
        await navigator.clipboard.writeText(textToCopy);
        showMessage('문서가 클립보드에 복사되었습니다.', 'success');
    } catch (error) {
        console.error('복사 실패:', error);
        showMessage('클립보드 복사에 실패했습니다.', 'error');
    }
}

function downloadDocument() {
    const text = currentValidationResults.correctedText || (elements.documentInput ? elements.documentInput.value : '');
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `공문서_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    URL.revokeObjectURL(url);
    showMessage('문서가 다운로드되었습니다.', 'success');
}

function closeModals() {
    if (elements.correctionModal) {
        elements.correctionModal.classList.add('hidden');
    }
    if (elements.batchCorrectionModal) {
        elements.batchCorrectionModal.classList.add('hidden');
    }
}

function handleKeydown(e) {
    if (e.key === 'Escape') {
        closeModals();
    }
    
    if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        startValidation();
    }
    
    if (e.ctrlKey && e.key === 'l') {
        e.preventDefault();
        clearDocument();
    }
}

function showMessage(message, type = 'info') {
    const existingMessage = document.querySelector('.status-message');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    const messageElement = document.createElement('div');
    messageElement.className = `status status--${type}`;
    messageElement.textContent = message;
    
    const main = document.querySelector('.main');
    if (main) {
        main.insertBefore(messageElement, main.firstChild);
    }
    
    setTimeout(() => {
        if (messageElement.parentNode) {
            messageElement.remove();
        }
    }, 3000);
}

// 앱 초기화
document.addEventListener('DOMContentLoaded', init);
// 공문서 검증 및 교정 프로그램 JavaScript

// 문서 유형 설정
let documentType = 'external'; // 'internal' 또는 'external'

// 검증 데이터 및 규칙
const validationRules = {
    dateFormat: {
        // 올바른 형식: 2024. 8. 1.(목)
        correct: [/\d{4}\.\s\d{1,2}\.\s\d{1,2}\.\([월화수목금토일]\)/g],
        incorrect: [
            /\d{4}년\s\d{1,2}월\s\d{1,2}일/g,
            /\d{4}-\d{1,2}-\d{1,2}/g,
            /\d{4}\/\d{1,2}\/\d{1,2}/g,
            /\d{4}\.\d{1,2}\.\d{1,2}/g // 띄어쓰기 없는 경우
        ],
        message: "날짜는 '2024. 8. 1.(목)' 형식으로 표기해야 합니다.",
        severity: "error"
    },
    timeFormat: {
        // 올바른 형식: 09:00~13:30
        correct: [/\d{2}:\d{2}/g],
        incorrect: [
            /오전\s\d{1,2}시\s\d{1,2}분/g,
            /오후\s\d{1,2}시\s\d{1,2}분/g,
            /\d{1,2}시\s\d{1,2}분/g,
            /\d{1}:\d{2}/g // 시간이 한 자리수인 경우
        ],
        message: "시간은 24시각제로 '09:00' 형식(앞자리 0 포함)으로 표기해야 합니다.",
        severity: "error"
    },
    amountFormat: {
        // 올바른 형식: 금113,560원(금일십일만삼천오백육십원)
        pattern: /금\d{1,3}(,\d{3})*원\(금[가-힣]+원\)/g,
        message: "금액은 '금113,560원(금일십일만삼천오백육십원)' 형식으로 표기해야 합니다.",
        severity: "error"
    }
};

// 끝 표시법 규칙들 - 공문서 작성법에 따라 정확히 수정
const endingRules = [
    {
        type: "no_ending",
        pattern: /[^\.]\s*$/,
        correct: " 끝.",
        message: "본문 마지막에 '끝' 표시가 누락되었습니다."
    },
    {
        type: "no_spacing_before_end",
        pattern: /([^\.])끝\.$/,
        correct: "$1 끝.",
        message: "본문 마지막 글자에서 한 글자(2타)를 띄우고 '끝'을 표시해야 합니다."
    },
    {
        type: "wrong_spacing_before_end",
        pattern: /\.\s끝\.$/,
        correct: ". 끝.",
        message: "마침표 다음에 정확히 2칸 띄어쓰기 후 '끝'을 표시해야 합니다."
    },
    {
        type: "no_period_after_end",
        pattern: /끝$/,
        correct: "끝.",
        message: "'끝' 뒤에 마침표가 필요합니다."
    },
    {
        type: "attachment_ending",
        pattern: /붙임.*\.(\s*)끝\.$/,
        correct: function(match) {
            return match.replace(/\.(\s*)끝\./, '. 끝.');
        },
        message: "붙임 표시문 다음에 2칸 띄우고 '끝'을 표시해야 합니다."
    }
];

// 항목 표시법 규칙들
const itemRules = {
    // 올바른 순서: 1., 가., 1), 가), (1), (가), ①, ㉮
    correctOrder: ['1.', '가.', '1)', '가)', '(1)', '(가)', '①', '㉮'],
    patterns: {
        wrongItemSymbol: /(\d+)\)/g, // 1) 형태를 1. 으로 바꿔야 하는 경우
        incorrectSpacing: /(\d+\.|[가-힣]\.)\s*([^\s])/g // 항목 기호 뒤 띄어쓰기
    }
};

const commonMistakes = [
    // 맞춤법 오류들
    { wrong: "워크샵", correct: "워크숍", type: "spelling" },
    { wrong: "레크레이션", correct: "레크리에이션", type: "spelling" },
    { wrong: "리더쉽", correct: "리더십", type: "spelling" },
    { wrong: "윈도우", correct: "윈도", type: "spelling" },
    { wrong: "플랜카드", correct: "현수막", type: "spelling" },
    { wrong: "플랑카드", correct: "현수막", type: "spelling" },
    { wrong: "사료됨", correct: "생각함", type: "spelling" },
    { wrong: "목표 년도", correct: "목표 연도", type: "spelling" },
    { wrong: "동 건은", correct: "이 건은", type: "spelling" },
    { wrong: "동 법", correct: "같은 법", type: "spelling" },
    { wrong: "익일", correct: "다음날", type: "spelling" },
    { wrong: "몇일", correct: "며칠", type: "spacing" },
    { wrong: "몇 일", correct: "며칠", type: "spacing" },
    { wrong: "제작년", correct: "재작년", type: "spelling" },
    { wrong: "제 1조", correct: "제1조", type: "spacing" },
    { wrong: "1조", correct: "제1조", type: "spacing" },
    // 띄어쓰기 오류들
    { wrong: "계획인 바", correct: "계획인바", type: "spacing" },
    { wrong: "요청한 바", correct: "요청한바", type: "spacing" },
    { wrong: "문서 입니다", correct: "문서입니다", type: "spacing" },
    { wrong: "재 교육을", correct: "재교육을", type: "spacing" },
    { wrong: "또 한", correct: "또한", type: "spacing" },
    { wrong: "위호와 관련", correct: "위 호와 관련하여", type: "spacing" },
    { wrong: "계약시", correct: "계약 시", type: "spacing" },
    { wrong: "승인후", correct: "승인 후", type: "spacing" },
    { wrong: "기한내", correct: "기한 내", type: "spacing" },
    { wrong: "계약 체결후", correct: "계약 체결 후", type: "spacing" },
    { wrong: "개시 할", correct: "개시할", type: "spacing" },
    // 쌍점 관련 오류들
    { wrong: /(\w+)\s+:\s+(\w+)/g, correct: "$1: $2", type: "colon" },
    { wrong: /(\w+):(\w+)/g, correct: "$1: $2", type: "colon" },
    // 쉼표 관련 오류들
    { wrong: /(\w+),(\w+)/g, correct: "$1, $2", type: "comma" },
    // 그리고 뒤 쉼표 오류
    { wrong: "그리고,", correct: "그리고", type: "comma" },
    // 등 사용 오류 (단어 하나에만 등 사용하는 경우)
    { wrong: /(\w+)\s등/g, correct: "$1", type: "etc_usage", condition: "single_word" },
    // 괄호 관련 오류들
    { wrong: /(\w+)\s+\(/g, correct: "$1(", type: "parenthesis" }
];

const terminologyRefinement = [
    { difficult: "시행", easy: "실시" },
    { difficult: "제출", easy: "내기" },
    { difficult: "검토", easy: "살펴보기" },
    { difficult: "협조", easy: "도움" },
    { difficult: "승인", easy: "허가" },
    { difficult: "통보", easy: "알림" },
    { difficult: "이행", easy: "실행" },
    { difficult: "준수", easy: "지키기" },
    { difficult: "배치", easy: "배정" },
    { difficult: "활용", easy: "이용" },
    { difficult: "구비", easy: "갖춤" },
    { difficult: "접수", easy: "받기" }
];

const sampleDocument = `수신 ○○○기관장

제목 2024년도 업무협조 요청

○○○○와 관련하여 다음과 같이 협조를 요청드리오니 검토 후 회신하여 주시기 바랍니다.

1. 협조사항

가. 관련 자료 제출

나. 담당자 지정

2. 협조기한: 2024. 12. 31.(화)까지

붙임 관련 서류 1부. 끝.`;

const errorDocument = `수신 ○○○기관장

제목 2024년도업무협조요청

○○○○와관련하여 다음과같이 협조를요청드리오니 검토후 회신하여주시기바랍니다.

1)협조사항

가)관련자료제출

나)담당자지정

2)협조기한:2024년12월31일까지

붙임:관련서류1부.끝`;

// 내부결재용과 대외문서용 문구 차이
const documentTypeTemplates = {
    internal: {
        ending: "끝.",
        attachment: "붙임",
        common_phrases: ["검토하시어", "결재 요청드립니다", "지시하여 주시기 바랍니다"]
    },
    external: {
        ending: "끝.",
        attachment: "붙임",
        common_phrases: ["검토 후 회신하여 주시기 바랍니다", "협조하여 주시기 바랍니다", "참고하시기 바랍니다"]
    }
};

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
        modalCloses: document.querySelectorAll('.modal-close'),
        // 통계 요소들
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
    // 문서 유형 변경 이벤트
    if (elements.documentType) {
        elements.documentType.addEventListener('change', (e) => {
            documentType = e.target.value;
            console.log('Document type changed to:', documentType);
        });
    }

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

    // 항목 기호 검사 - 1)을 1.로 수정
    const itemSymbolPattern = /(\d+)\)/g;
    const matches = Array.from(text.matchAll(itemSymbolPattern));

    matches.forEach((match, index) => {
        issues.push({
            id: 'wrong-item-symbol-' + index,
            type: 'warning',
            title: '잘못된 항목 기호',
            description: '항목 기호는 1. → 가. → 1) → 가) 순서로 사용해야 합니다.',
            position: match.index,
            original: match[0],
            suggestion: match[0].replace(')', '.'),
            rule: '공문서 작성 편람 - 항목 표시법'
        });
    });

    // 관련 근거 작성법 검사
    const relatedPattern = /관련:/g;
    const relatedMatches = Array.from(text.matchAll(relatedPattern));

    relatedMatches.forEach((match, index) => {
        // 쌍점 뒤 띄어쓰기 확인
        const afterColon = text.substring(match.index + 3, match.index + 4);
        if (afterColon !== ' ') {
            issues.push({
                id: 'related-spacing-' + index,
                type: 'warning',
                title: '관련 근거 작성법 오류',
                description: '관련: 다음에 한 칸 띄어써야 합니다.',
                position: match.index,
                original: '관련:',
                suggestion: '관련: ',
                rule: '공문서 작성 편람 - 관련 근거 작성법'
            });
        }
    });

    currentValidationResults.errors.push(...issues.filter(i => i.type === 'error'));
    currentValidationResults.warnings.push(...issues.filter(i => i.type === 'warning'));
}

// 날짜/시간 표기법 검사
function checkDateTimeFormat(text) {
    const issues = [];

    // 잘못된 날짜 형식 검사 (년월일 표기)
    const wrongDatePattern = /\d{4}년\s*\d{1,2}월\s*\d{1,2}일/g;
    const dateMatches = Array.from(text.matchAll(wrongDatePattern));

    dateMatches.forEach((match, index) => {
        const corrected = match[0].replace(/(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일/, '$1. $2. $3.');
        issues.push({
            id: 'wrong-date-format-' + index,
            type: 'error',
            title: '잘못된 날짜 표기법',
            description: '날짜는 온점(.)으로 구분하여 표기해야 합니다.',
            position: match.index,
            original: match[0],
            suggestion: corrected,
            rule: '공문서 작성 편람 - 날짜 표기법'
        });
    });

    // 하이픈 날짜 형식 검사
    const hyphenDatePattern = /\d{4}-\d{1,2}-\d{1,2}/g;
    const hyphenMatches = Array.from(text.matchAll(hyphenDatePattern));

    hyphenMatches.forEach((match, index) => {
        const corrected = match[0].replace(/(\d{4})-(\d{1,2})-(\d{1,2})/, '$1. $2. $3.');
        issues.push({
            id: 'hyphen-date-' + index,
            type: 'error',
            title: '잘못된 날짜 표기법',
            description: '날짜는 하이픈(-) 대신 온점(.)으로 구분해야 합니다.',
            position: match.index,
            original: match[0],
            suggestion: corrected,
            rule: '공문서 작성 편람 - 날짜 표기법'
        });
    });

    // 띄어쓰기 없는 날짜 형식 검사
    const noSpaceDatePattern = /\d{4}\.\d{1,2}\.\d{1,2}\.(?!\s)/g;
    const noSpaceMatches = Array.from(text.matchAll(noSpaceDatePattern));

    noSpaceMatches.forEach((match, index) => {
        const corrected = match[0].replace(/(\d{4})\.(\d{1,2})\.(\d{1,2})\./, '$1. $2. $3.');
        issues.push({
            id: 'no-space-date-' + index,
            type: 'warning',
            title: '날짜 띄어쓰기 오류',
            description: '연, 월, 일 사이는 한 칸씩 띄어써야 합니다.',
            position: match.index,
            original: match[0],
            suggestion: corrected,
            rule: '공문서 작성 편람 - 날짜 표기법'
        });
    });

    // 잘못된 시간 형식 검사 (한 자리 시간)
    const singleDigitTimePattern = /\b\d{1}:\d{2}\b/g;
    const timeMatches = Array.from(text.matchAll(singleDigitTimePattern));

    timeMatches.forEach((match, index) => {
        const corrected = '0' + match[0];
        issues.push({
            id: 'single-digit-time-' + index,
            type: 'error',
            title: '잘못된 시간 표기법',
            description: '시간은 반드시 두 자리로 표기해야 합니다 (앞자리 0 포함).',
            position: match.index,
            original: match[0],
            suggestion: corrected,
            rule: '공문서 작성 편람 - 시간 표기법'
        });
    });

    // 오전/오후 표기 검사
    const ampmPattern = /(오전|오후)\s*\d{1,2}시\s*(\d{1,2}분)?/g;
    const ampmMatches = Array.from(text.matchAll(ampmPattern));

    ampmMatches.forEach((match, index) => {
        issues.push({
            id: 'ampm-time-' + index,
            type: 'error',
            title: '잘못된 시간 표기법',
            description: '24시각제를 사용하여 오전/오후 표기 없이 00:00 형식으로 표기해야 합니다.',
            position: match.index,
            original: match[0],
            suggestion: '24시각제 형식 (예: 14:30)',
            rule: '공문서 작성 편람 - 시간 표기법'
        });
    });

    currentValidationResults.errors.push(...issues.filter(i => i.type === 'error'));
    currentValidationResults.warnings.push(...issues.filter(i => i.type === 'warning'));
}

// 맞춤법 및 띄어쓰기 검사
function checkSpellingAndSpacing(text) {
    const issues = [];

    commonMistakes.forEach((mistake, index) => {
        if (mistake.type === 'colon' || mistake.type === 'comma' || mistake.type === 'parenthesis') {
            // 정규식 패턴인 경우
            if (mistake.wrong instanceof RegExp) {
                const matches = Array.from(text.matchAll(mistake.wrong));
                matches.forEach((match, matchIndex) => {
                    const corrected = match[0].replace(mistake.wrong, mistake.correct);
                    issues.push({
                        id: `${mistake.type}-${index}-${matchIndex}`,
                        type: 'warning',
                        title: `${getIssueTitle(mistake.type)} 오류`,
                        description: `"${match[0]}"는 "${corrected}"로 수정해야 합니다.`,
                        position: match.index,
                        original: match[0],
                        suggestion: corrected,
                        rule: '공문서 작성 편람'
                    });
                });
            }
        } else {
            // 일반 문자열 패턴인 경우
            const regex = new RegExp(mistake.wrong.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
            const matches = Array.from(text.matchAll(regex));

            matches.forEach((match, matchIndex) => {
                issues.push({
                    id: `${mistake.type}-${index}-${matchIndex}`,
                    type: mistake.type === 'spelling' ? 'error' : 'warning',
                    title: mistake.type === 'spelling' ? '맞춤법 오류' : '띄어쓰기 오류',
                    description: `"${mistake.wrong}"는 "${mistake.correct}"로 수정해야 합니다.`,
                    position: match.index,
                    original: mistake.wrong,
                    suggestion: mistake.correct,
                    rule: '한글 맞춤법 규정'
                });
            });
        }
    });

    // '등' 사용법 검사 (두 개 이상의 단어가 있을 때만 사용)
    const etcPattern = /(\w+)\s+등/g;
    const etcMatches = Array.from(text.matchAll(etcPattern));

    etcMatches.forEach((match, index) => {
        // 앞에 쉼표로 구분된 단어들이 있는지 확인
        const beforeText = text.substring(0, match.index);
        const commaCount = (beforeText.match(/,/g) || []).length;

        if (commaCount === 0) {
            // 단어 하나에만 '등' 사용
            issues.push({
                id: 'etc-usage-' + index,
                type: 'warning',
                title: '"등" 사용법 오류',
                description: '"등"은 두 개 이상의 항목이 나열될 때 사용해야 합니다.',
                position: match.index,
                original: match[0],
                suggestion: match[1],
                rule: '공문서 작성 편람'
            });
        }
    });

    currentValidationResults.errors.push(...issues.filter(i => i.type === 'error'));
    currentValidationResults.warnings.push(...issues.filter(i => i.type === 'warning'));
}

// 끝 표시법 검사
function checkEndingFormat(text) {
    const issues = [];

    endingRules.forEach((rule, index) => {
        if (rule.pattern.test(text)) {
            const match = text.match(rule.pattern);
            if (match) {
                let suggestion = rule.correct;
                if (typeof rule.correct === 'function') {
                    suggestion = rule.correct(match[0]);
                }

                issues.push({
                    id: 'ending-' + rule.type + '-' + index,
                    type: 'error',
                    title: '끝 표시법 오류',
                    description: rule.message,
                    position: match.index || 0,
                    original: match[0],
                    suggestion: suggestion,
                    rule: '공문서 작성 편람 - 끝 표시법'
                });
            }
        }
    });

    currentValidationResults.errors.push(...issues.filter(i => i.type === 'error'));
}

// 용어 순화 검사
function checkTerminology(text) {
    const suggestions = [];

    terminologyRefinement.forEach((term, index) => {
        const regex = new RegExp(term.difficult, 'g');
        const matches = Array.from(text.matchAll(regex));

        matches.forEach((match, matchIndex) => {
            suggestions.push({
                id: `terminology-${index}-${matchIndex}`,
                type: 'suggestion',
                title: '용어 순화 제안',
                description: `"${term.difficult}"을 "${term.easy}"로 바꾸면 더 쉽게 이해할 수 있습니다.`,
                position: match.index,
                original: term.difficult,
                suggestion: term.easy,
                rule: '쉬운 공문서 작성 가이드'
            });
        });
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

    // 위치 기준 역순으로 정렬 (뒤에서부터 교정하여 위치 변화 방지)
    allIssues.sort((a, b) => b.position - a.position);

    allIssues.forEach(issue => {
        if (issue.original && issue.suggestion) {
            // 정확한 위치의 텍스트 교체
            const before = corrected.substring(0, issue.position);
            const after = corrected.substring(issue.position + issue.original.length);
            corrected = before + issue.suggestion + after;
        }
    });

    currentValidationResults.correctedText = corrected;
}

// 검증 결과 표시
function displayValidationResults() {
    const { errors, warnings, suggestions } = currentValidationResults;

    // 통계 업데이트
    updateSummaryStats(errors.length, warnings.length, suggestions.length);

    // 요약 메시지 업데이트
    updateValidationSummary();

    // 탭과 결과 영역 표시
    if (elements.resultsTabs) {
        elements.resultsTabs.classList.remove('hidden');
    }

    // 첫 번째 탭(전체) 활성화
    showTabContent('all');

    // 교정된 문서 미리보기 표시
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
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('tab-btn--active');
        });
        e.target.classList.add('tab-btn--active');

        // 탭 내용 표시
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
        elements.resultsContent.innerHTML = `
            <div class="results-placeholder">
                <div class="placeholder-icon">✅</div>
                <h3>문제가 없습니다</h3>
                <p>이 범주에서 발견된 문제가 없습니다.</p>
            </div>
        `;
        return;
    }

    elements.resultsContent.innerHTML = issues.map(issue => createIssueHTML(issue)).join('');
}

// 이슈 HTML 생성
function createIssueHTML(issue) {
    const severityClass = getSeverityClass(issue.type);
    const severityIcon = getSeverityIcon(issue.type);
    const severityText = getSeverityText(issue.type);

    return `
        <div class="validation-issue validation-issue--${severityClass}" data-issue-id="${issue.id}">
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

    // 결과 영역 초기화
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
        elements.validationSummary.textContent = '검증을 시작하려면 좌측에 공문서를 입력하고 '검증 시작' 버튼을 클릭하세요.';
        elements.validationSummary.className = 'validation-summary';
    }

    if (elements.summaryStats) {
        elements.summaryStats.classList.add('hidden');
    }

    if (elements.resultsTabs) {
        elements.resultsTabs.classList.add('hidden');
    }

    if (elements.resultsContent) {
        elements.resultsContent.innerHTML = `
            <div class="results-placeholder">
                <div class="placeholder-icon">🔍</div>
                <h3>검증 대기 중</h3>
                <p>공문서를 입력하고 검증을 시작해주세요.</p>
            </div>
        `;
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
    if (!issue) return;

    // 현재 입력된 텍스트에서 수정 적용
    let currentText = elements.documentInput.value;
    currentText = currentText.replace(issue.original, issue.suggestion);
    elements.documentInput.value = currentText;

    showMessage(`"${issue.original}"을 "${issue.suggestion}"로 수정했습니다.`, 'success');
    updateCharCount();
}

// 모달 닫기
function closeModals() {
    if (elements.correctionModal) {
        elements.correctionModal.classList.add('hidden');
    }

    if (elements.batchCorrectionModal) {
        elements.batchCorrectionModal.classList.add('hidden');
    }
}

// 키보드 단축키 처리
function handleKeydown(e) {
    // Ctrl+Enter로 검증 시작
    if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        startValidation();
    }

    // ESC로 모달 닫기
    if (e.key === 'Escape') {
        closeModals();
    }
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

function getIssueTitle(type) {
    switch (type) {
        case 'colon': return '쌍점 표기';
        case 'comma': return '쉼표 표기';
        case 'parenthesis': return '괄호 표기';
        default: return '표기';
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

function showMessage(message, type = 'info') {
    // 간단한 토스트 메시지 표시
    const toast = document.createElement('div');
    toast.className = `status status--${type}`;
    toast.textContent = message;
    toast.style.position = 'fixed';
    toast.style.top = '20px';
    toast.style.right = '20px';
    toast.style.zIndex = '9999';
    toast.style.minWidth = '300px';

    document.body.appendChild(toast);

    setTimeout(() => {
        document.body.removeChild(toast);
    }, 3000);
}

// 추가 기능 - 일괄 적용 관련
function applyBatchCorrections() {
    // 구현 예정
    console.log('Batch corrections not implemented yet');
}

function showIssueDetails(issueId) {
    const issue = findIssueById(issueId);
    if (!issue) return;

    alert(`상세 정보:\n\n제목: ${issue.title}\n설명: ${issue.description}\n규정: ${issue.rule}`);
}

// DOM이 로드되면 초기화
document.addEventListener('DOMContentLoaded', init);
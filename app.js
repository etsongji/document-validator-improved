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

// 맞춤법 및 띄어쓰기 오류 목록 - 대폭 확장
const commonMistakes = [
    // 맞춤법 오류들
    { wrong: "워크샵", correct: "워크숍", type: "spelling" },
    { wrong: "레크레이션", correct: "레크리에이션", type: "spelling" },
    { wrong: "리더쉽", correct: "리더십", type: "spelling" },
    { wrong: "윈도우", correct: "윈도", type: "spelling" },
    { wrong: "사료됨", correct: "생각함", type: "spelling" },
    { wrong: "목표 년도", correct: "목표 연도", type: "spelling" },
    { wrong: "동 건은", correct: "이 건은", type: "spelling" },
    { wrong: "익일", correct: "다음날", type: "spelling" },
    { wrong: "제작년", correct: "재작년", type: "spelling" },
    { wrong: "몇일", correct: "며칠", type: "spelling" },
    { wrong: "몇 일", correct: "며칠", type: "spelling" },
    { wrong: "며칠 동안", correct: "며칠간", type: "spelling" },

    // 조사/어미 띄어쓰기 오류들
    { wrong: "계획인 바", correct: "계획인바", type: "spacing" },
    { wrong: "요청한 바", correct: "요청한바", type: "spacing" },
    { wrong: "알려진 바", correct: "알려진바", type: "spacing" },
    { wrong: "승인한 바", correct: "승인한바", type: "spacing" },
    { wrong: "검토한 바", correct: "검토한바", type: "spacing" },

    // 서술어 띄어쓰기 오류들
    { wrong: "문서 입니다", correct: "문서입니다", type: "spacing" },
    { wrong: "요청 드립니다", correct: "요청드립니다", type: "spacing" },
    { wrong: "협조 바랍니다", correct: "협조바랍니다", type: "spacing" },
    { wrong: "검토 하시기", correct: "검토하시기", type: "spacing" },
    { wrong: "참고 하시기", correct: "참고하시기", type: "spacing" },
    { wrong: "회신 하여", correct: "회신하여", type: "spacing" },

    // 접두사 띄어쓰기 오류들
    { wrong: "재 교육", correct: "재교육", type: "spacing" },
    { wrong: "재 검토", correct: "재검토", type: "spacing" },
    { wrong: "재 승인", correct: "재승인", type: "spacing" },
    { wrong: "신 설치", correct: "신설치", type: "spacing" },
    { wrong: "신 규모", correct: "신규모", type: "spacing" },
    { wrong: "구 버전", correct: "구버전", type: "spacing" },

    // 연결부사 띄어쓰기 오류들
    { wrong: "또 한", correct: "또한", type: "spacing" },
    { wrong: "그러므 로", correct: "그러므로", type: "spacing" },
    { wrong: "따라 서", correct: "따라서", type: "spacing" },
    { wrong: "그런 데", correct: "그런데", type: "spacing" },

    // 시간 관련 띄어쓰기 오류들
    { wrong: "계약시", correct: "계약 시", type: "spacing" },
    { wrong: "승인시", correct: "승인 시", type: "spacing" },
    { wrong: "완료시", correct: "완료 시", type: "spacing" },
    { wrong: "제출시", correct: "제출 시", type: "spacing" },
    { wrong: "승인후", correct: "승인 후", type: "spacing" },
    { wrong: "완료후", correct: "완료 후", type: "spacing" },
    { wrong: "검토후", correct: "검토 후", type: "spacing" },
    { wrong: "논의후", correct: "논의 후", type: "spacing" },
    { wrong: "기한내", correct: "기한 내", type: "spacing" },
    { wrong: "범위내", correct: "범위 내", type: "spacing" },

    // 동작 관련 띄어쓰기 오류들
    { wrong: "개시 할", correct: "개시할", type: "spacing" },
    { wrong: "진행 할", correct: "진행할", type: "spacing" },
    { wrong: "실시 할", correct: "실시할", type: "spacing" },
    { wrong: "시행 할", correct: "시행할", type: "spacing" },
    { wrong: "추진 할", correct: "추진할", type: "spacing" },

    // 조 관련 띄어쓰기 오류들
    { wrong: "제 1조", correct: "제1조", type: "spacing" },
    { wrong: "제 2조", correct: "제2조", type: "spacing" },
    { wrong: "제 3조", correct: "제3조", type: "spacing" },
    { wrong: "1 조", correct: "제1조", type: "spacing" },
    { wrong: "2 조", correct: "제2조", type: "spacing" },
    { wrong: "1조", correct: "제1조", type: "spacing" },
    { wrong: "2조", correct: "제2조", type: "spacing" },

    // 공문서 특수 표현 띄어쓰기 오류들
    { wrong: "위 호와관련", correct: "위 호와 관련", type: "spacing" },
    { wrong: "관련 하여", correct: "관련하여", type: "spacing" },
    { wrong: "대하 여", correct: "대하여", type: "spacing" },
    { wrong: "의하 여", correct: "의하여", type: "spacing" },
    { wrong: "따르 어", correct: "따라", type: "spacing" },

    // 단위/숫자 띄어쓰기 오류들
    { wrong: "1 개", correct: "1개", type: "spacing" },
    { wrong: "2 개", correct: "2개", type: "spacing" },
    { wrong: "1 부", correct: "1부", type: "spacing" },
    { wrong: "2 부", correct: "2부", type: "spacing" },
    { wrong: "1 명", correct: "1명", type: "spacing" },
    { wrong: "2 명", correct: "2명", type: "spacing" }
];

// 항목 기호 순서 정의
const itemHierarchy = [
    { pattern: /^\s*\d+\./gm, level: 1, name: "1." },      // 1. 2. 3.
    { pattern: /^\s*[가-힣]\./gm, level: 2, name: "가." },   // 가. 나. 다.
    { pattern: /^\s*\d+\)/gm, level: 3, name: "1)" },     // 1) 2) 3)
    { pattern: /^\s*[가-힣]\)/gm, level: 4, name: "가)" }   // 가) 나) 다)
];

// 예시 문서
const sampleDocument = `수신 ○○○기관장

제목 2024년도 업무협조 요청

○○○○와 관련하여 다음과 같이 협조를 요청드리오니 검토 후 회신하여 주시기 바랍니다.

1. 협조사항

가. 관련 자료 제출

나. 담당자 지정

2. 협조기한: 2024. 12. 31.(화)까지

붙임 관련 서류 1부.  끝.`;

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
        { name: '문서 구조 및 항목 기호 검사', progress: 20, fn: () => checkDocumentStructure(text) },
        { name: '날짜/시간 표기법 검사', progress: 40, fn: () => checkDateTimeFormat(text) },
        { name: '맞춤법 및 띄어쓰기 검사', progress: 70, fn: () => checkSpellingAndSpacing(text) },
        { name: '끝 표시법 검사', progress: 90, fn: () => checkEndingFormat(text) },
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

// 문서 구조 및 항목 기호 검사 - 대폭 강화
function checkDocumentStructure(text) {
    const issues = [];

    // 1. 잘못된 항목 기호 형식 검사 (1) -> 1.)
    const wrongItemPattern = /^\s*\d+\)\s/gm;
    let match;
    while ((match = wrongItemPattern.exec(text)) !== null) {
        issues.push({
            id: 'wrong-item-symbol-' + match.index,
            type: 'error',
            title: '잘못된 항목 기호',
            description: '1단계 항목은 "1."로 표기해야 하며, "1)"은 3단계에서 사용합니다.',
            position: match.index,
            original: match[0].trim(),
            suggestion: match[0].replace(')', '.'),
            rule: '공문서 작성 편람 - 항목 표시법'
        });
    }

    // 2. 항목 기호 뒤 띄어쓰기 검사
    const noSpaceAfterItemPattern = /^\s*(\d+\.|[가-힣]\.|\d+\)|[가-힣]\))[^\s]/gm;
    let spaceMatch;
    while ((spaceMatch = noSpaceAfterItemPattern.exec(text)) !== null) {
        issues.push({
            id: 'item-no-space-' + spaceMatch.index,
            type: 'error',
            title: '항목 기호 띄어쓰기 오류',
            description: '항목 기호 뒤에 한 칸 띄어써야 합니다.',
            position: spaceMatch.index,
            original: spaceMatch[1],
            suggestion: spaceMatch[1] + ' ',
            rule: '공문서 작성 편람 - 항목 표시법'
        });
    }

    // 3. 항목 기호 순서 검사
    const lines = text.split('\n');
    let currentLevel = 0;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        // 각 레벨의 항목 기호 확인
        for (let j = 0; j < itemHierarchy.length; j++) {
            const hierarchy = itemHierarchy[j];
            if (hierarchy.pattern.test(line)) {
                const expectedLevel = j + 1;

                // 순서가 맞지 않는 경우 (2단계 이상 건너뛰는 경우)
                if (expectedLevel > currentLevel + 1) {
                    issues.push({
                        id: 'item-hierarchy-skip-' + i,
                        type: 'warning',
                        title: '항목 기호 순서 오류',
                        description: `항목 기호는 순차적으로 사용해야 합니다. ${hierarchy.name} 앞에 중간 단계가 누락되었습니다.`,
                        position: text.indexOf(line),
                        original: line.split(' ')[0],
                        suggestion: '순차적 항목 기호 사용',
                        rule: '공문서 작성 편람 - 항목 표시법'
                    });
                }

                currentLevel = expectedLevel;
                break;
            }
        }
    }

    // 4. 쌍점(:) 뒤 띄어쓰기 검사
    const colonPattern = /([^\s]):([^\s])/g;
    let colonMatch;
    while ((colonMatch = colonPattern.exec(text)) !== null) {
        issues.push({
            id: 'colon-spacing-' + colonMatch.index,
            type: 'warning',
            title: '쌍점 띄어쓰기 오류',
            description: '쌍점(:) 뒤에 한 칸 띄어써야 합니다.',
            position: colonMatch.index,
            original: colonMatch[0],
            suggestion: colonMatch[1] + ': ' + colonMatch[2],
            rule: '공문서 작성 편람'
        });
    }

    // 5. 쌍점(:) 앞 띄어쓰기 검사 (불필요한 경우)
    const colonBeforePattern = /\s+:/g;
    let colonBeforeMatch;
    while ((colonBeforeMatch = colonBeforePattern.exec(text)) !== null) {
        issues.push({
            id: 'colon-before-spacing-' + colonBeforeMatch.index,
            type: 'warning',
            title: '쌍점 앞 띄어쓰기 오류',
            description: '쌍점(:) 앞에는 띄어쓰지 않습니다.',
            position: colonBeforeMatch.index,
            original: colonBeforeMatch[0] + ':',
            suggestion: ':',
            rule: '공문서 작성 편람'
        });
    }

    currentValidationResults.errors.push(...issues.filter(i => i.type === 'error'));
    currentValidationResults.warnings.push(...issues.filter(i => i.type === 'warning'));
}

// 날짜/시간 표기법 검사
function checkDateTimeFormat(text) {
    const issues = [];

    // 잘못된 날짜 형식 검사 (년월일 표기만)
    const wrongDatePattern = /\d{4}년\s*\d{1,2}월\s*\d{1,2}일/g;
    let dateMatch;
    while ((dateMatch = wrongDatePattern.exec(text)) !== null) {
        const corrected = dateMatch[0].replace(/(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일/, '$1. $2. $3.');
        issues.push({
            id: 'date-format-error-' + dateMatch.index,
            type: 'error',
            title: '잘못된 날짜 표기법',
            description: '날짜는 온점(.)으로 구분하여 표기해야 합니다.',
            position: dateMatch.index,
            original: dateMatch[0],
            suggestion: corrected,
            rule: '공문서 작성 편람 - 날짜 표기법'
        });
    }

    // 하이픈 날짜 형식 검사
    const hyphenDatePattern = /\d{4}-\d{1,2}-\d{1,2}/g;
    let hyphenMatch;
    while ((hyphenMatch = hyphenDatePattern.exec(text)) !== null) {
        const corrected = hyphenMatch[0].replace(/(\d{4})-(\d{1,2})-(\d{1,2})/, '$1. $2. $3.');
        issues.push({
            id: 'hyphen-date-error-' + hyphenMatch.index,
            type: 'error',
            title: '잘못된 날짜 표기법',
            description: '날짜는 하이픈(-) 대신 온점(.)으로 구분해야 합니다.',
            position: hyphenMatch.index,
            original: hyphenMatch[0],
            suggestion: corrected,
            rule: '공문서 작성 편람'
        });
    }

    // 올바르지 않은 시간 형식만 검사
    // 1. 오전/오후 표기 검사
    const ampmPattern = /(오전|오후)\s*\d{1,2}시(\s*\d{1,2}분)?/g;
    let ampmMatch;
    while ((ampmMatch = ampmPattern.exec(text)) !== null) {
        issues.push({
            id: 'ampm-time-error-' + ampmMatch.index,
            type: 'error',
            title: '잘못된 시간 표기법',
            description: '24시각제를 사용하여 00:00 형식으로 표기해야 합니다.',
            position: ampmMatch.index,
            original: ampmMatch[0],
            suggestion: '24시각제 형식 (예: 14:30)',
            rule: '공문서 작성 편람'
        });
    }

    // 2. 시분 단위 표기 검사 (단독으로 사용된 경우만)
    const timeUnitPattern = /\b\d{1,2}시\s*\d{1,2}분\b/g;
    let timeUnitMatch;
    while ((timeUnitMatch = timeUnitPattern.exec(text)) !== null) {
        // 오전/오후가 앞에 없는 경우만 체크
        const beforeText = text.substring(Math.max(0, timeUnitMatch.index - 10), timeUnitMatch.index);
        if (!beforeText.includes('오전') && !beforeText.includes('오후')) {
            issues.push({
                id: 'time-unit-error-' + timeUnitMatch.index,
                type: 'warning',
                title: '시간 표기법 개선 제안',
                description: '시간은 00:00 형식으로 표기하는 것이 좋습니다.',
                position: timeUnitMatch.index,
                original: timeUnitMatch[0],
                suggestion: '00:00 형식',
                rule: '공문서 작성 편람'
            });
        }
    }

    // 3. 한 자리 시간 검사 (예: 9:00 → 09:00)
    const singleDigitTimePattern = /\b\d{1}:\d{2}\b/g;
    let singleDigitMatch;
    while ((singleDigitMatch = singleDigitTimePattern.exec(text)) !== null) {
        const corrected = '0' + singleDigitMatch[0];
        issues.push({
            id: 'single-digit-time-' + singleDigitMatch.index,
            type: 'warning',
            title: '시간 표기법 개선',
            description: '시간은 두 자리로 표기하는 것이 좋습니다.',
            position: singleDigitMatch.index,
            original: singleDigitMatch[0],
            suggestion: corrected,
            rule: '공문서 작성 편람'
        });
    }

    currentValidationResults.errors.push(...issues.filter(i => i.type === 'error'));
    currentValidationResults.warnings.push(...issues.filter(i => i.type === 'warning'));
}

// 맞춤법 및 띄어쓰기 검사 - 대폭 강화
function checkSpellingAndSpacing(text) {
    const issues = [];

    commonMistakes.forEach((mistake, index) => {
        if (text.includes(mistake.wrong)) {
            // 정확한 위치 찾기
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

                // 다음 검색을 위해 텍스트 업데이트
                position += mistake.wrong.length;
                searchText = text.substring(position);
            }
        }
    });

    // 추가 띄어쓰기 검사 패턴들
    const additionalSpacingPatterns = [
        // 숫자와 단위 사이 불필요한 띄어쓰기
        { pattern: /\d+\s+(개|부|명|건|회|차|번|점|대|장|권|편)/g, 
          type: 'warning', 
          message: '숫자와 단위 사이는 띄어쓰지 않습니다.' },

        // 쉼표 뒤 띄어쓰기 누락
        { pattern: /,([^\s\d])/g, 
          type: 'warning', 
          message: '쉼표(,) 뒤에 한 칸 띄어써야 합니다.' },

        // 괄호 앞 불필요한 띄어쓰기
        { pattern: /\s+\(/g, 
          type: 'warning', 
          message: '괄호 앞에는 띄어쓰지 않습니다.' }
    ];

    additionalSpacingPatterns.forEach((patternObj, index) => {
        let match;
        while ((match = patternObj.pattern.exec(text)) !== null) {
            let suggestion = '';

            if (patternObj.pattern.source.includes('\\d+\\s+')) {
                // 숫자와 단위 사이 공백 제거
                suggestion = match[0].replace(/\s+/, '');
            } else if (patternObj.pattern.source.includes(',')) {
                // 쉼표 뒤 공백 추가
                suggestion = ', ' + match[1];
            } else if (patternObj.pattern.source.includes('\\(')) {
                // 괄호 앞 공백 제거
                suggestion = '(';
            }

            issues.push({
                id: `additional-spacing-${index}-${match.index}`,
                type: patternObj.type,
                title: '띄어쓰기 오류',
                description: patternObj.message,
                position: match.index,
                original: match[0],
                suggestion: suggestion,
                rule: '한글 띄어쓰기 규정'
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

// 끝 표시법 검사 - 매우 엄격한 규칙 적용
function checkEndingFormat(text) {
    const issues = [];
    const trimmedText = text.trim();

    // 1. 끝 표시가 아예 없는 경우
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
        currentValidationResults.errors.push(...issues);
        return;
    }

    // 2. 올바른 형식: ".  끝." (마침표 + 2칸 띄어쓰기 + 끝.)
    if (trimmedText.endsWith('.  끝.')) {
        // 올바른 형식이면 검사 통과
        return;
    }

    // 3. 다양한 잘못된 형식들 검사
    let errorFound = false;

    // 마침표 없이 끝나는 경우
    if (trimmedText.match(/[^.]\s*끝\.$/)) {
        issues.push({
            id: 'ending-no-period',
            type: 'error',
            title: '끝 표시법 오류',
            description: '끝 표시 앞에 마침표가 필요합니다.',
            position: trimmedText.lastIndexOf('끝.'),
            original: '현재 형식',
            suggestion: '.  끝.',
            rule: '공문서 작성 편람 - 끝 표시법'
        });
        errorFound = true;
    }
    // 띄어쓰기 없이 .끝.
    else if (trimmedText.endsWith('.끝.')) {
        issues.push({
            id: 'ending-no-space',
            type: 'error',
            title: '끝 표시법 오류',
            description: '마침표 다음에 2칸 띄어쓰기가 필요합니다.',
            position: trimmedText.lastIndexOf('.끝.'),
            original: '.끝.',
            suggestion: '.  끝.',
            rule: '공문서 작성 편람 - 끝 표시법'
        });
        errorFound = true;
    }
    // 1칸 띄어쓰기 . 끝.
    else if (trimmedText.endsWith('. 끝.')) {
        issues.push({
            id: 'ending-one-space',
            type: 'error',
            title: '끝 표시법 오류',
            description: '마침표 다음에 정확히 2칸 띄어쓰기해야 합니다.',
            position: trimmedText.lastIndexOf('. 끝.'),
            original: '. 끝.',
            suggestion: '.  끝.',
            rule: '공문서 작성 편람 - 끝 표시법'
        });
        errorFound = true;
    }
    // 3칸 이상 띄어쓰기
    else if (trimmedText.match(/\.\s{3,}끝\.$/)) {
        issues.push({
            id: 'ending-too-many-spaces',
            type: 'error',
            title: '끝 표시법 오류',
            description: '마침표 다음에 정확히 2칸만 띄어쓰기해야 합니다.',
            position: trimmedText.search(/\.\s{3,}끝\.$/),
            original: '현재 형식',
            suggestion: '.  끝.',
            rule: '공문서 작성 편람 - 끝 표시법'
        });
        errorFound = true;
    }
    // 끝 뒤에 마침표 없음 ".  끝"
    else if (trimmedText.match(/\.\s\s끝$/)) {
        issues.push({
            id: 'ending-no-final-period',
            type: 'error',
            title: '끝 표시법 오류',
            description: '"끝" 뒤에 마침표가 필요합니다.',
            position: trimmedText.lastIndexOf('끝'),
            original: '끝',
            suggestion: '끝.',
            rule: '공문서 작성 편람 - 끝 표시법'
        });
        errorFound = true;
    }

    // 일반적인 끝 표시 오류 (위의 패턴에 맞지 않는 경우)
    if (!errorFound && trimmedText.includes('끝.')) {
        issues.push({
            id: 'ending-format-general',
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

    // 모든 오류와 경고를 교정
    const allIssues = [
        ...currentValidationResults.errors,
        ...currentValidationResults.warnings
    ];

    // 위치 기준 역순으로 정렬 (뒤에서부터 교정하여 위치 변화 방지)
    allIssues.sort((a, b) => b.position - a.position);

    allIssues.forEach(issue => {
        if (issue.original && issue.suggestion && 
            issue.original !== '없음' && issue.original !== '현재 형식') {
            corrected = corrected.replace(issue.original, issue.suggestion);
        }
    });

    // 끝 표시 추가/수정
    if (!corrected.trim().endsWith('.  끝.')) {
        // 기존 끝 표시 제거 후 올바른 형식으로 추가
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
            ${issue.original && issue.suggestion && issue.original !== '없음' && issue.original !== '현재 형식' ? `
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

    // 끝 표시법 수정의 경우 특별 처리
    if (issue.id.includes('ending')) {
        if (issue.id === 'ending-missing') {
            currentText = currentText.trim() + '.  끝.';
        } else {
            // 기존 잘못된 끝 표시 제거 후 올바른 형식 추가
            currentText = currentText.replace(/\.?\s*끝\.?\s*$/, '').trim() + '.  끝.';
        }
    } else if (issue.original && issue.suggestion) {
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
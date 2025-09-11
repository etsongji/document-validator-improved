// 공문서 검증 및 교정 프로그램 JavaScript - 정규식 오류 수정

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

// 숫자를 한글로 변환하는 함수 (간단 버전)
function numberToKorean(num) {
    const units = ['', '십', '백', '천', '만', '십만', '백만', '천만', '억'];
    const digits = ['', '일', '이', '삼', '사', '오', '육', '칠', '팔', '구'];

    if (num === 0) return '영';

    let result = '';

    // 간단한 변환 로직
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

// 맞춤법 및 띄어쓰기 오류 목록 - 종합판
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

    // 조사/어미 띄어쓰기 오류들 (편람 기준)
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
    { wrong: "재교육을", correct: "재교육을", type: "spacing" },

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
    { wrong: "계약 체결후", correct: "계약 체결 후", type: "spacing" },
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

    // 공문서 특수 표현 띄어쓰기 오류들
    { wrong: "위호와 관련", correct: "위 호와 관련하여", type: "spacing" },
    { wrong: "관련 하여", correct: "관련하여", type: "spacing" },
    { wrong: "대하 여", correct: "대하여", type: "spacing" },
    { wrong: "의하 여", correct: "의하여", type: "spacing" },

    // 단위/숫자 띄어쓰기 오류들
    { wrong: "1 개", correct: "1개", type: "spacing" },
    { wrong: "2 개", correct: "2개", type: "spacing" },
    { wrong: "1 부", correct: "1부", type: "spacing" },
    { wrong: "2 부", correct: "2부", type: "spacing" },
    { wrong: "1 명", correct: "1명", type: "spacing" },
    { wrong: "2 명", correct: "2명", type: "spacing" },

    // 존칭 관련 오류들
    { wrong: "교육장님", correct: "교육장", type: "spelling" },
    { wrong: "교장선생님", correct: "교장", type: "spelling" },
    { wrong: "교장님", correct: "교장", type: "spelling" },

    // 기관명 오류들
    { wrong: "의정부교육청", correct: "경기도의정부교육지원청", type: "spelling" },
    { wrong: "의정부교육지원청", correct: "경기도의정부교육지원청", type: "spelling" }
];

// 항목 기호 순서 정의 (8단계까지) - 정규식 수정
const itemHierarchy = [
    { pattern: /^\s*\d+\./gm, level: 1, name: "1.", example: "1. 2. 3." },      
    { pattern: /^\s*[가나다라마바사아자차카타파하]\./gm, level: 2, name: "가.", example: "가. 나. 다." },   
    { pattern: /^\s*\d+\)/gm, level: 3, name: "1)", example: "1) 2) 3)" },     
    { pattern: /^\s*[가나다라마바사아자차카타파하]\)/gm, level: 4, name: "가)", example: "가) 나) 다)" },   
    { pattern: /^\s*\(\d+\)/gm, level: 5, name: "(1)", example: "(1) (2) (3)" }, 
    { pattern: /^\s*\([가나다라마바사아자차카타파하]\)/gm, level: 6, name: "(가)", example: "(가) (나) (다)" },
    { pattern: /^\s*[ⓛ②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳]/gm, level: 7, name: "ⓛ", example: "ⓛ ② ③" },        
    { pattern: /^\s*[㉮㉯㉰㉱㉲㉳㉴㉵㉶㉷㉸㉹㉺㉻]/gm, level: 8, name: "㉮", example: "㉮ ㉯ ㉰" }         
];

// 예시 문서 (모든 규칙 적용) - 쌍점 규칙 반영
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

// 한글 문자인지 확인하는 함수
function isKoreanChar(char) {
    const code = char.charCodeAt(0);
    return (code >= 0xAC00 && code <= 0xD7AF); // 한글 완성형 범위
}

// 원 문자인지 확인하는 함수  
function isCircledNumber(char) {
    const circledNumbers = ['ⓛ','②','③','④','⑤','⑥','⑦','⑧','⑨','⑩','⑪','⑫','⑬','⑭','⑮','⑯','⑰','⑱','⑲','⑳'];
    return circledNumbers.includes(char);
}

// 괄호 한글인지 확인하는 함수
function isCircledKorean(char) {
    const circledKoreans = ['㉮','㉯','㉰','㉱','㉲','㉳','㉴','㉵','㉶','㉷','㉸','㉹','㉺','㉻'];
    return circledKoreans.includes(char);
}

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
            console.log('Document type changed to:', documentType);
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

    // 1. 잘못된 항목 기호 형식 검사
    const wrongItemPattern = /^\s*\d+\)\s/gm;
    let match;
    while ((match = wrongItemPattern.exec(text)) !== null) {
        issues.push({
            id: 'wrong-item-symbol-' + match.index,
            type: 'error',
            title: '잘못된 항목 기호',
            description: '1단계 항목은 "1."로 표기해야 합니다. "1)"은 3단계에서 사용합니다.',
            position: match.index,
            original: match[0].trim(),
            suggestion: match[0].replace(')', '.'),
            rule: '공문서 작성 편람 - 항목 표시법'
        });
    }

    // 2. 항목 기호 순서 검사 - 문자별로 직접 확인
    const lines = text.split('\n');
    let currentLevel = 0;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        let detectedLevel = 0;
        let itemType = '';

        // 각 레벨 확인
        if (/^\s*\d+\./gm.test(line)) {
            detectedLevel = 1;
            itemType = '1.';
        } else if (/^\s*[가나다라마바사아자차카타파하]\./gm.test(line)) {
            detectedLevel = 2;
            itemType = '가.';
        } else if (/^\s*\d+\)/gm.test(line)) {
            detectedLevel = 3;
            itemType = '1)';
        } else if (/^\s*[가나다라마바사아자차카타파하]\)/gm.test(line)) {
            detectedLevel = 4;
            itemType = '가)';
        } else if (/^\s*\(\d+\)/gm.test(line)) {
            detectedLevel = 5;
            itemType = '(1)';
        } else if (/^\s*\([가나다라마바사아자차카타파하]\)/gm.test(line)) {
            detectedLevel = 6;
            itemType = '(가)';
        } else if (line.length > 0 && isCircledNumber(line.charAt(0))) {
            detectedLevel = 7;
            itemType = 'ⓛ';
        } else if (line.length > 0 && isCircledKorean(line.charAt(0))) {
            detectedLevel = 8;
            itemType = '㉮';
        }

        if (detectedLevel > 0) {
            if (detectedLevel > currentLevel + 1) {
                issues.push({
                    id: 'item-hierarchy-skip-' + i,
                    type: 'warning',
                    title: '항목 기호 순서 오류',
                    description: `항목 기호는 순차적으로 사용해야 합니다. ${itemType} 앞에 중간 단계가 누락되었습니다.`,
                    position: text.indexOf(line),
                    original: line.split(' ')[0],
                    suggestion: '순차적 항목 기호 사용 (1. → 가. → 1) → 가) → (1) → (가) → ⓛ → ㉮)',
                    rule: '공문서 작성 편람 - 항목 표시법'
                });
            }
            currentLevel = detectedLevel;
        }
    }

    // 3. 항목 기호 뒤 띄어쓰기 검사 - 개별 확인
    const lines2 = text.split('\n');
    for (let i = 0; i < lines2.length; i++) {
        const line = lines2[i];

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
                    id: 'item-no-space-' + text.indexOf(line) + '-' + match.index,
                    type: 'error',
                    title: '항목 기호 띄어쓰기 오류',
                    description: '항목 기호 뒤에 한 칸 띄어써야 합니다.',
                    position: text.indexOf(line) + match.index,
                    original: match[1],
                    suggestion: match[1] + ' ',
                    rule: '공문서 작성 편람 - 항목 표시법'
                });
            }
        }

        // 원문자, 괄호 한글 확인
        if (line.length >= 2) {
            const firstChar = line.charAt(0);
            const secondChar = line.charAt(1);

            if ((isCircledNumber(firstChar) || isCircledKorean(firstChar)) && secondChar !== ' ') {
                issues.push({
                    id: 'circle-no-space-' + text.indexOf(line),
                    type: 'error',
                    title: '항목 기호 띄어쓰기 오류',
                    description: '항목 기호 뒤에 한 칸 띄어써야 합니다.',
                    position: text.indexOf(line),
                    original: firstChar,
                    suggestion: firstChar + ' ',
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

    // 1. 괄호 없는 금액
    const noBracketPattern = /(금|총)\d{1,3}(,\d{3})*원(?!\()/g;
    let noBracketMatch;
    while ((noBracketMatch = noBracketPattern.exec(text)) !== null) {
        const amount = noBracketMatch[0];
        const numStr = amount.replace(/[금총원,]/g, '');
        const num = parseInt(numStr);
        const koreanNum = numberToKorean(num);

        issues.push({
            id: 'money-no-bracket-' + noBracketMatch.index,
            type: 'error',
            title: '금액 표기법 오류',
            description: '금액 뒤에 괄호 안에 한글 표기가 필요합니다.',
            position: noBracketMatch.index,
            original: amount,
            suggestion: amount + '(금' + koreanNum + '원)',
            rule: '행정업무운영 편람 - 금액 표기법'
        });
    }

    // 2. 쉼표 없는 큰 금액
    const noCommaPattern = /(금|총)\d{4,}원/g;
    let noCommaMatch;
    while ((noCommaMatch = noCommaPattern.exec(text)) !== null) {
        const amount = noCommaMatch[0];
        const numStr = amount.replace(/[금총원]/g, '');
        const num = parseInt(numStr);
        const formattedNum = num.toLocaleString();
        const koreanNum = numberToKorean(num);

        issues.push({
            id: 'money-no-comma-' + noCommaMatch.index,
            type: 'error',
            title: '금액 천단위 쉼표 누락',
            description: '1000원 이상의 금액에는 천단위 쉼표를 사용해야 합니다.',
            position: noCommaMatch.index,
            original: amount,
            suggestion: amount.replace(/\d+/, formattedNum) + '(금' + koreanNum + '원)',
            rule: '행정업무운영 편람 - 금액 표기법'
        });
    }

    // 3. 일반 숫자만 있는 금액
    const plainNumberPattern = /(?<![금총])\b\d{1,3}(,\d{3})*원(?!\()/g;
    let plainMatch;
    while ((plainMatch = plainNumberPattern.exec(text)) !== null) {
        const amount = plainMatch[0];
        const numStr = amount.replace(/원/g, '');
        const num = parseInt(numStr.replace(/,/g, ''));
        const koreanNum = numberToKorean(num);

        if (num >= 1000) {
            issues.push({
                id: 'money-plain-number-' + plainMatch.index,
                type: 'warning',
                title: '금액 표기법 개선 제안',
                description: '공문서 금액은 "금" 표시와 한글 표기를 함께 사용하는 것이 좋습니다.',
                position: plainMatch.index,
                original: amount,
                suggestion: '금' + amount + '(금' + koreanNum + '원)',
                rule: '행정업무운영 편람 - 금액 표기법'
            });
        }
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

    // 오전/오후 표기 검사
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

    currentValidationResults.errors.push(...issues.filter(i => i.type === 'error'));
    currentValidationResults.warnings.push(...issues.filter(i => i.type === 'warning'));
}

// 붙임 및 관련 표기법 검사
function checkAttachmentFormat(text) {
    const issues = [];

    // 1. 붙임 앞 띄어쓰기 검사
    const attachmentSpacePattern = /\s+붙임/g;
    let spaceMatch;
    while ((spaceMatch = attachmentSpacePattern.exec(text)) !== null) {
        issues.push({
            id: 'attachment-space-' + spaceMatch.index,
            type: 'error',
            title: '붙임 앞 띄어쓰기 오류',
            description: '붙임 앞은 띄어쓰기하지 않습니다.',
            position: spaceMatch.index,
            original: spaceMatch[0] + '붙임',
            suggestion: '붙임',
            rule: '공문서 작성 편람 - 붙임 표기법'
        });
    }

    // 2. 붙임 뒤 띄어쓰기 검사 (2칸 필요)
    const attachmentAfterPattern = /붙임(?!\s\s)/g;
    let afterMatch;
    while ((afterMatch = attachmentAfterPattern.exec(text)) !== null) {
        // 붙임 다음에 숫자가 바로 오는 경우 체크
        const nextChar = text.charAt(afterMatch.index + 2);
        if (nextChar && nextChar !== ' ') {
            issues.push({
                id: 'attachment-after-space-' + afterMatch.index,
                type: 'error',
                title: '붙임 뒤 띄어쓰기 오류',
                description: '붙임 뒤에 2칸 띄어써야 합니다.',
                position: afterMatch.index,
                original: '붙임',
                suggestion: '붙임  ',
                rule: '공문서 작성 편람 - 붙임 표기법'
            });
        }
    }

    // 3. 관련 표기법 검사 (단일/복수)
    const relatedPattern = /\d+\.\s*관련\s*:/g;
    let relatedMatch;
    while ((relatedMatch = relatedPattern.exec(text)) !== null) {
        const beforeText = text.substring(0, relatedMatch.index);
        const afterText = text.substring(relatedMatch.index);

        // 다음 줄에 가. 나. 다. 형태가 있는지 확인
        const multipleRelatedPattern = /관련\s*:\s*[\s\S]*?\n\s*가\./;
        if (multipleRelatedPattern.test(afterText)) {
            issues.push({
                id: 'related-format-' + relatedMatch.index,
                type: 'warning',
                title: '관련 표기법 개선 제안',
                description: '관련 근거가 두 개 이상인 경우 "가. 나. 다." 순으로 작성하세요.',
                position: relatedMatch.index,
                original: relatedMatch[0],
                suggestion: '관련 표기를 "가. 나. 다." 형식으로 분리',
                rule: '공문서 작성 편람 - 관련 표기법'
            });
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

    // '등' 사용 검사 (두 개 이상일 때만)
    const etcPattern = /([가-힣]+)\s+등/g;
    let etcMatch;
    while ((etcMatch = etcPattern.exec(text)) !== null) {
        const beforeText = text.substring(Math.max(0, etcMatch.index - 50), etcMatch.index);
        // 쉼표나 다른 항목이 있는지 간단히 확인
        if (!beforeText.includes(',') && !beforeText.includes('및')) {
            issues.push({
                id: 'etc-usage-' + etcMatch.index,
                type: 'warning',
                title: '"등" 사용법 주의',
                description: '열거하는 단어가 두 개 이상인 경우에만 "등"을 사용합니다.',
                position: etcMatch.index,
                original: etcMatch[0],
                suggestion: '두 개 이상 열거 후 "등" 사용',
                rule: '공문서 작성 편람 - 열거법'
            });
        }
    }

    issues.forEach(issue => {
        if (issue.type === 'error') {
            currentValidationResults.errors.push(issue);
        } else {
            currentValidationResults.warnings.push(issue);
        }
    });
}

// 쌍점 및 문장부호 검사 - 수정된 로직
function checkPunctuationFormat(text) {
    const issues = [];

    // 1. 쌍점 뒤 띄어쓰기 검사 (시간 표기 제외, 뒤에 띄어쓰기 없는 경우만 오류)
    // 시간 표기가 아닌 쌍점에 대해서만 검사 (09:00, 13:30 등 제외)
    const generalColonPattern = /:(?![0-9])/g;  // 뒤에 숫자가 오지 않는 쌍점
    let colonMatch;
    while ((colonMatch = generalColonPattern.exec(text)) !== null) {
        const nextChar = text.charAt(colonMatch.index + 1);

        // 쌍점 뒤에 공백이 없고 문자가 바로 오는 경우만 오류
        if (nextChar && nextChar !== ' ' && nextChar !== '\n' && nextChar !== '\t') {
            issues.push({
                id: 'colon-spacing-' + colonMatch.index,
                type: 'warning',
                title: '쌍점 띄어쓰기 오류',
                description: '쌍점(:) 뒤에 한 칸 띄어써야 합니다.',
                position: colonMatch.index,
                original: ':' + nextChar,
                suggestion: ': ' + nextChar,
                rule: '공문서 작성 편람 - 쌍점 표기법'
            });
        }
    }

    // 2. 쉼표 뒤 띄어쓰기 검사
    const commaPattern = /,([^\s\d])/g;
    let commaMatch;
    while ((commaMatch = commaPattern.exec(text)) !== null) {
        issues.push({
            id: 'comma-spacing-' + commaMatch.index,
            type: 'warning',
            title: '쉼표 띄어쓰기 오류',
            description: '쉼표(,) 뒤에 한 칸 띄어써야 합니다.',
            position: commaMatch.index,
            original: ',' + commaMatch[1],
            suggestion: ', ' + commaMatch[1],
            rule: '공문서 작성 편람'
        });
    }

    // 3. 괄호 앞 불필요한 띄어쓰기
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
        currentValidationResults.errors.push(...issues);
        return;
    }

    if (trimmedText.endsWith('.  끝.')) {
        return;
    }

    let errorFound = false;

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
    } else if (trimmedText.endsWith('.끝.')) {
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
    } else if (trimmedText.endsWith('. 끝.')) {
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

    const allIssues = [
        ...currentValidationResults.errors,
        ...currentValidationResults.warnings
    ];

    allIssues.sort((a, b) => b.position - a.position);

    allIssues.forEach(issue => {
        if (issue.original && issue.suggestion && 
            issue.original !== '없음' && issue.original !== '현재 형식' &&
            !issue.suggestion.includes('확인 필요') &&
            !issue.suggestion.includes('순차적') &&
            !issue.suggestion.includes('분리')) {
            corrected = corrected.replace(issue.original, issue.suggestion);
        }
    });

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
                ${issue.suggestion && !issue.suggestion.includes('확인 필요') && !issue.suggestion.includes('순차적') && !issue.suggestion.includes('분리') ? `
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

    if (issue.id.includes('ending')) {
        if (issue.id === 'ending-missing') {
            currentText = currentText.trim() + '.  끝.';
        } else {
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
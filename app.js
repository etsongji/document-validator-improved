console.log('App.js loaded successfully');

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded');
    
    const validateBtn = document.getElementById('validateBtn');
    if (validateBtn) {
        validateBtn.addEventListener('click', function() {
            alert('버튼이 작동합니다!');
        });
        console.log('Validate button found and event added');
    } else {
        console.error('Validate button not found');
    }
});

// App State
const state = {
    isAuthenticated: false,
    currentUser: null,
    currentView: 'landing-view',
    hasUploadedDoc: false,
    isTelugu: false,
    chatOpen: false
};

// Elements
const views = document.querySelectorAll('.view');
const nav = document.getElementById('main-nav');
const overlay = document.getElementById('overlay');
const chatSidebar = document.getElementById('chat-sidebar');

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    // Set date in dashboard
    const dateOpts = { year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('current-date').textContent = new Date().toLocaleDateString('en-US', dateOpts);
});

const app = {
    // Navigation
    navigateTo(viewId) {
        // Hide all views
        views.forEach(view => {
            view.classList.remove('active');
            setTimeout(() => { if (!view.classList.contains('active')) view.style.display = 'none'; }, 300);
        });

        // Show target view
        const targetView = document.getElementById(viewId);
        targetView.style.display = 'flex';
        setTimeout(() => targetView.classList.add('active'), 10);

        state.currentView = viewId;

        // Manage nav bar visibility
        if (viewId === 'landing-view' || viewId === 'auth-view') {
            nav.style.display = 'none';
        } else {
            nav.style.display = 'flex';
        }

        // Initialize chart if entering dashboard
        if (viewId === 'dashboard-view') {
            this.initChart();
        }
    },

    // Authentication
    switchAuthTab(tab) {
        document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
        const isRegister = tab === 'register';

        if (isRegister) {
            document.querySelectorAll('.auth-tab')[1].classList.add('active');
            document.getElementById('name-group').style.display = 'block';
            document.getElementById('auth-submit-btn').textContent = 'Create Account';
        } else {
            document.querySelectorAll('.auth-tab')[0].classList.add('active');
            document.getElementById('name-group').style.display = 'none';
            document.getElementById('auth-submit-btn').textContent = 'Sign In';
        }
    },

    login() {
        // Simulate login
        const btn = document.getElementById('auth-submit-btn');
        const origText = btn.textContent;
        btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Authenticating...';
        btn.disabled = true;

        setTimeout(() => {
            state.isAuthenticated = true;
            btn.textContent = origText;
            btn.disabled = false;
            this.navigateTo('upload-view');
        }, 1200);
    },

    logout() {
        state.isAuthenticated = false;
        state.hasUploadedDoc = false;
        if (state.chatOpen) this.toggleChat();
        this.navigateTo('landing-view');
    },

    // File Upload Simulation
    handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        if (files.length) {
            this.processFile(files[0]);
        }
    },

    handleFileSelect(e) {
        const files = e.target.files;
        if (files.length) {
            this.processFile(files[0]);
        }
    },

    async processFile(file) {
        if (file.type !== "application/pdf") {
            alert("Please upload a valid PDF document.");
            return;
        }

        // UI Updates for upload
        document.getElementById('drop-zone').style.display = 'none';
        document.getElementById('selected-file-name').textContent = file.name;

        const progressContainer = document.getElementById('upload-progress');
        const progressFill = document.getElementById('progress-fill');
        const progressStatus = document.getElementById('progress-status');

        progressContainer.style.display = 'block';
        progressStatus.textContent = "Extracting text... 10%";
        progressFill.style.width = '10%';

        try {
            // 1. Extract Text from PDF
            const documentText = await this.extractTextFromPDF(file);
            
            progressStatus.textContent = "Analyzing legal risks... 50%";
            progressFill.style.width = '50%';

            // 2. Send to Backend API — auto-detect Vercel vs local
            const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
                ? 'http://localhost:5000/api/analyze'
                : '/api/analyze';

            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ documentText })
            });

            if (!response.ok) {
                throw new Error('Analysis failed');
            }

            const analysisData = await response.json();
            
            progressStatus.textContent = "Analysis Complete!";
            progressFill.style.width = '100%';

            // Store data for UI updates
            state.analysisData = analysisData;
            state.documentName = file.name;

            setTimeout(() => {
                this.updateDashboardUI(analysisData);
                this.navigateTo('dashboard-view');
                
                // Reset upload view
                setTimeout(() => {
                    document.getElementById('drop-zone').style.display = 'block';
                    progressContainer.style.display = 'none';
                    progressFill.style.width = '0%';
                    progressStatus.textContent = "Uploading... 0%";
                }, 1000);
            }, 800);

        } catch (error) {
            console.error(error);
            alert("Error analyzing document. Make sure the backend server and Gemini API key are configured.");
            document.getElementById('drop-zone').style.display = 'block';
            progressContainer.style.display = 'none';
        }
    },

    async extractTextFromPDF(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async function() {
                try {
                    const typedarray = new Uint8Array(this.result);
                    const pdf = await pdfjsLib.getDocument(typedarray).promise;
                    let fullText = "";
                    for (let i = 1; i <= pdf.numPages; i++) {
                        const page = await pdf.getPage(i);
                        const textContent = await page.getTextContent();
                        const pageText = textContent.items.map(item => item.str).join(" ");
                        fullText += pageText + "\n";
                    }
                    resolve(fullText);
                } catch (err) {
                    reject(err);
                }
            };
            reader.readAsArrayBuffer(file);
        });
    },

    updateDashboardUI(data) {
        document.querySelector('.doc-title').innerHTML = `<i class="fa-regular fa-file-lines"></i> ${state.documentName}`;
        
        // Update Chart Data
        state.chartData = [
            data.risk_score.high_risk_percentage || 0,
            data.risk_score.moderate_percentage || 0,
            data.risk_score.safe_percentage || 0
        ];
        
        // Update Score UI
        const scoreElement = document.querySelector('.risk-score');
        const calculatedScore = Math.round(data.risk_score.high_risk_percentage + (data.risk_score.moderate_percentage * 0.5));
        scoreElement.textContent = `${calculatedScore}%`;
        
        // Update Summary
        document.querySelector('.summary-text').innerHTML = data.summary;

        // Clear and rebuild English Insights List
        const listEn = document.getElementById('insights-list-en');
        listEn.innerHTML = '';
        
        if (data.risks && data.risks.length > 0) {
            data.risks.forEach(risk => {
                let badgeClass = 'success-bg';
                let iconClass = 'fa-check-circle';
                let riskClass = 'risk-safe';
                
                if (risk.risk_level.toLowerCase().includes('high')) {
                    badgeClass = 'danger-bg';
                    iconClass = 'fa-triangle-exclamation';
                    riskClass = 'risk-high';
                } else if (risk.risk_level.toLowerCase().includes('moderate')) {
                    badgeClass = 'warning-bg';
                    iconClass = 'fa-circle-exclamation';
                    riskClass = 'risk-moderate';
                }

                const itemHTML = `
                    <div class="insight-item ${riskClass}">
                        <div class="insight-icon"><i class="fa-solid ${iconClass}"></i></div>
                        <div class="insight-content">
                            <h4>${risk.risk_level} Risk</h4>
                            <p class="original-text">"${this.escapeHTML(risk.clause)}"</p>
                            <p class="simple-text"><strong>Why it's risky:</strong> ${this.escapeHTML(risk.reason)}</p>
                            <p class="simple-text text-primary" style="margin-top:0.5rem"><strong>Suggestion:</strong> ${this.escapeHTML(risk.suggestion || '')}</p>
                        </div>
                        <div class="badge ${badgeClass}">${risk.risk_level}</div>
                    </div>
                `;
                listEn.insertAdjacentHTML('beforeend', itemHTML);
            });
        }
    },

    // Chart.js Initialization
    initChart() {
        const ctx = document.getElementById('riskChart');
        if (this.chartInstance) {
            this.chartInstance.destroy();
        }

        Chart.defaults.color = '#94a3b8';
        Chart.defaults.font.family = "'Inter', sans-serif";

        this.chartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['High Risk', 'Moderate', 'Safe'],
                datasets: [{
                    data: state.chartData || [30, 40, 30],
                    backgroundColor: [
                        '#ef4444', // Danger
                        '#f59e0b', // Warning
                        '#10b981'  // Success
                    ],
                    borderWidth: 0,
                    hoverOffset: 4,
                    cutout: '75%'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false // Using custom HTML legend
                    },
                    tooltip: {
                        backgroundColor: 'rgba(15, 23, 42, 0.9)',
                        titleFont: { size: 14, family: "'Outfit', sans-serif" },
                        bodyFont: { size: 14 },
                        padding: 12,
                        cornerRadius: 8,
                        displayColors: true
                    }
                },
                animation: {
                    animateScale: true,
                    animateRotate: true,
                    duration: 1500,
                    easing: 'easeOutQuart'
                }
            }
        });
    },

    // Translation Logic
    toggleLanguage() {
        state.isTelugu = !state.isTelugu;
        const langEnLabel = document.getElementById('lang-en');
        const langTeLabel = document.getElementById('lang-te');
        const listEn = document.getElementById('insights-list-en');
        const listTe = document.getElementById('insights-list-te');

        if (state.isTelugu) {
            langEnLabel.classList.remove('active');
            langTeLabel.classList.add('active');
            listEn.style.display = 'none';
            listTe.style.display = 'flex';
        } else {
            langEnLabel.classList.add('active');
            langTeLabel.classList.remove('active');
            listEn.style.display = 'flex';
            listTe.style.display = 'none';
        }
    },

    // Chat Sidebar Logic
    toggleChat() {
        state.chatOpen = !state.chatOpen;
        if (state.chatOpen) {
            chatSidebar.classList.add('open');
            overlay.classList.add('active');
            setTimeout(() => document.getElementById('chat-input').focus(), 300);
        } else {
            chatSidebar.classList.remove('open');
            overlay.classList.remove('active');
        }
    },

    sendChatMessage() {
        const input = document.getElementById('chat-input');
        const message = input.value.trim();
        if (!message) return;

        // Add user message to UI
        const messagesContainer = document.getElementById('chat-messages');
        const userMsgHTML = `
            <div class="message user">
                <div class="msg-content">${this.escapeHTML(message)}</div>
            </div>
        `;
        messagesContainer.insertAdjacentHTML('beforeend', userMsgHTML);
        input.value = '';
        this.scrollToBottom();

        // Show typing indicator
        const typingId = 'typing-' + Date.now();
        const typingHTML = `
            <div class="message system" id="${typingId}">
                <div class="msg-content">
                    <div class="typing-indicator">
                        <span></span><span></span><span></span>
                    </div>
                </div>
            </div>
        `;
        messagesContainer.insertAdjacentHTML('beforeend', typingHTML);
        this.scrollToBottom();

        // Simulate AI response
        setTimeout(() => {
            document.getElementById(typingId).remove();

            let response = "I'm analyzing that specific clause for you. Generally, it means you should be cautious about sharing any proprietary data outside your organization.";

            if (message.toLowerCase().includes('safe')) {
                response = "Overall, the document has a 70% risk score, which is moderately high. The primary danger lies in the Indemnity Clause (Section 4.2). I recommend negotiating that term before signing.";
            } else if (message.toLowerCase().includes('risk')) {
                response = "Your main risks are: 1. Uncapped Indemnity Liability (Sec 4.2) and 2. A strict 24-month Non-compete (Sec 6).";
            }

            const sysMsgHTML = `
                <div class="message system">
                    <div class="msg-content">${response}</div>
                </div>
            `;
            messagesContainer.insertAdjacentHTML('beforeend', sysMsgHTML);
            this.scrollToBottom();
        }, 1500);
    },

    scrollToBottom() {
        const container = document.getElementById('chat-messages');
        container.scrollTop = container.scrollHeight;
    },

    escapeHTML(str) {
        return str.replace(/[&<>'"]/g,
            tag => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                "'": '&#39;',
                '"': '&quot;'
            }[tag] || tag)
        );
    },

    // Utilities
    downloadReport() {
        const btn = document.querySelector('.dashboard-actions .btn-secondary');
        const origHtml = btn.innerHTML;
        btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Generating PDF...';

        setTimeout(() => {
            btn.innerHTML = '<i class="fa-solid fa-check"></i> Downloaded';
            setTimeout(() => btn.innerHTML = origHtml, 2000);

            // In a real app, this would trigger a download.
            // alert("Report generation complete. The PDF download would begin now.");
        }, 1500);
    }
};

// Start by setting the first label active
document.getElementById('lang-en').classList.add('active');

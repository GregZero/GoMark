// ===== Debug/Logging Module =====
// Centralized logging system for GoMark

class DebugLogger {
    constructor() {
        this.logs = [];
        this.maxLogs = 1000; // Keep last 1000 logs
        this.loadLogsFromStorage();
        
        // Log initialization
        this.log('DebugLogger initialized');
    }
    
    loadLogsFromStorage() {
        try {
            const savedLogs = localStorage.getItem('gomark_debug_logs');
            if (savedLogs) {
                this.logs = JSON.parse(savedLogs);
                this.log(`Loaded ${this.logs.length} logs from storage`);
            }
        } catch (error) {
            this.log(`Error loading logs: ${error.message}`, 'error');
        }
    }
    
    saveLogsToStorage() {
        try {
            localStorage.setItem('gomark_debug_logs', JSON.stringify(this.logs));
        } catch (error) {
            console.error('Error saving logs:', error);
        }
    }
    
    log(message, level = 'info', data = null) {
        const timestamp = new Date().toISOString();
        const logEntry = { timestamp, level, message, data };
        
        // Add to array
        this.logs.push(logEntry);
        
        // Trim if too many
        if (this.logs.length > this.maxLogs) {
            this.logs = this.logs.slice(-this.maxLogs);
        }
        
        // Save to storage
        this.saveLogsToStorage();
        
        // Also output to console
        const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
        if (data) {
            console.log(prefix, message, data);
        } else {
            console.log(prefix, message);
        }
        
        // Update UI if debug panel is open
        if (window.debugPanel) {
            window.debugPanel.updateLogs();
        }
    }
    
    info(message, data = null) {
        this.log(message, 'info', data);
    }
    
    warn(message, data = null) {
        this.log(message, 'warn', data);
    }
    
    error(message, data = null) {
        this.log(message, 'error', data);
    }
    
    getLogs() {
        return [...this.logs];
    }
    
    clearLogs() {
        this.logs = [];
        localStorage.removeItem('gomark_debug_logs');
        this.log('Logs cleared');
    }
    
    exportLogs() {
        const dataStr = JSON.stringify(this.logs, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `gomark-debug-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        this.log('Logs exported');
    }
}

// Create global instance
const debugLogger = new DebugLogger();
window.debugLogger = debugLogger;

// Debug Panel UI
class DebugPanel {
    constructor() {
        this.createPanel();
        this.updateLogs();
        window.debugPanel = this;
    }
    
    createPanel() {
        const panel = document.createElement('div');
        panel.id = 'debugPanel';
        panel.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 20px;
            width: 350px;
            max-height: 400px;
            background: white;
            border: 2px solid #f44336;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            z-index: 9999;
            display: none;
            overflow: hidden;
        `;
        
        panel.innerHTML = `
            <div style="background: #f44336; color: white; padding: 10px; font-weight: bold; cursor: move;" id="debugPanelHeader">
                9104DD Journal de Debug (${debugLogger.getLogs().length} logs)
                <button style="float: right; background: none; border: none; color: white; cursor: pointer;" onclick="debugLogger.clearLogs(); debugPanel.updateLogs();">5D1</button>
            </div>
            <div style="padding: 10px; height: calc(100% - 100px); overflow-y: auto; font-family: monospace; font-size: 11px;" id="debugLogsContainer"></div>
            <div style="padding: 10px; background: #f5f5f5; border-top: 1px solid #ddd; display: flex; gap: 5px;">
                <button class="btn btn-danger" onclick="debugLogger.clearLogs(); debugPanel.updateLogs();" style="flex: 1;">Effacer</button>
                <button class="btn btn-info" onclick="debugLogger.exportLogs();" style="flex: 1;">Exporter</button>
                <button class="btn btn-secondary" onclick="debugPanel.toggle();" style="flex: 1;">Fermer</button>
            </div>
        `;
        
        document.body.appendChild(panel);
        
        // Make draggable
        let isDragging = false;
        let offsetX, offsetY;
        
        document.getElementById('debugPanelHeader').addEventListener('mousedown', (e) => {
            isDragging = true;
            offsetX = e.clientX - panel.getBoundingClientRect().left;
            offsetY = e.clientY - panel.getBoundingClientRect().top;
            e.preventDefault();
        });
        
        document.addEventListener('mousemove', (e) => {
            if (isDragging) {
                panel.style.left = (e.clientX - offsetX) + 'px';
                panel.style.top = (e.clientY - offsetY) + 'px';
            }
        });
        
        document.addEventListener('mouseup', () => {
            isDragging = false;
        });
    }
    
    toggle() {
        const panel = document.getElementById('debugPanel');
        if (panel.style.display === 'none') {
            panel.style.display = 'block';
            this.updateLogs();
        } else {
            panel.style.display = 'none';
        }
    }
    
    updateLogs() {
        const container = document.getElementById('debugLogsContainer');
        const logs = debugLogger.getLogs();
        
        // Update header count
        document.querySelector('#debugPanelHeader').textContent = 
            `\u001F910\u001F4DD Journal de Debug (${logs.length} logs)`;
        
        if (logs.length === 0) {
            container.innerHTML = '<div style="color: #999;">Aucun log disponible</div>';
            return;
        }
        
        let html = '';
        logs.slice().reverse().forEach(log => {
            const color = {
                'info': '#2196F3',
                'warn': '#FF9800',
                'error': '#F44336'
            }[log.level] || '#666';
            
            const time = new Date(log.timestamp).toLocaleTimeString();
            html += `
                <div style="padding: 5px; border-bottom: 1px solid #eee; color: ${color};">
                    <span style="font-weight: bold;">[${time}]</span> 
                    <span style="color: ${color};">${log.level.toUpperCase()}</span>: 
                    ${this.escapeHtml(log.message)}
                    ${log.data ? `<br><pre style="margin-top: 5px; font-size: 10px; color: #666;">${this.escapeHtml(JSON.stringify(log.data))}</pre>` : ''}
                </div>
            `;
        });
        
        container.innerHTML = html;
        container.scrollTop = container.scrollHeight;
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize debug panel (but don't show it yet)
let debugPanel = null;

function initDebug() {
    if (!debugPanel) {
        debugPanel = new DebugPanel();
    }
    return debugPanel;
}

// Add debug button to UI
function addDebugButton() {
    const btn = document.createElement('button');
    btn.className = 'btn btn-danger';
    btn.innerHTML = '\u001F41E Bug';
    btn.id = 'debugBtn';
    btn.style.cssText = 'margin-left: auto;';
    btn.onclick = () => {
        if (!debugPanel) {
            initDebug();
        }
        debugPanel.toggle();
    };
    
    // Add to header or toolbar
    const toolbar = document.querySelector('.container > div:first-child');
    if (toolbar) {
        toolbar.appendChild(btn);
    }
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', addDebugButton);
} else {
    setTimeout(addDebugButton, 100);
}

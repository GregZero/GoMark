// ===== GoMark Application =====
// Gestionnaire de cartes de fidélité et listes de courses

// Inject CSS
function injectCSS() {
    const style = document.createElement('style');
    style.textContent = `
        :root {
            --primary-color: #4CAF50;
            --primary-dark: #45a049;
            --background-color: #f5f5f5;
            --card-bg: #ffffff;
            --text-color: #333333;
            --text-light: #666666;
            --border-color: #dddddd;
            --danger-color: #f44336;
            --info-color: #2196F3;
        }
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
        body { background-color: var(--background-color); color: var(--text-color); line-height: 1.6; }
        header { background: linear-gradient(135deg, var(--primary-color), var(--primary-dark)); color: white; padding: 20px; text-align: center; box-shadow: 0 2px 10px rgba(0,0,0,0.2); }
        header h1 { font-size: 24px; }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .btn { padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; font-size: 14px; margin: 5px; }
        .btn-primary { background-color: var(--primary-color); color: white; }
        .btn-secondary { background-color: #6c757d; color: white; }
        .btn-danger { background-color: var(--danger-color); color: white; }
        .btn-info { background-color: var(--info-color); color: white; }
        .card { background: white; border: 1px solid var(--border-color); border-radius: 8px; padding: 15px; margin: 10px 0; }
        .empty-state { text-align: center; padding: 40px; color: var(--text-light); }
        .modal { display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1000; }
        .modal.active { display: flex; justify-content: center; align-items: center; }
        .modal-content { background: white; padding: 25px; border-radius: 8px; width: 90%; max-width: 600px; max-height: 80vh; overflow-y: auto; }
        .form-group { margin-bottom: 15px; }
        .form-group label { display: block; margin-bottom: 5px; font-weight: 500; }
        .form-group input, .form-group select, .form-group textarea { width: 100%; padding: 10px; border: 1px solid var(--border-color); border-radius: 4px; }
        .toast { position: fixed; bottom: 20px; right: 20px; padding: 15px 25px; border-radius: 8px; color: white; z-index: 2000; }
        .toast.success { background-color: var(--primary-color); }
        .toast.error { background-color: var(--danger-color); }
    `;
    document.head.appendChild(style);
}

// Global variables
let storage = null;
let loyaltyCards = null;
let shoppingLists = null;
let barcodeScanner = null;

// Initialize application
async function init() {
    injectCSS();
    
    try {
        // Initialize modules
        storage = new StorageManager();
        loyaltyCards = new LoyaltyCardManager(storage);
        shoppingLists = new ShoppingListManager(storage);
        barcodeScanner = new BarcodeScanner(handleBarcodeScanned);
        
        // Make barcodeScanner available globally for modules
        window.barcodeScanner = barcodeScanner;
        
        // Load data
        await loyaltyCards.load();
        await shoppingLists.load();
        
        // Build UI
        buildUI();
        setupEventListeners();
        
        // Render data
        renderAll();
        
        // Update folder display
        updateSelectedFolderDisplay();
        
        showToast('GoMark est prêt!', 'success');
        
    } catch (error) {
        console.error('Initialization error:', error);
        showToast('Erreur: ' + error.message, 'error');
    }
}

// Build the UI
function buildUI() {
    document.body.innerHTML = `
        <header>
            <h1>🛒 GoMark</h1>
            <p>Gestionnaire de cartes de fidélité et listes de courses</p>
        </header>
        <div class="container">
            <div style="margin: 20px 0; display: flex; gap: 10px; flex-wrap: wrap; align-items: center;">
                <button class="btn btn-info" id="selectFolderBtn">📁 Choisir dossier</button>
                <button class="btn btn-secondary" id="refreshBtn">🔄 Rafraîchir</button>
                <button class="btn btn-secondary" id="addTestDataBtn">🧪 Données de test</button>
                <span id="selectedFolderDisplay" style="margin-left: 10px; font-size: 14px;"></span>
            </div>
            
            <div style="margin: 20px 0;">
                <button class="btn btn-primary" id="scanCardBtn">📷 Scanner une carte</button>
                <button class="btn btn-secondary" id="addCardBtn">➕ Ajouter carte</button>
                <button class="btn btn-primary" id="newListBtn">➕ Nouvelle liste</button>
                <button class="btn btn-danger" id="cancelScanBtn" style="display: none;">❌ Annuler scan</button>
            </div>
            
            <h2>💳 Cartes de fidélité</h2>
            <div id="cardsContainer" class="empty-state">Aucune carte. Scanner ou ajouter une carte.</div>
            
            <h2 style="margin-top: 30px;">🛒 Listes de courses</h2>
            <div id="listsContainer" class="empty-state">Aucune liste. Créez-en une.</div>
            
            <h2 style="margin-top: 30px;">📊 Historique</h2>
            <div id="historyContainer" class="empty-state">Aucun historique.</div>
        </div>
        
        <!-- Modals -->
        <div id="cardModal" class="modal">
            <div class="modal-content">
                <h2 id="cardModalTitle">Ajouter une carte</h2>
                <form id="cardForm">
                    <input type="hidden" id="cardId">
                    <div class="form-group"><label>Magasin *</label><input type="text" id="cardStore" required></div>
                    <div class="form-group"><label>Numéro de carte *</label><input type="text" id="cardCardId" required></div>
                    <div class="form-group"><label>Type de code-barres</label><select id="cardBarcodeType"><option value="CODE_128">CODE_128</option><option value="EAN_13">EAN_13</option><option value="QR_CODE">QR_CODE</option></select></div>
                    <div class="form-group"><label>Note</label><textarea id="cardNote" rows="2"></textarea></div>
                    <div style="display: flex; gap: 10px;"><button type="button" class="btn btn-secondary" id="cancelCardBtn">Annuler</button><button type="submit" class="btn btn-primary">Sauvegarder</button></div>
                </form>
            </div>
        </div>
        
        <div id="listModal" class="modal">
            <div class="modal-content">
                <h2 id="listModalTitle">Nouvelle liste</h2>
                <form id="listForm">
                    <input type="hidden" id="listId">
                    <div class="form-group"><label>Nom de la liste *</label><input type="text" id="listName" required></div>
                    <div class="form-group"><label>Description</label><textarea id="listDescription" rows="2"></textarea></div>
                    <div style="display: flex; gap: 10px;"><button type="button" class="btn btn-secondary" id="cancelListBtn">Annuler</button><button type="submit" class="btn btn-primary">Sauvegarder</button></div>
                </form>
            </div>
        </div>
        
        <div id="productsModal" class="modal">
            <div class="modal-content" style="width: 90%; max-width: 700px;">
                <h2 id="productsModalTitle">Produits</h2>
                <div style="display: flex; gap: 10px; margin-bottom: 20px;">
                    <input type="text" id="productName" placeholder="Nom du produit" style="flex: 2;">
                    <input type="text" id="productQuantity" placeholder="Quantité" style="flex: 1;">
                    <button class="btn btn-primary" id="addProductBtn">➕ Ajouter</button>
                </div>
                <div id="productsList"></div>
            </div>
        </div>
        
        <div id="toastContainer" style="position: fixed; bottom: 20px; right: 20px; z-index: 2000;"></div>
    `;
}

// Setup event listeners
function setupEventListeners() {
    // Select folder
    document.getElementById('selectFolderBtn').addEventListener('click', async () => {
        try {
            const success = await storage.selectDirectory();
            if (success) {
                await refreshData();
                updateSelectedFolderDisplay();
                showToast('Dossier sélectionné!', 'success');
            } else {
                // Ne pas afficher de message si annulé (AbortError est géré dans storage.js)
                // Mais afficher un message si non supporté
                if (!storage.isCapacitor() && !storage.isFileSystemAvailable()) {
                    showToast('Sélection de dossier non supportée sur cet appareil', 'info');
                }
            }
        } catch (error) {
            showToast('Erreur: ' + error.message, 'error');
        }
    });
    
    // Update selected folder display
    function updateSelectedFolderDisplay() {
        const display = document.getElementById('selectedFolderDisplay');
        
        // Sur Android (APK)
        if (storage.isCapacitor()) {
            const path = storage.getDirectoryPath();
            const name = storage.getSelectedDirectoryName();
            if (path) {
                display.textContent = '📁 Dossier: ' + escapeHtml(name || path);
                display.style.color = 'var(--primary-color)';
            } else {
                display.textContent = '⚠️ Sélectionnez un dossier pour Syncthing';
                display.style.color = 'var(--danger-color)';
            }
        }
        // Sur navigateur desktop
        else if (!storage.isFileSystemAvailable()) {
            display.textContent = '📱 Navigateur mobile: stockage local automatique';
            display.style.color = 'var(--info-color)';
        } else if (storage.getSelectedDirectoryName()) {
            display.textContent = '📁 Dossier: ' + escapeHtml(storage.getSelectedDirectoryName());
            display.style.color = 'var(--primary-color)';
        } else {
            display.textContent = '⚠️ Sélectionnez un dossier pour Syncthing';
            display.style.color = 'var(--danger-color)';
        }
    }
    
    // Refresh
    document.getElementById('refreshBtn').addEventListener('click', refreshData);
    
    // Add test data
    document.getElementById('addTestDataBtn').addEventListener('click', addTestData);
    
    // Scan card
    document.getElementById('scanCardBtn').addEventListener('click', scanCard);
    
    // Cancel scan
    document.getElementById('cancelScanBtn').addEventListener('click', () => {
        if (barcodeScanner) {
            barcodeScanner.stop();
        }
        document.getElementById('cancelScanBtn').style.display = 'none';
        document.getElementById('scanCardBtn').disabled = false;
    });
    
    // Add card
    document.getElementById('addCardBtn').addEventListener('click', () => showCardModal());
    
    // New list
    document.getElementById('newListBtn').addEventListener('click', () => showListModal());
    
    // Card modal
    document.getElementById('cancelCardBtn').addEventListener('click', () => document.getElementById('cardModal').classList.remove('active'));
    document.getElementById('cardForm').addEventListener('submit', saveCard);
    
    // List modal
    document.getElementById('cancelListBtn').addEventListener('click', () => document.getElementById('listModal').classList.remove('active'));
    document.getElementById('listForm').addEventListener('submit', saveList);
    
    // Products modal
    document.getElementById('addProductBtn').addEventListener('click', addProduct);
    document.getElementById('productName').addEventListener('keypress', (e) => { if (e.key === 'Enter') { e.preventDefault(); addProduct(); } });
    
    // Close modals on outside click
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.remove('active'); });
    });
}

// Barcode Scanner
function scanCard() {
    try {
        document.getElementById('scanCardBtn').disabled = true;
        document.getElementById('cancelScanBtn').style.display = 'inline-block';
        
        barcodeScanner.scan().then(() => {
            document.getElementById('cancelScanBtn').style.display = 'none';
            document.getElementById('scanCardBtn').disabled = false;
        }).catch(error => {
            document.getElementById('cancelScanBtn').style.display = 'none';
            document.getElementById('scanCardBtn').disabled = false;
            showToast('Erreur de scan: ' + error.message, 'error');
        });
    } catch (error) {
        document.getElementById('cancelScanBtn').style.display = 'none';
        document.getElementById('scanCardBtn').disabled = false;
        showToast('Erreur: ' + error.message, 'error');
    }
}

function handleBarcodeScanned(result) {
    barcodeScanner.stop();
    showCardModal({ cardId: result.text, barcodeType: result.format });
    showToast('Code scanné: ' + result.text, 'success');
}

// Card Management
function showCardModal(cardData = {}) {
    document.getElementById('cardId').value = cardData.id || '';
    document.getElementById('cardStore').value = cardData.store || '';
    document.getElementById('cardCardId').value = cardData.cardId || '';
    document.getElementById('cardBarcodeType').value = cardData.barcodeType || 'CODE_128';
    document.getElementById('cardNote').value = cardData.note || '';
    document.getElementById('cardModalTitle').textContent = cardData.id ? 'Modifier la carte' : 'Ajouter une carte';
    document.getElementById('cardModal').classList.add('active');
    document.getElementById('cardStore').focus();
}

async function saveCard(e) {
    e.preventDefault();
    const cardId = document.getElementById('cardId').value;
    const cardData = {
        store: document.getElementById('cardStore').value,
        cardId: document.getElementById('cardCardId').value,
        barcodeType: document.getElementById('cardBarcodeType').value,
        note: document.getElementById('cardNote').value
    };
    
    try {
        if (cardId) {
            await loyaltyCards.updateCard(parseInt(cardId), cardData);
            showToast('Carte mise à jour!', 'success');
        } else {
            await loyaltyCards.addCard(cardData);
            showToast('Carte ajoutée!', 'success');
        }
        document.getElementById('cardModal').classList.remove('active');
        document.getElementById('cardForm').reset();
        renderCards();
    } catch (error) {
        showToast('Erreur: ' + error.message, 'error');
    }
}

function renderCards() {
    const container = document.getElementById('cardsContainer');
    const cards = loyaltyCards.getAllCards();
    
    if (cards.length === 0) {
        container.className = 'empty-state';
        container.textContent = 'Aucune carte. Scanner ou ajouter une carte.';
        return;
    }
    
    container.className = '';
    container.innerHTML = cards.map(card => `
        <div class="card">
            <h3>${escapeHtml(card.store)}</h3>
            <p><strong>ID:</strong> ${escapeHtml(card.cardId)}</p>
            <p><strong>Type:</strong> ${card.barcodeType}</p>
            ${card.note ? `<p><strong>Note:</strong> ${escapeHtml(card.note)}</p>` : ''}
            <img src="${loyaltyCards.generateBarcode(card.cardId, card.barcodeType)}" alt="Barcode" style="width: 100%; margin: 10px 0;">
            <div style="display: flex; gap: 10px;">
                <button class="btn btn-secondary" onclick="editCard(${card.id})">Modifier</button>
                <button class="btn btn-danger" onclick="deleteCard(${card.id})">Supprimer</button>
            </div>
        </div>
    `).join('');
}

function editCard(cardId) {
    const card = loyaltyCards.getCard(cardId);
    if (card) showCardModal(card);
}

async function deleteCard(cardId) {
    if (confirm('Supprimer cette carte?')) {
        try {
            await loyaltyCards.deleteCard(cardId);
            renderCards();
            showToast('Carte supprimée!', 'success');
        } catch (error) {
            showToast('Erreur: ' + error.message, 'error');
        }
    }
}

// List Management
function showListModal(listData = {}) {
    document.getElementById('listId').value = listData.id || '';
    document.getElementById('listName').value = listData.name || '';
    document.getElementById('listDescription').value = listData.description || '';
    document.getElementById('listModalTitle').textContent = listData.id ? 'Modifier la liste' : 'Nouvelle liste';
    document.getElementById('listModal').classList.add('active');
    document.getElementById('listName').focus();
}

async function saveList(e) {
    e.preventDefault();
    const listId = document.getElementById('listId').value;
    const listData = {
        name: document.getElementById('listName').value,
        description: document.getElementById('listDescription').value
    };
    
    try {
        if (listId) {
            await shoppingLists.updateList(parseInt(listId), listData);
            showToast('Liste mise à jour!', 'success');
        } else {
            const newList = await shoppingLists.addList(listData);
            showToast('Liste créée!', 'success');
        }
        document.getElementById('listModal').classList.remove('active');
        document.getElementById('listForm').reset();
        renderLists();
    } catch (error) {
        showToast('Erreur: ' + error.message, 'error');
    }
}

function renderLists() {
    const container = document.getElementById('listsContainer');
    const lists = shoppingLists.getAllLists();
    
    if (lists.length === 0) {
        container.className = 'empty-state';
        container.textContent = 'Aucune liste. Créez-en une.';
        return;
    }
    
    container.className = '';
    container.innerHTML = lists.map(list => {
        const unchecked = list.items.filter(i => !i.checked).length;
        return `
            <div class="card">
                <h3>${escapeHtml(list.name)}</h3>
                ${list.description ? `<p>${escapeHtml(list.description)}</p>` : ''}
                <p><strong>Articles:</strong> ${list.items.length} (${unchecked} non cochés)</p>
                <div style="display: flex; gap: 10px;">
                    <button class="btn btn-primary" onclick="showProducts(${list.id})">Voir produits</button>
                    <button class="btn btn-secondary" onclick="editList(${list.id})">Modifier</button>
                    <button class="btn btn-danger" onclick="deleteList(${list.id})">Supprimer</button>
                </div>
            </div>
        `;
    }).join('');
}

function editList(listId) {
    const list = shoppingLists.getList(listId);
    if (list) showListModal(list);
}

async function deleteList(listId) {
    if (confirm('Supprimer cette liste?')) {
        try {
            await shoppingLists.deleteList(listId);
            renderLists();
            showToast('Liste supprimée!', 'success');
        } catch (error) {
            showToast('Erreur: ' + error.message, 'error');
        }
    }
}

let currentListId = null;

function showProducts(listId) {
    currentListId = listId;
    const list = shoppingLists.getList(listId);
    document.getElementById('productsModalTitle').textContent = 'Produits: ' + escapeHtml(list.name);
    document.getElementById('productName').value = '';
    document.getElementById('productQuantity').value = '';
    renderProducts(list.items);
    document.getElementById('productsModal').classList.add('active');
    document.getElementById('productName').focus();
}

function renderProducts(items) {
    const container = document.getElementById('productsList');
    
    if (items.length === 0) {
        container.innerHTML = '<p class="empty-state">Aucun produit. Ajoutez-en!</p>';
        return;
    }
    
    container.innerHTML = items.map(item => `
        <div class="card" style="display: flex; align-items: center; gap: 10px;">
            <input type="checkbox" ${item.checked ? 'checked' : ''} 
                   onchange="toggleProductChecked(${currentListId}, ${item.id})">
            <span style="flex: 2; ${item.checked ? 'text-decoration: line-through; color: #999;' : ''}">
                ${escapeHtml(item.name)}${item.quantity ? ' (' + escapeHtml(item.quantity) + ')' : ''}
            </span>
            <button class="btn btn-danger" onclick="deleteProduct(${currentListId}, ${item.id})" style="padding: 5px 10px;">❌</button>
        </div>
    `).join('');
}

async function addProduct() {
    const name = document.getElementById('productName').value.trim();
    const quantity = document.getElementById('productQuantity').value.trim();
    
    if (!name) {
        showToast('Veuillez entrer un nom', 'error');
        return;
    }
    
    try {
        await shoppingLists.addProduct(currentListId, { name, quantity: quantity || null });
        const list = shoppingLists.getList(currentListId);
        renderProducts(list.items);
        renderLists();
        document.getElementById('productName').value = '';
        document.getElementById('productQuantity').value = '';
        showToast('Produit ajouté!', 'success');
    } catch (error) {
        showToast('Erreur: ' + error.message, 'error');
    }
}

async function toggleProductChecked(listId, productId) {
    try {
        await shoppingLists.toggleProductChecked(listId, productId);
        const list = shoppingLists.getList(listId);
        renderProducts(list.items);
        renderLists();
    } catch (error) {
        showToast('Erreur: ' + error.message, 'error');
    }
}

async function deleteProduct(listId, productId) {
    if (confirm('Supprimer ce produit?')) {
        try {
            await shoppingLists.deleteProduct(listId, productId);
            const list = shoppingLists.getList(listId);
            renderProducts(list.items);
            renderLists();
            showToast('Produit supprimé!', 'success');
        } catch (error) {
            showToast('Erreur: ' + error.message, 'error');
        }
    }
}

// Render all
function renderAll() {
    renderCards();
    renderLists();
    renderHistory();
}

function renderHistory() {
    const container = document.getElementById('historyContainer');
    const history = shoppingLists.getHistory();
    
    if (history.length === 0) {
        container.className = 'empty-state';
        container.textContent = 'Aucun historique.';
        return;
    }
    
    container.className = '';
    container.innerHTML = history.map(item => `
        <div class="card">
            <h3>${escapeHtml(item.name)}</h3>
            <p>Acheté ${item.count} fois</p>
            <p>Dernier achat: ${new Date(item.lastUsed).toLocaleDateString()}</p>
        </div>
    `).join('');
}

// Refresh data
async function refreshData() {
    try {
        await loyaltyCards.load();
        await shoppingLists.load();
        renderAll();
        showToast('Données rafraîchies!', 'success');
    } catch (error) {
        showToast('Erreur: ' + error.message, 'error');
    }
}

// Toast notifications
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(20px)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Add test data
async function addTestData() {
    try {
        const testCards = [
            { store: 'Carrefour', cardId: '123456789012', barcodeType: 'EAN_13', note: 'Carte de fidélité' },
            { store: 'Lidl', cardId: '987654321098', barcodeType: 'CODE_128', note: 'Carte client' },
            { store: 'Auchan', cardId: 'QR123456789', barcodeType: 'QR_CODE', note: 'Carte QR' }
        ];
        
        for (const card of testCards) {
            await loyaltyCards.addCard(card);
        }
        
        const testList = await shoppingLists.addList({
            name: 'Courses de la semaine',
            description: 'Liste de test'
        });
        
        const testProducts = [
            { name: 'Lait', quantity: '1L' },
            { name: 'Pain', quantity: '1' },
            { name: 'Œufs', quantity: '6' },
            { name: 'Pommes', quantity: '1kg' }
        ];
        
        for (const product of testProducts) {
            await shoppingLists.addProduct(testList.id, product);
        }
        
        renderAll();
        showToast('Données de test ajoutées!', 'success');
    } catch (error) {
        showToast('Erreur: ' + error.message, 'error');
    }
}

// Utility functions
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Make functions globally accessible
window.editCard = editCard;
window.deleteCard = deleteCard;
window.editList = editList;
window.deleteList = deleteList;
window.showProducts = showProducts;
window.toggleProductChecked = toggleProductChecked;
window.deleteProduct = deleteProduct;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', init);

/**
 * Loyalty Cards Manager - Gestion des cartes de fidélité
 * Inspiré de Loyalty Card Locker (brarcher/loyalty-card-locker)
 * 
 * @author GoMark Project
 * @license GPL-3.0
 */

class LoyaltyCardManager {
    constructor(storage) {
        this.storage = storage;
        this.cards = [];
    }

    // Charger les cartes depuis le fichier
    async load() {
        try {
            this.cards = await this.storage.readFile('loyalty-cards.json', []);
        } catch (error) {
            this.cards = [];
        }
    }

    // Sauvegarder les cartes
    async save() {
        await this.storage.writeFile('loyalty-cards.json', this.cards);
    }

    // Ajouter une carte
    async addCard(cardData) {
        const newCard = {
            id: Date.now(),
            store: cardData.store || '',
            cardId: cardData.cardId || '',
            barcodeType: cardData.barcodeType || 'CODE_128',
            note: cardData.note || '',
            headerColor: cardData.headerColor || '#4CAF50',
            headerTextColor: cardData.headerTextColor || '#FFFFFF',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        this.cards.push(newCard);
        await this.save();
        return newCard;
    }

    // Scanner une nouvelle carte
    async scanNewCard() {
        try {
            const result = await window.barcodeScanner.scan();
            return {
                cardId: result.text,
                barcodeType: result.format
            };
        } catch (error) {
            console.error("Erreur de scan:", error);
            throw error;
        }
    }

    // Générer un barcode (pour affichage)
    generateBarcode(cardId, barcodeType, width = 300, height = 100) {
        if (window.barcodeScanner) {
            return window.barcodeScanner.generateBarcode(cardId, barcodeType, width, height);
        }
        // Fallback si BarcodeScanner n'est pas disponible
        return this.drawTextBarcode(cardId, width, height);
    }

    // Fallback : afficher le texte
    drawTextBarcode(cardId, width, height) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#000';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(cardId, width / 2, height / 2);
        return canvas.toDataURL('image/png');
    }

    // Supprimer une carte
    async deleteCard(cardId) {
        this.cards = this.cards.filter(card => card.id !== cardId);
        await this.save();
    }

    // Mettre à jour une carte
    async updateCard(cardId, updates) {
        const cardIndex = this.cards.findIndex(card => card.id === cardId);
        if (cardIndex !== -1) {
            this.cards[cardIndex] = { 
                ...this.cards[cardIndex], 
                ...updates, 
                updatedAt: new Date().toISOString() 
            };
            await this.save();
            return this.cards[cardIndex];
        }
        return null;
    }

    // Obtenir une carte par ID
    getCard(cardId) {
        return this.cards.find(card => card.id === cardId);
    }

    // Rechercher des cartes
    search(query) {
        const lowerQuery = query.toLowerCase();
        return this.cards.filter(card =>
            card.store.toLowerCase().includes(lowerQuery) ||
            card.cardId.toLowerCase().includes(lowerQuery) ||
            card.note.toLowerCase().includes(lowerQuery)
        );
    }

    // Obtenir toutes les cartes
    getAllCards() {
        return [...this.cards];
    }

    // Exporter les cartes en JSON
    async exportToJSON() {
        return JSON.stringify(this.cards, null, 2);
    }

    // Importer des cartes depuis JSON
    async importFromJSON(jsonData) {
        try {
            const importedCards = JSON.parse(jsonData);
            // Vérifier que c'est un tableau
            if (Array.isArray(importedCards)) {
                // Générer de nouveaux IDs pour éviter les conflits
                const newCards = importedCards.map(card => ({
                    ...card,
                    id: Date.now() + Math.random() * 1000,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                }));
                this.cards = [...this.cards, ...newCards];
                await this.save();
                return newCards.length;
            }
            return 0;
        } catch (error) {
            console.error("Erreur d'import:", error);
            throw error;
        }
    }

    // Exporter une carte au format URI (pour partage)
    exportCardToURI(card) {
        const data = {
            store: card.store,
            cardId: card.cardId,
            barcodeType: card.barcodeType,
            note: card.note,
            headerColor: card.headerColor,
            headerTextColor: card.headerTextColor
        };
        return btoa(encodeURIComponent(JSON.stringify(data)));
    }

    // Importer une carte depuis URI
    importCardFromURI(uriData) {
        try {
            const data = JSON.parse(decodeURIComponent(atob(uriData)));
            return {
                store: data.store || '',
                cardId: data.cardId || '',
                barcodeType: data.barcodeType || 'CODE_128',
                note: data.note || '',
                headerColor: data.headerColor || '#4CAF50',
                headerTextColor: data.headerTextColor || '#FFFFFF'
            };
        } catch (error) {
            console.error("Erreur d'import URI:", error);
            return null;
        }
    }
}

// Exporter une instance globale
window.LoyaltyCardManager = LoyaltyCardManager;
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LoyaltyCardManager;
}

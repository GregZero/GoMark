/**
 * Shopping Lists Manager - Gestion des listes de courses
 * 
 * @author GoMark Project
 * @license GPL-3.0
 */

class ShoppingListManager {
    constructor(storage) {
        this.storage = storage;
        this.lists = [];
        this.history = [];
    }

    // Charger les listes depuis le fichier
    async load() {
        try {
            this.lists = await this.storage.readFile('shopping-lists.json', []);
        } catch (error) {
            this.lists = [];
        }
        
        try {
            this.history = await this.storage.readFile('history.json', []);
        } catch (error) {
            this.history = [];
        }
    }

    // Sauvegarder les listes
    async save() {
        await this.storage.writeFile('shopping-lists.json', this.lists);
        await this.storage.writeFile('history.json', this.history);
    }

    // Ajouter une liste
    async addList(listData) {
        const newList = {
            id: Date.now(),
            name: listData.name || 'Nouvelle liste',
            description: listData.description || '',
            items: listData.items || [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        this.lists.push(newList);
        await this.save();
        return newList;
    }

    // Supprimer une liste
    async deleteList(listId) {
        this.lists = this.lists.filter(list => list.id !== listId);
        await this.save();
    }

    // Mettre à jour une liste
    async updateList(listId, updates) {
        const listIndex = this.lists.findIndex(list => list.id === listId);
        if (listIndex !== -1) {
            this.lists[listIndex] = { 
                ...this.lists[listIndex], 
                ...updates, 
                updatedAt: new Date().toISOString() 
            };
            await this.save();
            return this.lists[listIndex];
        }
        return null;
    }

    // Obtenir une liste par ID
    getList(listId) {
        return this.lists.find(list => list.id === listId);
    }

    // Obtenir toutes les listes
    getAllLists() {
        return [...this.lists];
    }

    // Ajouter un produit à une liste
    async addProduct(listId, productData) {
        const listIndex = this.lists.findIndex(list => list.id === listId);
        if (listIndex !== -1) {
            const newProduct = {
                id: Date.now(),
                name: productData.name,
                quantity: productData.quantity || null,
                checked: false,
                addedAt: new Date().toISOString()
            };
            this.lists[listIndex].items.push(newProduct);
            this.lists[listIndex].updatedAt = new Date().toISOString();
            
            // Ajouter à l'historique
            await this.addToHistory(productData.name);
            
            await this.save();
            return newProduct;
        }
        return null;
    }

    // Supprimer un produit d'une liste
    async deleteProduct(listId, productId) {
        const listIndex = this.lists.findIndex(list => list.id === listId);
        if (listIndex !== -1) {
            this.lists[listIndex].items = this.lists[listIndex].items.filter(
                product => product.id !== productId
            );
            this.lists[listIndex].updatedAt = new Date().toISOString();
            await this.save();
            return true;
        }
        return false;
    }

    // Mettre à jour un produit
    async updateProduct(listId, productId, updates) {
        const listIndex = this.lists.findIndex(list => list.id === listId);
        if (listIndex !== -1) {
            const productIndex = this.lists[listIndex].items.findIndex(
                product => product.id === productId
            );
            if (productIndex !== -1) {
                this.lists[listIndex].items[productIndex] = {
                    ...this.lists[listIndex].items[productIndex],
                    ...updates
                };
                this.lists[listIndex].updatedAt = new Date().toISOString();
                await this.save();
                return this.lists[listIndex].items[productIndex];
            }
        }
        return null;
    }

    // Cocher/décocher un produit
    async toggleProductChecked(listId, productId) {
        const listIndex = this.lists.findIndex(list => list.id === listId);
        if (listIndex !== -1) {
            const productIndex = this.lists[listIndex].items.findIndex(
                product => product.id === productId
            );
            if (productIndex !== -1) {
                this.lists[listIndex].items[productIndex].checked = 
                    !this.lists[listIndex].items[productIndex].checked;
                this.lists[listIndex].updatedAt = new Date().toISOString();
                await this.save();
                return this.lists[listIndex].items[productIndex].checked;
            }
        }
        return null;
    }

    // Rechercher des listes
    searchLists(query) {
        const lowerQuery = query.toLowerCase();
        return this.lists.filter(list =>
            list.name.toLowerCase().includes(lowerQuery) ||
            list.description.toLowerCase().includes(lowerQuery) ||
            list.items.some(item => item.name.toLowerCase().includes(lowerQuery))
        );
    }

    // Ajouter un produit à l'historique
    async addToHistory(productName) {
        const existing = this.history.find(
            h => h.name.toLowerCase() === productName.toLowerCase()
        );
        
        if (existing) {
            existing.count++;
            existing.lastUsed = new Date().toISOString();
        } else {
            this.history.push({
                name: productName,
                count: 1,
                firstUsed: new Date().toISOString(),
                lastUsed: new Date().toISOString()
            });
        }
        
        await this.save();
    }

    // Obtenir les suggestions basées sur l'historique
    getSuggestions(query = '', limit = 5) {
        return this.history
            .filter(h => h.name.toLowerCase().includes(query.toLowerCase()))
            .sort((a, b) => b.count - a.count || 
                new Date(b.lastUsed) - new Date(a.lastUsed))
            .slice(0, limit)
            .map(h => h.name);
    }

    // Obtenir l'historique
    getHistory() {
        return [...this.history];
    }

    // Exporter les listes en JSON
    async exportToJSON() {
        return JSON.stringify({
            lists: this.lists,
            history: this.history
        }, null, 2);
    }

    // Importer des listes depuis JSON
    async importFromJSON(jsonData) {
        try {
            const data = JSON.parse(jsonData);
            if (data.lists && Array.isArray(data.lists)) {
                this.lists = [...this.lists, ...data.lists];
            }
            if (data.history && Array.isArray(data.history)) {
                this.history = [...this.history, ...data.history];
            }
            await this.save();
            return { lists: data.lists ? data.lists.length : 0, history: data.history ? data.history.length : 0 };
        } catch (error) {
            console.error("Erreur d'import:", error);
            throw error;
        }
    }

    // Archiver une liste (la déplacer dans l'historique)
    async archiveList(listId) {
        const listIndex = this.lists.findIndex(list => list.id === listId);
        if (listIndex !== -1) {
            const list = this.lists[listIndex];
            // Ajouter les produits à l'historique
            for (const item of list.items) {
                await this.addToHistory(item.name);
            }
            // Supprimer la liste
            this.lists.splice(listIndex, 1);
            await this.save();
            return true;
        }
        return false;
    }

    // Obtenir les statistiques
    getStats() {
        const totalLists = this.lists.length;
        const totalItems = this.lists.reduce((sum, list) => sum + list.items.length, 0);
        const uncheckedItems = this.lists.reduce(
            (sum, list) => sum + list.items.filter(item => !item.checked).length, 0
        );
        const historyCount = this.history.length;
        
        return {
            totalLists,
            totalItems,
            uncheckedItems,
            historyCount
        };
    }
}

// Exporter une instance globale
window.ShoppingListManager = ShoppingListManager;
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ShoppingListManager;
}

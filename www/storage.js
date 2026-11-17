/**
 * Storage Manager - Gestion du stockage dans des fichiers
 * Compatible avec File System Access API et localStorage (fallback)
 * 
 * @author GoMark Project
 * @license GPL-3.0
 */

class StorageManager {
    constructor() {
        this.directoryHandle = null;
        this.fallbackData = {};
        this.isMobile = this.detectMobile();
        this.fileSystemSupported = 'showDirectoryPicker' in window;
    }

    // Détecter si on est sur mobile
    detectMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    // Vérifier si File System Access API est disponible
    isFileSystemAvailable() {
        return this.fileSystemSupported && !this.isMobile;
    }

    // Sélectionner un dossier
    async selectDirectory() {
        try {
            // Sur Android (APK) - utiliser le plugin natif
            if (typeof window.Capacitor !== 'undefined') {
                const { DirectoryPicker } = window.Plugins;
                if (DirectoryPicker && typeof DirectoryPicker.selectDirectory === 'function') {
                    const result = await DirectoryPicker.selectDirectory();
                    this.directoryHandle = result.path;
                    localStorage.setItem('storageSelected', 'true');
                    localStorage.setItem('storageDirectoryName', result.name);
                    localStorage.setItem('storageDirectoryPath', result.path);
                    localStorage.setItem('storageDirectoryUri', result.uri);
                    return true;
                }
            }
            
            // Sur navigateur desktop
            if ('showDirectoryPicker' in window) {
                this.directoryHandle = await window.showDirectoryPicker({
                    startIn: 'documents',
                    mode: 'readwrite'
                });
                localStorage.setItem('storageSelected', 'true');
                localStorage.setItem('storageDirectoryName', this.directoryHandle.name);
                return true;
            }
            
            // Fallback pour les navigateurs non supportés
            console.warn("Sélection de dossier non supportée sur cet appareil. Utilisation de localStorage.");
            localStorage.setItem('storageSelected', 'false');
            localStorage.setItem('storageDirectoryName', 'localStorage');
            return false;
            
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error("Erreur de sélection du dossier:", error);
            }
            return false;
        }
    }

    // Vérifier si un dossier est déjà sélectionné
    async checkDirectory() {
        // Vérifier si un dossier a été sélectionné précédemment
        // Note: Le File System Access API ne permet pas de persister les handles
        // entre les sessions, donc on doit demander à l'utilisateur de resélectionner
        // Cependant, on peut indiquer qu'un dossier a été sélectionné
        return localStorage.getItem('storageSelected') === 'true';
    }

    // Obtenir le nom du dossier sélectionné
    getSelectedDirectoryName() {
        return localStorage.getItem('storageDirectoryName') || null;
    }

    // Obtenir le chemin du dossier (pour Android)
    getDirectoryPath() {
        return localStorage.getItem('storageDirectoryPath') || null;
    }

    // Obtenir l'URI du dossier (pour Android)
    getDirectoryUri() {
        return localStorage.getItem('storageDirectoryUri') || null;
    }

    // Vérifier si on est dans Capacitor (APK)
    isCapacitor() {
        return typeof window.Capacitor !== 'undefined';
    }

    // Lire un fichier
    async readFile(filename, defaultValue = null) {
        if (this.directoryHandle) {
            try {
                const fileHandle = await this.directoryHandle.getFile(filename);
                const file = await fileHandle.getFile();
                const content = await file.text();
                return JSON.parse(content);
            } catch (error) {
                if (error.name === 'NotFoundError') {
                    return defaultValue;
                }
                console.error("Erreur de lecture:", error);
                return defaultValue;
            }
        } else {
            // Fallback localStorage
            const data = localStorage.getItem(filename);
            return data ? JSON.parse(data) : defaultValue;
        }
    }

    // Écrire un fichier
    async writeFile(filename, data) {
        if (this.directoryHandle) {
            try {
                const fileHandle = await this.directoryHandle.getFile(filename, { create: true });
                const writable = await fileHandle.createWritable();
                await writable.write(JSON.stringify(data, null, 2));
                await writable.close();
                return true;
            } catch (error) {
                console.error("Erreur d'écriture:", error);
                return false;
            }
        } else {
            // Fallback localStorage
            localStorage.setItem(filename, JSON.stringify(data));
            return true;
        }
    }

    // Lister les fichiers
    async listFiles() {
        if (this.directoryHandle) {
            try {
                const files = [];
                for await (const entry of this.directoryHandle.values()) {
                    files.push(entry.name);
                }
                return files;
            } catch (error) {
                console.error("Erreur de liste:", error);
                return [];
            }
        } else {
            // Fallback localStorage
            return Object.keys(localStorage);
        }
    }

    // Vérifier si un fichier existe
    async fileExists(filename) {
        if (this.directoryHandle) {
            try {
                await this.directoryHandle.getFile(filename);
                return true;
            } catch (error) {
                return false;
            }
        } else {
            return localStorage.getItem(filename) !== null;
        }
    }

    // Ouvrir le dossier dans l'explorateur (expérimental)
    async openInExplorer() {
        if (this.directoryHandle && 'launchQueue' in window) {
            try {
                const fileHandle = await this.directoryHandle.getFile('listes.json', { create: true });
                const file = await fileHandle.getFile();
                const url = URL.createObjectURL(file);
                window.open(url, '_blank');
            } catch (error) {
                console.error("Impossible d'ouvrir le dossier:", error);
            }
        }
    }

    // Supprimer un fichier
    async deleteFile(filename) {
        if (this.directoryHandle) {
            try {
                const fileHandle = await this.directoryHandle.getFile(filename);
                await this.directoryHandle.removeEntry(filename);
                return true;
            } catch (error) {
                console.error("Erreur de suppression:", error);
                return false;
            }
        } else {
            localStorage.removeItem(filename);
            return true;
        }
    }
}

// Exporter une instance globale
window.StorageManager = StorageManager;
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StorageManager;
}

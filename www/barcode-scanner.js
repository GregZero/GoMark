/**
 * Barcode Scanner Module - Scanner de codes-barres universel
 * Compatible avec navigateur (ZXing) et Capacitor (Android/iOS)
 * 
 * @author GoMark Project
 * @license GPL-3.0
 */

class BarcodeScanner {
    constructor(onResultCallback) {
        this.onResult = onResultCallback;
        this.isScanning = false;
        this.stream = null;
        this.codeReader = null;
        this.videoElement = null;
    }

    // Méthode principale (détecte l'environnement)
    async scan() {
        // Vérifier si on est dans une application Capacitor
        if (typeof window.Capacitor !== 'undefined') {
            return this.scanWithCapacitor();
        } else {
            return this.scanWithZXing();
        }
    }

    // Pour APK Android/iOS (Capacitor)
    async scanWithCapacitor() {
        try {
            const { BarcodeScanner } = Plugins;

            // Préparer le scanner
            await BarcodeScanner.prepare();
            
            // Démarrer le scan
            const result = await BarcodeScanner.startScan();

            if (result.hasContent) {
                this.onResult({
                    text: result.content,
                    format: result.format
                });
                return result.content;
            }
            
            return null;
        } catch (error) {
            console.error("Erreur Capacitor:", error);
            throw new Error("Impossible de scanner: " + error.message);
        }
    }

    // Pour navigateur web (ZXing)
    async scanWithZXing() {
        if (this.isScanning) {
            console.log("Déjà en train de scanner");
            return;
        }

        try {
            // Vérifier la permission caméra
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { 
                    facingMode: 'environment',
                    width: { ideal: 1920 },
                    height: { ideal: 1080 }
                }
            });

            this.isScanning = true;
            this.stream = stream;

            // Créer l'élément vidéo
            this.videoElement = document.createElement('video');
            this.videoElement.srcObject = stream;
            this.videoElement.play();
            this.videoElement.style.display = 'none';
            document.body.appendChild(this.videoElement);

            // Attendre que la vidéo soit prête
            await new Promise(resolve => this.videoElement.onloadedmetadata = resolve);

            // Initialiser le code reader
            this.codeReader = new ZXing.BrowserQRCodeReader();
            
            // Configuration des formats supportés
            const hints = new Map();
            hints.set(ZXing.DecodeHintType.TRY_HARDER, true);
            hints.set(ZXing.DecodeHintType.POSSIBLE_FORMATS, [
                ZXing.Format.AZTEC,
                ZXing.Format.CODABAR,
                ZXing.Format.CODE_39,
                ZXing.Format.CODE_128,
                ZXing.Format.DATA_MATRIX,
                ZXing.Format.EAN_8,
                ZXing.Format.EAN_13,
                ZXing.Format.ITF,
                ZXing.Format.PDF_417,
                ZXing.Format.QR_CODE,
                ZXing.Format.UPC_A
            ]);

            // Lire le code-barres
            const result = await this.codeReader.decodeFromVideoDevice(
                null,
                this.videoElement,
                (result, error) => {
                    if (result) {
                        this.cleanup();
                        this.onResult({
                            text: result.text,
                            format: result.format
                        });
                    }
                    if (error) {
                        console.error("Erreur ZXing:", error);
                    }
                },
                hints
            );

            return result.text;

        } catch (error) {
            this.cleanup();
            console.error("Erreur ZXing:", error);
            throw new Error("Impossible d'accéder à la caméra: " + error.message);
        }
    }

    // Arrêter le scanning
    stop() {
        if (this.codeReader) {
            this.codeReader.reset();
        }
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
        }
        if (this.videoElement) {
            this.videoElement.remove();
        }
        this.isScanning = false;
        this.codeReader = null;
        this.stream = null;
        this.videoElement = null;
    }

    // Nettoyer les ressources
    cleanup() {
        this.stop();
    }

    // Générer un code-barres (pour affichage)
    generateBarcode(text, format, width = 300, height = 100) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        try {
            const writer = new ZXing.BrowserQRCodeWriter();
            const zxingFormat = this.getZXingFormat(format);

            if (zxingFormat) {
                writer.write(canvas, text, width, height, {
                    format: zxingFormat,
                    margin: 0
                });
            } else {
                // Fallback pour les formats non supportés
                this.drawTextBarcode(canvas, text, width, height);
            }

            return canvas.toDataURL('image/png');
        } catch (error) {
            console.error("Erreur de génération:", error);
            this.drawTextBarcode(canvas, text, width, height);
            return canvas.toDataURL('image/png');
        }
    }

    // Convertir le type de barcode pour ZXing
    getZXingFormat(barcodeType) {
        const mapping = {
            'AZTEC': ZXing.Format.AZTEC,
            'CODABAR': ZXing.Format.CODABAR,
            'CODE_39': ZXing.Format.CODE_39,
            'CODE_128': ZXing.Format.CODE_128,
            'DATA_MATRIX': ZXing.Format.DATA_MATRIX,
            'EAN_8': ZXing.Format.EAN_8,
            'EAN_13': ZXing.Format.EAN_13,
            'ITF': ZXing.Format.ITF,
            'PDF_417': ZXing.Format.PDF_417,
            'QR_CODE': ZXing.Format.QR_CODE,
            'UPC_A': ZXing.Format.UPC_A
        };
        return mapping[barcodeType.toUpperCase()];
    }

    // Fallback : afficher le texte
    drawTextBarcode(canvas, text, width, height) {
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#000';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(text, width / 2, height / 2);
    }
}

// Exporter une instance globale
window.BarcodeScanner = BarcodeScanner;
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BarcodeScanner;
}

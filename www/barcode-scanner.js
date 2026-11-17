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
        if (typeof window.Capacitor !== 'undefined' && typeof window.Plugins !== 'undefined') {
            return this.scanWithCapacitor();
        } else {
            // Vérifier si on est sur mobile - l'accès caméra peut être limité
            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
            
            if (isMobile && !window.location.href.startsWith('https://') && !window.location.href.includes('localhost') && !window.location.href.includes('127.0.0.1')) {
                throw new Error('Sur mobile, l\'accès à la caméra nécessite HTTPS ou localhost. Essayez l\'APK Android pour un meilleur fonctionnement.');
            }
            
            return this.scanWithZXing();
        }
    }

    // Pour APK Android/iOS (Capacitor)
    async scanWithCapacitor() {
        try {
            // Vérifier que Capacitor et le plugin sont disponibles
            if (typeof window.Capacitor === 'undefined' || typeof window.Plugins === 'undefined') {
                throw new Error('Capacitor non disponible. Cette fonctionnalité est réservée à l\'APK Android.');
            }
            
            const { BarcodeScanner } = window.Plugins;

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
            // NE PAS cacher la vidéo - l'utilisateur doit voir ce qu'il scanne
            this.videoElement.style.position = 'fixed';
            this.videoElement.style.top = '0';
            this.videoElement.style.left = '0';
            this.videoElement.style.width = '100%';
            this.videoElement.style.height = '100%';
            this.videoElement.style.objectFit = 'cover';
            this.videoElement.style.zIndex = '9999';
            this.videoElement.style.backgroundColor = 'rgba(0,0,0,0.5)';
            document.body.appendChild(this.videoElement);

            // Attendre que la vidéo soit prête
            await new Promise(resolve => this.videoElement.onloadedmetadata = resolve);

            // Initialiser le code reader avec l'API moderne
            this.codeReader = new ZXing.BrowserMultiFormatReader();
            
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
            // Note: decodeFromVideoDevice retourne une Promise qui se résout avec le résultat
            // mais nous utilisons des callbacks pour gérer les résultats continus
            const result = await this.codeReader.decodeFromVideoDevice(
                undefined,
                this.videoElement,
                {
                    onSuccess: (result) => {
                        this.cleanup();
                        this.onResult({
                            text: result.text,
                            format: result.format
                        });
                    },
                    onError: (error) => {
                        console.error("Erreur ZXing:", error);
                    }
                }
            );

            // Si on arrive ici, c'est que la promesse a été résolue avec un résultat
            if (result) {
                this.cleanup();
                this.onResult({
                    text: result.text,
                    format: result.format
                });
            }
            
            return result ? result.text : null;

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
            // Normaliser le format
            const normalizedFormat = this.normalizeBarcodeFormat(format);
            
            // Pour les QR codes, utiliser ZXing
            if (normalizedFormat === 'QR_CODE') {
                const zxingFormat = ZXing.Format.QR_CODE;
                const writer = new ZXing.BrowserQRCodeWriter();
                writer.write(canvas, text, width, height, {
                    format: zxingFormat,
                    margin: 0
                });
            } else {
                // Pour les codes-barres 1D, utiliser JsBarcode
                if (typeof JsBarcode !== 'undefined') {
                    JsBarcode(canvas, text, {
                        format: normalizedFormat,
                        lineColor: '#000000',
                        width: 2,
                        height: height,
                        displayValue: false,
                        margin: 0
                    });
                } else {
                    // Fallback si JsBarcode n'est pas chargé
                    this.drawTextBarcode(canvas, text, width, height);
                }
            }

            return canvas.toDataURL('image/png');
        } catch (error) {
            console.error("Erreur de génération:", error);
            this.drawTextBarcode(canvas, text, width, height);
            return canvas.toDataURL('image/png');
        }
    }

    // Normaliser le format de code-barres pour JsBarcode
    normalizeBarcodeFormat(format) {
        if (!format) return 'CODE128';
        
        const formatMap = {
            'AZTEC': 'aztec',
            'CODABAR': 'codabar',
            'CODE_39': 'CODE39',
            'CODE_128': 'CODE128',
            'DATA_MATRIX': 'datamatrix',
            'EAN_8': 'EAN8',
            'EAN_13': 'EAN13',
            'ITF': 'ITF',
            'PDF_417': 'pdf417',
            'QR_CODE': 'QR_CODE',
            'UPC_A': 'UPC'
        };
        
        return formatMap[format.toUpperCase()] || 'CODE128';
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

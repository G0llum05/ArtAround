class Imager {
    static IMAGE_FORMATS = new Set (['jpg','jpeg','png','webp','gif','bmp','tiff','svg']);
    
    static getExt(fileName) {
        if (!fileName || typeof fileName !== 'string') return '';
        const parts = fileName.split('.');
        const ext = parts.length > 1 ? parts.pop().toLowerCase() : '';
        return ext;
    }

    static isImage(fileName) {
        const ext = this.getExt(fileName);
        return this.IMAGE_FORMATS.has(ext);
    }

    static isVect(mimeType) {
        return typeof mimeType === 'string' && mimeType.includes('svg');
    }

    static isRaster(mimeType) {
        return !this.isVect(mimeType);
    }

    static getMimeType(fileName) {
        const ext = this.getExt(fileName);
        switch (ext) {
            case 'jpg':
            case 'jpeg':
                return 'image/jpeg';
            case 'png':
                return 'image/png';
            case 'webp':
                return 'image/webp';
            case 'svg':
                return 'image/svg+xml';
            case 'gif':
                return 'image/gif';
            default:
                return 'image/jpeg';
        }
    }
}

module.exports = Imager;
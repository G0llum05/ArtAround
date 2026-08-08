class Imager {
    static IMAGE_FORMATS = new Set (['jpg','jpeg','png','webp','gif','bmp','tiff','svg']);
    
    static getExt(fileName) {
        const parts = filename.split('.');
        const ext = parts.length > 1 ? parts.pop() : '';
        return ext;
    }

    static isImage(fileName) {
        const ext = this.getExt(ext)
        return this.IMAGE_FORMATS.has(ext);
    }

    static isVect(mimeType) {
        return mimeType.includes('svg');
    }

    static isRaster(mimeType) {
        return !this.isVect(mimeType);
    }
}

module.exports = Imager;
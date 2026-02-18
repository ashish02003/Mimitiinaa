/**
 * Resizes an image file on the client side using a canvas.
 * @param {File} file - The original image file.
 * @param {number} maxWidth - The maximum width for the resized image.
 * @param {number} maxHeight - The maximum height for the resized image.
 * @returns {Promise<Blob>} - A promise that resolves with the resized image as a Blob.
 */
export const resizeImage = (file, maxWidth, maxHeight) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > maxWidth) {
                        height *= maxWidth / width;
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width *= maxHeight / height;
                        height = maxHeight;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob((blob) => {
                    resolve(blob);
                }, file.type, 0.8); // 0.8 quality for JPEG
            };
            img.onerror = (error) => reject(error);
        };
        reader.onerror = (error) => reject(error);
    });
};

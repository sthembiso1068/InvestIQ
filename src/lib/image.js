export function fileToAvatar(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('Choose an image.'));
      return;
    }
    if (!file.type.startsWith('image/')) {
      reject(new Error('Upload a JPG, PNG, or WEBP image.'));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      reject(new Error('Images must be smaller than 5 MB.'));
      return;
    }
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      const size = 256;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const context = canvas.getContext('2d');
      const scale = Math.max(size / image.width, size / image.height);
      const width = image.width * scale;
      const height = image.height * scale;
      context.drawImage(image, (size - width) / 2, (size - height) / 2, width, height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', 0.86));
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('That image could not be opened.'));
    };
    image.src = url;
  });
}

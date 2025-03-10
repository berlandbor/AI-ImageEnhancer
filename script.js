document.getElementById('upload').addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (!file) return;

    const img = new Image();
    img.onload = function() {
        const canvas = document.getElementById('canvas');
        const ctx = canvas.getContext('2d');

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        // Показываем подсказку
        document.getElementById('hint').style.display = 'block';

        // Активируем кнопки
        document.getElementById('enhance').disabled = false;
        document.getElementById('resize2x').disabled = true;
        document.getElementById('resize4x').disabled = true;
        document.getElementById('sharpen').disabled = true;
        document.getElementById('download').disabled = true;
    };

    img.src = URL.createObjectURL(file);
});

function resizeImage(scale) {
    const canvas = document.getElementById('canvas');
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');

    tempCanvas.width = canvas.width * scale;
    tempCanvas.height = canvas.height * scale;

    tempCtx.imageSmoothingEnabled = true;
    tempCtx.imageSmoothingQuality = "high";

    tempCtx.drawImage(canvas, 0, 0, tempCanvas.width, tempCanvas.height);

    canvas.width = tempCanvas.width;
    canvas.height = tempCanvas.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(tempCanvas, 0, 0);

    document.getElementById('sharpen').disabled = false;
}

function convolutionLayer(imageData, kernel, bias = 0) {
    const { width, height, data } = imageData;
    const newData = new Uint8ClampedArray(data.length);

    const kSize = Math.sqrt(kernel.length);
    const kHalf = Math.floor(kSize / 2);
    let sumWeights = kernel.reduce((a, b) => a + b, 0);
    if (sumWeights === 0) sumWeights = 1;

    for (let y = kHalf; y < height - kHalf; y++) {
        for (let x = kHalf; x < width - kHalf; x++) {
            let r = 0, g = 0, b = 0;

            for (let ky = -kHalf; ky <= kHalf; ky++) {
                for (let kx = -kHalf; kx <= kHalf; kx++) {
                    const pixelIndex = ((y + ky) * width + (x + kx)) * 4;
                    const weight = kernel[(ky + kHalf) * kSize + (kx + kHalf)];

                    r += data[pixelIndex] * weight;
                    g += data[pixelIndex + 1] * weight;
                    b += data[pixelIndex + 2] * weight;
                }
            }

            const index = (y * width + x) * 4;
            newData[index] = Math.min(Math.max((r / sumWeights) + bias, 0), 255);
            newData[index + 1] = Math.min(Math.max((g / sumWeights) + bias, 0), 255);
            newData[index + 2] = Math.min(Math.max((b / sumWeights) + bias, 0), 255);
            newData[index + 3] = 255;
        }
    }

    return new ImageData(newData, width, height);
}

function runNeuralNetwork() {
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    imageData = convolutionLayer(imageData, [1/9,1/9,1/9,1/9,1/9,1/9,1/9,1/9,1/9]);
    
    ctx.putImageData(imageData, 0, 0);

    document.getElementById('resize2x').disabled = false;
    document.getElementById('resize4x').disabled = false;
}

function sharpenImage() {
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    imageData = convolutionLayer(imageData, [0, -1, 0, -1, 5, -1, 0, -1, 0]);

    ctx.putImageData(imageData, 0, 0);

    document.getElementById('download').disabled = false;
}

function downloadImage() {
    const canvas = document.getElementById('canvas');
    const link = document.createElement('a');
    link.download = 'enhanced-image.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
}
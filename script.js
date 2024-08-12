const sourceFolder = document.getElementById("imageUpload");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let canvasSize = { width: 1080, height: 1350 }; // الافتراضي
let backgroundImgSrc = 'background.png'; // الخلفية الافتراضية
let greenTextY = 290; // موقع النص الأخضر الافتراضي
let whiteTextY = 360; // موقع النص الأبيض الافتراضي

const max_width = 958;
const max_height = 649;
const border_radius = 42;
const padding_x = 59;
const additional_top_padding = 200;
const text_box_width = 958;
const text_box_height = 250;

let croppedImage;
let watermarkOpacity = 1;

const backgroundImg = new Image();
backgroundImg.src = backgroundImgSrc; // تحميل الخلفية الافتراضية

const canvasSizeSelect = document.getElementById('canvasSizeSelect');
canvasSizeSelect.addEventListener('change', function () {
    if (this.value === 'reels') {
        canvasSize = { width: 1080, height: 1920 };
        backgroundImgSrc = 'reels_background.jpg';
        greenTextY = 590;
        whiteTextY = 660;

        // تحديث نطاق التمرير
        document.getElementById('whiteTextPosition').setAttribute('min', '290');
        document.getElementById('whiteTextPosition').setAttribute('max', '840');
        document.getElementById('whiteTextPosition').setAttribute('value', '660');

        document.getElementById('greenTextPosition').setAttribute('min', '290');
        document.getElementById('greenTextPosition').setAttribute('max', '840');
        document.getElementById('greenTextPosition').setAttribute('value', '590');
    } else {
        canvasSize = { width: 1080, height: 1350 };
        backgroundImgSrc = 'background.png';
        greenTextY = 290;
        whiteTextY = 360;

        // تحديث نطاق التمرير
        document.getElementById('whiteTextPosition').setAttribute('min', '290');
        document.getElementById('whiteTextPosition').setAttribute('max', '560');
        document.getElementById('whiteTextPosition').setAttribute('value', '360');

        document.getElementById('greenTextPosition').setAttribute('min', '290');
        document.getElementById('greenTextPosition').setAttribute('max', '560');
        document.getElementById('greenTextPosition').setAttribute('value', '290');
    }

    backgroundImg.src = backgroundImgSrc;
    if (croppedImage) processImage(croppedImage);
});

async function loadFont() {
    const font = new FontFace('LamaRounded', 'url(LamaRounded-SemiBold.ttf)');
    await font.load();
    document.fonts.add(font);
}

function wrapText(context, text, x, y, maxWidth, lineHeight) {
    let words = text.split(' ');
    let line = '';
    let lines = [];

    for (let n = 0; n < words.length; n++) {
        let testLine = line + words[n] + ' ';
        let metrics = context.measureText(testLine);
        let testWidth = metrics.width;
        if (testWidth > maxWidth && n > 0) {
            lines.push(line.trim());
            line = words[n] + ' ';
        } else {
            line = testLine;
        }
    }
    lines.push(line.trim());

    for (let i = 0; i < lines.length; i++) {
        let lineText = lines[i];
        let isArabic = /[\u0600-\u06FF]/.test(lineText);

        if (isArabic) {
            context.direction = 'rtl';
            context.textAlign = 'right';
            x = canvas.width - padding_x;
        } else {
            context.direction = 'ltr';
            context.textAlign = 'left';
        }
        context.fillText(lineText, x, y + (i * lineHeight));
    }
}

async function processImage(image) {
    try {
        if (!canvas || !image) {
            console.error("Canvas or image not found");
            return;
        }

        // ضبط أبعاد الكانفا
        canvas.width = canvasSize.width;
        canvas.height = canvasSize.height;

        // رسم الخلفية على كامل الكانفا
        ctx.drawImage(backgroundImg, 0, 0, canvas.width, canvas.height);

        // حساب أبعاد الصورة الجديدة
        const imgRatio = image.width / image.height;
        let newWidth, newHeight;
        if (image.width > max_width || image.height > max_height) {
            const scale = Math.min(max_width / image.width, max_height / image.height);
            newWidth = image.width * scale;
            newHeight = image.height * scale;
        } else {
            newWidth = image.width;
            newHeight = image.height;
        }

        const offsetX = (canvas.width - newWidth) / 2;
        const offsetY = (canvas.height - newHeight) / 2 + additional_top_padding;

        // رسم الصورة المقطوعة داخل الكانفا
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(offsetX + border_radius, offsetY);
        ctx.arcTo(offsetX + newWidth, offsetY, offsetX + newWidth, offsetY + newHeight, border_radius);
        ctx.arcTo(offsetX + newWidth, offsetY + newHeight, offsetX, offsetY + newHeight, border_radius);
        ctx.arcTo(offsetX, offsetY + newHeight, offsetX, offsetY, border_radius);
        ctx.arcTo(offsetX, offsetY, offsetX + newWidth, offsetY, border_radius);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(image, offsetX, offsetY, newWidth, newHeight);
        ctx.restore();

        // رسم العلامة المائية
        drawWatermark(offsetX, offsetY, newWidth, newHeight);
        // رسم النصوص
        drawTexts();

        // عرض الكانفا وتحديث زر التنزيل
        canvas.style.display = "block";
        updateDownloadButton();

    } catch (error) {
        console.error("Error in processImage:", error);
    }
}


function drawWatermark(offsetX, offsetY, newWidth, newHeight) {
    const watermark = new Image();
    watermark.onload = function () {
        const watermarkWidth = 102;
        const watermarkHeight = 50;
        let watermarkX = offsetX + (newWidth - watermarkWidth) / 2;
        let watermarkY = offsetY + newHeight - 50 - watermarkHeight;

        ctx.globalAlpha = watermarkOpacity;
        ctx.drawImage(watermark, watermarkX, watermarkY, watermarkWidth, watermarkHeight);
        ctx.globalAlpha = 1;
    }
    watermark.src = document.getElementById('watermarkSelect').value;
}

function drawTexts() {
    ctx.fillStyle = '#6ef13e';
    ctx.font = '45px LamaRounded';
    const additionalTextBoxValue = document.getElementById("additionalTextBox").value;
    const greenTextX = canvas.width - padding_x;
    wrapText(ctx, additionalTextBoxValue, greenTextX, greenTextY, text_box_width, 63.6);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '45px LamaRounded';
    const textBoxValue = document.getElementById("textBox").value;
    const whiteTextX = canvas.width - padding_x;
    wrapText(ctx, textBoxValue, whiteTextX, whiteTextY, text_box_width, 63.6);
}

function updateDownloadButton() {
    const downloadButton = document.getElementById("downloadImage");
    if (downloadButton) {
        downloadButton.disabled = false;
        downloadButton.style.opacity = 1;
        downloadButton.removeEventListener("click", downloadImage);
        downloadButton.addEventListener("click", downloadImage);
    }
}

function downloadImage() {
    if (canvas.width > 0 && canvas.height > 0) {
        const link = document.createElement('a');
        link.href = canvas.toDataURL();
        link.download = "processed_image.png";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } else {
        console.error("Canvas does not contain any image data.");
    }
}

let textChangeTimer;
function handleTextChange() {
    clearTimeout(textChangeTimer);
    textChangeTimer = setTimeout(() => {
        if (croppedImage) processImage(croppedImage);
    }, 300);
}

// تابع لاستخراج النصوص من الصورة
async function extractTextFromImage(canvas) {
    const context = canvas.getContext('2d');
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    
    // استخدم أي مكتبة OCR مناسبة هنا، مثل Tesseract.js
    const result = await Tesseract.recognize(imageData, 'eng');
    return result.data.text;
}

// تابع للتعامل مع الملفات
async function handleFiles(files) {
    await loadFont(); // تأكد من تحميل الخطوط إذا لزم الأمر
    if (files.length > 0) {
        const file = files[0];
        const reader = new FileReader();
        reader.onload = async (event) => {
            const img = new Image();
            img.onload = async function () {
                // تحقق من أن الصورة مربعة وأكبر من 1000px
                if (img.width === img.height && img.height > 1000) {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    
                    // تحديد منطقة الاستخراج
                    const extractionHeight = 250; // 1000 - 750
                    canvas.width = img.width;
                    canvas.height = extractionHeight;
                    
                    // رسم الجزء المحدد من الصورة على الكانفاس
                    ctx.drawImage(img, 0, 750, img.width, extractionHeight, 0, 0, img.width, extractionHeight);
                    
                    try {
                        const extractedText = await extractTextFromImage(canvas);
                        if (extractedText) {
                            document.getElementById("textBox").value = extractedText;
                        } else {
                            console.log("No text extracted from the image.");
                        }
                    } catch (error) {
                        console.error("Error extracting text:", error);
                    }
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    }
}

// وظيفة لاستخدام هذه الوظيفة عند اختيار ملفات
document.getElementById("imageUpload").addEventListener("change", (event) => {
    handleFiles(event.target.files);
});

async function extractTextFromImage(canvas) {
    try {
        const result = await Tesseract.recognize(canvas, 'eng+ara');
        return result.data.text;
    } catch (error) {
        console.error("Error extracting text from image:", error);
        return null;
    }
}

document.getElementById("additionalTextBox").addEventListener("input", handleTextChange);
document.getElementById("textBox").addEventListener("input", handleTextChange);

document.getElementById("imageUpload").addEventListener("change", (event) => {
    handleFiles(event.target.files);
});

document.getElementById('greenTextPosition').addEventListener('input', function () {
    greenTextY = parseInt(this.value, 10);
    if (croppedImage) processImage(croppedImage);
});

document.getElementById('whiteTextPosition').addEventListener('input', function () {
    whiteTextY = parseInt(this.value, 10);
    if (croppedImage) processImage(croppedImage);
});

document.getElementById('watermarkSelect').addEventListener('change', function () {
    watermarkOpacity = parseFloat(this.value);
    if (croppedImage) processImage(croppedImage);
});

document.addEventListener("DOMContentLoaded", function() {
    const fullscreenOverlay = document.getElementById("fullscreenOverlay");
    const fullscreenCanvas = document.getElementById("fullscreenCanvas");
    const closeButton = document.getElementById("closeButton");

    const fullscreenCtx = fullscreenCanvas.getContext("2d");

    canvas.addEventListener("click", function() {
        fullscreenCanvas.width = canvas.width;
        fullscreenCanvas.height = canvas.height;
        fullscreenCtx.drawImage(canvas, 0, 0);
        fullscreenOverlay.classList.add("active");
    });

    closeButton.addEventListener("click", function() {
        fullscreenOverlay.classList.remove("active");
    });

    fullscreenOverlay.addEventListener("click", function(event) {
        if (event.target === fullscreenOverlay || event.target === closeButton) {
            fullscreenOverlay.classList.remove("active");
        }
    });    
});

document.getElementById('opacitySlider').addEventListener('input', function() {
    watermarkOpacity = this.value;
    if (croppedImage) processImage(croppedImage);
});

document.getElementById('greenTextPosition').addEventListener('input', function() {
    greenTextY = parseInt(this.value);
    if (croppedImage) processImage(croppedImage);
});

document.getElementById('whiteTextPosition').addEventListener('input', function() {
    whiteTextY = parseInt(this.value);
    if (croppedImage) processImage(croppedImage);
});


const fileInput = document.getElementById('imageUpload');
const fileUpload = document.getElementById('file-upload');
const uploadHint = document.querySelector('.upload-hint');
const uploadProgress = document.querySelector('.upload-progress');

fileInput.addEventListener('change', function () {
    const file = this.files[0];
    const fileName = file.name;
    const fileExtension = fileName.split('.').pop();
    const label = fileUpload.querySelector('label');

    uploadHint.classList.add('show');
    uploadProgress.style.left = '-80%';
    label.style.display = 'none';

    function truncateFileName(fileName) {
        // تحديد الطول الأقصى لاسم الملف
        const maxLength = 25;
    
        // التحقق من طول اسم الملف وقصه إذا لزم الأمر
        return fileName.length > maxLength 
            ? fileName.substring(0, maxLength) + '...' 
            : fileName;
    }
    
    const truncatedFileName = truncateFileName(fileName);
    
    setTimeout(() => {
        label.innerHTML = `
            <div class="relative h-10 w-10 shrink-0 overflow-hidden rounded-md">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36" fill="none" class="h-10 w-10 flex-shrink-0" width="36" height="36">
                    <rect width="36" height="36" rx="6" fill="#0c8ce9"></rect>
                    <path d="M19.6663 9.66663H12.9997C12.5576 9.66663 12.1337 9.84222 11.8212 10.1548C11.5086 10.4673 11.333 10.8913 11.333 11.3333V24.6666C11.333 25.1087 11.5086 25.5326 11.8212 25.8451C12.1337 26.1577 12.5576 26.3333 12.9997 26.3333H22.9997C23.4417 26.3333 23.8656 26.1577 24.1782 25.8451C24.4907 25.5326 24.6663 25.1087 24.6663 24.6666V14.6666L19.6663 9.66663Z" stroke="white" stroke-width="1.66667" stroke-linecap="round" stroke-linejoin="round"></path>
                    <path d="M19.667 9.66663V14.6666H24.667" stroke="white" stroke-width="1.66667" stroke-linecap="round" stroke-linejoin="round"></path>
                    <path d="M21.3337 18.8334H14.667" stroke="white" stroke-width="1.66667" stroke-linecap="round" stroke-linejoin="round"></path>
                    <path d="M21.3337 22.1666H14.667" stroke="white" stroke-width="1.66667" stroke-linecap="round" stroke-linejoin="round"></path>
                    <path d="M16.3337 15.5H15.5003H14.667" stroke="white" stroke-width="1.66667" stroke-linecap="round" stroke-linejoin="round"></path>
                </svg>
            </div>
            <div class="overflow-hidden">
                <div class="truncate font-semibold">${truncatedFileName}</div>
                <div class="truncate text-token-text-tertiary">${fileExtension.toUpperCase()}</div>
            </div>`;
        
        uploadHint.classList.remove('show');
        label.style.display = 'flex';
        label.classList.add('uploads');
        uploadProgress.style.left = '-100%';
    }, 1000);
});

const hideAndShowDiv = document.querySelector(".hideandshow");

imageUpload.addEventListener("change", function(event) {
    if (event.target.files.length > 0) {
        hideAndShowDiv.style.display = "block"; // إظهار العناصر عند رفع ملف
        handleFiles(event.target.files);
    }
});

document.getElementById('toggleWatermark').addEventListener('change', function() {
    const opacitySlider = document.getElementById('opacitySlider');

    if (this.checked) {
        opacitySlider.disabled = false;
        watermarkOpacity = opacitySlider.value;
    } else {
        opacitySlider.disabled = true;
        watermarkOpacity = 0;
    }

    if (croppedImage) processImage(croppedImage);
});

// تشغيل الكود في البداية للتأكد من الحالة الصحيحة
document.addEventListener("DOMContentLoaded", function() {
    const toggleWatermark = document.getElementById('toggleWatermark');
    const opacitySlider = document.getElementById('opacitySlider');
    
    if (!toggleWatermark.checked) {
        opacitySlider.disabled = true;
        watermarkOpacity = 0;
    } else {
        opacitySlider.disabled = false;
        watermarkOpacity = opacitySlider.value;
    }

    if (croppedImage) processImage(croppedImage);
});

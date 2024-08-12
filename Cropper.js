const imageToCrop = document.getElementById("imageToCrop");
const cropperWrapper = document.querySelector(".cropper-wrapper");
const cropperfullscreenOverlay = document.querySelector("div#cropperfullscreenOverlay");
let cropper;

// إضافة مستمع أحداث لتحميل الصور الجديدة وتحديث الكروبر تلقائيًا
document.getElementById("imageUpload").addEventListener("change", (event) => {
    const files = event.target.files;
    if (files.length === 0) {
        alert("Please upload at least one image file.");
        return;
    }
    const file = files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
        imageToCrop.src = event.target.result;
        cropperWrapper.style.display = "flex";
        cropperfullscreenOverlay.style.display = "flex";
        cropper = new Cropper(imageToCrop, {
            aspectRatio: null,
            viewMode: 2,
        });
        document.getElementById("cropImage").style.display = "block"; // إظهار زر القص هنا
    };
    reader.readAsDataURL(file);
});

// إضافة مستمع أحداث للنقر على الزر لقص الصورة
document.getElementById("cropImage").addEventListener("click", () => {
    const croppedCanvas = cropper.getCroppedCanvas();
    const croppedImage = new Image();
    croppedImage.onload = function() {
        processImage(croppedImage);
        saveToLocalStorage(croppedCanvas.toDataURL()); // حفظ النصوص والصورة المقطوعة في localStorage
    };
    croppedImage.src = croppedCanvas.toDataURL();
    cropperWrapper.style.display = "none";
    cropperfullscreenOverlay.style.display = "none";
    cropper.destroy();
    document.getElementById("cropImage").style.display = "none";
});

function saveToLocalStorage(croppedImageDataUrl) {
    localStorage.setItem("croppedImage", croppedImageDataUrl);
    const savedCroppedImage = localStorage.getItem("croppedImage");

    if (savedCroppedImage) {
        croppedImage = new Image();
        croppedImage.onload = async function() {
            await processImage(croppedImage);
        };
        croppedImage.src = savedCroppedImage;
    }
}

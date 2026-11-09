
const screenshotInput = document.getElementById("screenshotInput");
const uploadZone = document.getElementById("uploadZone");
const uploadPlaceholder = document.getElementById("uploadPlaceholder");
const imagePreview = document.getElementById("imagePreview");
const previewImage = document.getElementById("previewImage");
const removeImageButton = document.getElementById("removeImage");

let selectedImage = "";

function showImage(file) {
    if (!file) return;

    const allowedTypes = ["image/png", "image/jpeg", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
        showToast("Please select a PNG, JPG or WEBP image.");
        return;
    }

    if (file.size > 1 * 1024 * 1024) {
        showToast("Image must be smaller than 5 MB.");
        return;
    }

    const reader = new FileReader();

    reader.onload = () => {
        selectedImage = reader.result;
        previewImage.src = selectedImage;

        uploadPlaceholder.classList.add("hidden");
        imagePreview.classList.remove("hidden");
    };

    reader.onerror = () => {
        showToast("Unable to read this image.");
    };

    reader.readAsDataURL(file);
}

screenshotInput.addEventListener("change", event => {
    showImage(event.target.files[0]);
});

uploadZone.addEventListener("dragover", event => {
    event.preventDefault();
    uploadZone.classList.add("drag-over");
});

uploadZone.addEventListener("dragleave", () => {
    uploadZone.classList.remove("drag-over");
});

uploadZone.addEventListener("drop", event => {
    event.preventDefault();
    uploadZone.classList.remove("drag-over");

    const file = event.dataTransfer.files[0];
    showImage(file);
});

removeImageButton.addEventListener("click", event => {
    event.preventDefault();
    event.stopPropagation();

    clearImage();
});

function clearImage() {
    selectedImage = "";
    screenshotInput.value = "";
    previewImage.src = "";

    imagePreview.classList.add("hidden");
    uploadPlaceholder.classList.remove("hidden");
}

function getSelectedImage() {
    return selectedImage;
}

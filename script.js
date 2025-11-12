// Configuration
const CONFIG = {
    API_KEY: 'bFqztdvPXCc9DD9HJXGhtpJe', // Replace with your Remove.bg API key
    API_URL: 'https://api.remove.bg/v1.0/removebg',
    MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
    SUPPORTED_FORMATS: ['image/jpeg', 'image/png', 'image/webp']
};

// DOM Elements
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const previewSection = document.getElementById('previewSection');
const resultsSection = document.getElementById('resultsSection');
const originalImage = document.getElementById('originalImage');
const processedImage = document.getElementById('processedImage');
const processedPlaceholder = document.getElementById('processedPlaceholder');
const loadingSpinner = document.getElementById('loadingSpinner');
const processBtn = document.getElementById('processBtn');
const downloadBtn = document.getElementById('downloadBtn');
const cancelBtn = document.getElementById('cancelBtn');
const originalInfo = document.getElementById('originalInfo');
const processedInfo = document.getElementById('processedInfo');

// State variables
let currentFile = null;
let processedImageUrl = null;

// Initialize the application
function init() {
    setupEventListeners();
}

function setupEventListeners() {
    // Upload area events
    uploadArea.addEventListener('click', () => fileInput.click());
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('dragleave', handleDragLeave);
    uploadArea.addEventListener('drop', handleDrop);
    
    // File input event
    fileInput.addEventListener('change', handleFileSelect);
    
    // Button events
    processBtn.addEventListener('click', processImage);
    downloadBtn.addEventListener('click', downloadImage);
    cancelBtn.addEventListener('click', resetApp);
}

function handleDragOver(e) {
    e.preventDefault();
    uploadArea.classList.add('dragover');
}

function handleDragLeave(e) {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
}

function handleDrop(e) {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleImageFile(files[0]);
    }
}

function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
        handleImageFile(file);
    }
}

function handleImageFile(file) {
    // Validate file
    if (!validateFile(file)) {
        return;
    }
    
    currentFile = file;
    
    // Display original image
    const reader = new FileReader();
    reader.onload = function(e) {
        originalImage.src = e.target.result;
        originalImage.style.display = 'block';
        
        // Update file info
        updateFileInfo(originalInfo, file);
        
        // Show preview section
        previewSection.style.display = 'block';
        resultsSection.style.display = 'none';
        
        // Reset processed image
        processedImage.style.display = 'none';
        processedPlaceholder.style.display = 'block';
        loadingSpinner.style.display = 'none';
        downloadBtn.disabled = true;
        processBtn.disabled = false;
        
        // Scroll to preview section
        previewSection.scrollIntoView({ behavior: 'smooth' });
    };
    reader.readAsDataURL(file);
}

function validateFile(file) {
    // Check file type
    if (!CONFIG.SUPPORTED_FORMATS.includes(file.type)) {
        showNotification('Please select a JPG, PNG, or WEBP image', 'error');
        return false;
    }
    
    // Check file size
    if (file.size > CONFIG.MAX_FILE_SIZE) {
        showNotification('File size must be less than 5MB', 'error');
        return false;
    }
    
    return true;
}

function updateFileInfo(infoElement, file) {
    const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);
    const dimensions = 'Click process to see details';
    
    infoElement.innerHTML = `
        <div>📏 ${dimensions}</div>
        <div>💾 ${sizeInMB} MB</div>
        <div>📄 ${file.type.split('/')[1].toUpperCase()}</div>
    `;
}

async function processImage() {
    if (!currentFile) return;
    
    // Show loading state
    loadingSpinner.style.display = 'block';
    processedPlaceholder.style.display = 'none';
    processedImage.style.display = 'none';
    processBtn.disabled = true;
    downloadBtn.disabled = true;
    
    try {
        // Create FormData for API request
        const formData = new FormData();
        formData.append('image_file', currentFile);
        formData.append('size', 'auto');
        
        // Make API request to Remove.bg
        const response = await fetch(CONFIG.API_URL, {
            method: 'POST',
            headers: {
                'X-Api-Key': CONFIG.API_KEY
            },
            body: formData
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.errors?.[0]?.title || 'API request failed');
        }
        
        // Get the processed image blob
        const blob = await response.blob();
        processedImageUrl = URL.createObjectURL(blob);
        
        // Display processed image
        processedImage.src = processedImageUrl;
        processedImage.style.display = 'block';
        loadingSpinner.style.display = 'none';
        
        // Update processed image info
        updateProcessedInfo(processedInfo, blob);
        
        // Enable download button
        downloadBtn.disabled = false;
        
        // Show results section
        resultsSection.style.display = 'block';
        resultsSection.scrollIntoView({ behavior: 'smooth' });
        
        showNotification('Background removed successfully!');
        
    } catch (error) {
        console.error('Error processing image:', error);
        showNotification(error.message || 'Failed to remove background', 'error');
        
        // Reset loading state
        loadingSpinner.style.display = 'none';
        processedPlaceholder.style.display = 'block';
        processBtn.disabled = false;
    }
}

function updateProcessedInfo(infoElement, blob) {
    const sizeInMB = (blob.size / (1024 * 1024)).toFixed(2);
    const url = URL.createObjectURL(blob);
    
    // Create image to get dimensions
    const img = new Image();
    img.onload = function() {
        infoElement.innerHTML = `
            <div>📏 ${img.width} × ${img.height}</div>
            <div>💾 ${sizeInMB} MB</div>
            <div>🔄 PNG Format</div>
        `;
        URL.revokeObjectURL(url);
    };
    img.src = url;
}

function downloadImage() {
    if (!processedImageUrl) return;
    
    const link = document.createElement('a');
    link.download = `background-removed-${Date.now()}.png`;
    link.href = processedImageUrl;
    link.click();
    
    showNotification('Image downloaded successfully!');
}

function resetApp() {
    // Reset state
    currentFile = null;
    if (processedImageUrl) {
        URL.revokeObjectURL(processedImageUrl);
        processedImageUrl = null;
    }
    
    // Reset UI
    fileInput.value = '';
    originalImage.style.display = 'none';
    processedImage.style.display = 'none';
    processedPlaceholder.style.display = 'block';
    loadingSpinner.style.display = 'none';
    previewSection.style.display = 'none';
    resultsSection.style.display = 'none';
    processBtn.disabled = true;
    downloadBtn.disabled = true;
    
    // Clear file info
    originalInfo.innerHTML = '';
    processedInfo.innerHTML = '';
}

function showNotification(message, type = 'success') {
    // Remove existing notifications
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Create new notification
    const notification = document.createElement('div');
    notification.className = `notification ${type === 'error' ? 'error' : ''}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Show notification
    setTimeout(() => notification.classList.add('show'), 100);
    
    // Hide after 5 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 5000);
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', init);

// Handle page unload to revoke object URLs
window.addEventListener('beforeunload', () => {
    if (processedImageUrl) {
        URL.revokeObjectURL(processedImageUrl);
    }
});
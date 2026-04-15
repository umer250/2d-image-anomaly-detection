const API_URL = import.meta.env.VITE_API_URL || '/api';

export const mlAPI = {
    /**
     * Run anomaly detection on an uploaded image.
     * Uses XMLHttpRequest so we can track real upload progress.
     *
     * @param {File}     file       - The image file (JPG, PNG, etc.)
     * @param {string}   category   - MVTec category (default: 'bottle')
     * @param {boolean}  removeBg   - Toggle background removal
     * @param {function} onProgress - Callback(percent, phaseName)
     * @returns {Promise<Object>}
     */
    predict: (file, category = 'bottle', removeBg = false, onProgress = null) => {
        return new Promise((resolve, reject) => {
            const token = localStorage.getItem('access_token');
            const formData = new FormData();
            formData.append('file', file);
            formData.append('category', category);
            formData.append('remove_bg', removeBg);

            const xhr = new XMLHttpRequest();

            // Track upload progress (phase 1: sending bytes to server)
            xhr.upload.addEventListener('progress', (event) => {
                if (event.lengthComputable && onProgress) {
                    const percent = Math.round((event.loaded / event.total) * 100);
                    onProgress(percent, 'uploading');
                }
            });

            // Upload complete → server is now processing (phase 2)
            xhr.upload.addEventListener('load', () => {
                if (onProgress) onProgress(100, 'analyzing');
            });

            xhr.addEventListener('load', () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    try {
                        resolve(JSON.parse(xhr.responseText));
                    } catch {
                        reject(new Error('Invalid JSON response from server'));
                    }
                } else {
                    try {
                        const err = JSON.parse(xhr.responseText);
                        reject(new Error(err.detail || `Server error ${xhr.status}`));
                    } catch {
                        reject(new Error(`Server error ${xhr.status}`));
                    }
                }
            });

            xhr.addEventListener('error', () => reject(new Error('Network error during upload')));
            xhr.addEventListener('abort', () => reject(new Error('Upload aborted')));

            xhr.open('POST', `${API_URL}/ml/predict`);
            if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
            xhr.send(formData);
        });
    },

    // Health check
    getHealth: async () => {
        const response = await fetch(`${API_URL}/ml/health`);
        if (!response.ok) throw new Error('Health check failed');
        return response.json();
    },

    // Model info
    getModelInfo: async () => {
        const response = await fetch(`${API_URL}/ml/model-info`);
        if (!response.ok) throw new Error('Failed to fetch model info');
        return response.json();
    },
};

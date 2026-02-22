
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

// ML Service
export const mlAPI = {
    // Run prediction on uploaded file
    predict: async (file) => {
        const token = localStorage.getItem('access_token');
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await axios.post(`${API_URL}/ml/predict`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${token}`
                },
            });
            return response.data;
        } catch (error) {
            console.error("ML Prediction Error:", error);
            throw error;
        }
    },

    // Get health status
    getHealth: async () => {
        try {
            const response = await axios.get(`${API_URL}/ml/health`);
            return response.data;
        } catch (error) {
            console.error("ML Health Check Error:", error);
            throw error;
        }
    },

    // Get model info
    getModelInfo: async () => {
        try {
            const response = await axios.get(`${API_URL}/ml/model-info`);
            return response.data;
        } catch (error) {
            console.error("ML Info Error:", error);
            throw error;
        }
    }
};

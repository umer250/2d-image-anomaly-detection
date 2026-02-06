import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import App from './App.jsx'
import './index.css'

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }
    static getDerivedStateFromError(error) { return { hasError: true, error }; }
    render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: '50px', background: '#300', color: 'red', minHeight: '100vh', fontFamily: 'monospace' }}>
                    <h1 style={{ color: 'white' }}>CRITICAL UI ERROR DETECTED</h1>
                    <p>The application crashed during render. Error details:</p>
                    <pre style={{ background: '#000', padding: '20px', borderRadius: '10px' }}>
                        {this.state.error?.toString()}
                    </pre>
                    <button onClick={() => window.location.reload()} style={{ padding: '10px 20px', marginTop: '20px', cursor: 'pointer' }}>
                        Reload Application
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <ErrorBoundary>
            <BrowserRouter>
                <AuthProvider>
                    <App />
                </AuthProvider>
            </BrowserRouter>
        </ErrorBoundary>
    </React.StrictMode>,
)

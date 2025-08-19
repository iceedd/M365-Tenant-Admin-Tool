/**
 * Simple callback server for OAuth redirect on port 8080
 * This handles the Azure AD redirect and passes the code back to the test page
 */
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 8080;

// Enable CORS for all origins and JSON parsing
app.use(cors());
app.use(express.json());

// Simple in-memory store for PKCE code verifiers (in production, use Redis or database)
const pkceStore = new Map();

// Store PKCE code verifier
app.post('/store-pkce', (req, res) => {
    const { state, codeVerifier } = req.body;
    if (state && codeVerifier) {
        pkceStore.set(state, codeVerifier);
        console.log('Stored PKCE code verifier for state:', state);
        res.json({ success: true });
    } else {
        res.status(400).json({ error: 'Missing state or codeVerifier' });
    }
});

// Handle OAuth callback from Azure AD
app.get('/', (req, res) => {
    const { code, state, error, error_description } = req.query;
    
    console.log('OAuth callback received:', {
        code: code ? 'present' : 'missing',
        state,
        error,
        error_description
    });
    
    if (error) {
        console.error('OAuth error:', error, error_description);
        return res.redirect(`http://localhost:3000/auth-test.html?error=${encodeURIComponent(error_description || error)}`);
    }
    
    if (!code) {
        console.error('No authorization code received');
        return res.redirect(`http://localhost:3000/auth-test.html?error=${encodeURIComponent('No authorization code received')}`);
    }

    // Retrieve the code verifier for this state
    const codeVerifier = pkceStore.get(state);
    if (!codeVerifier) {
        console.error('No code verifier found for state:', state);
        return res.redirect(`http://localhost:3000/auth-test.html?error=${encodeURIComponent('PKCE code verifier not found')}`);
    }

    // Clean up the stored code verifier
    pkceStore.delete(state);
    
    // Redirect back to test page with the authorization code and code verifier
    const redirectUrl = `http://localhost:3000/auth-test.html?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state || '')}&codeVerifier=${encodeURIComponent(codeVerifier)}`;
    console.log('Redirecting to:', redirectUrl);
    res.redirect(redirectUrl);
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'OAuth callback server is running' });
});

app.listen(PORT, () => {
    console.log(`🔗 OAuth callback server running on http://localhost:${PORT}`);
    console.log('This server will receive Azure AD redirects and pass them to the test page');
});
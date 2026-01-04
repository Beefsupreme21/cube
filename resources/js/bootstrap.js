import axios from 'axios';
window.axios = axios;

window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

// Enable Pusher logging for debugging
Pusher.logToConsole = true;

window.Pusher = Pusher;

console.log('[Bootstrap] Initializing Echo with Reverb...');
console.log('[Bootstrap] VITE_REVERB_APP_KEY:', import.meta.env.VITE_REVERB_APP_KEY);
console.log('[Bootstrap] VITE_REVERB_HOST:', import.meta.env.VITE_REVERB_HOST);
console.log('[Bootstrap] VITE_REVERB_PORT:', import.meta.env.VITE_REVERB_PORT);
console.log('[Bootstrap] VITE_REVERB_SCHEME:', import.meta.env.VITE_REVERB_SCHEME);

window.Echo = new Echo({
    broadcaster: 'reverb',
    key: import.meta.env.VITE_REVERB_APP_KEY ?? '',
    wsHost: import.meta.env.VITE_REVERB_HOST ?? window.location.hostname,
    wsPort: import.meta.env.VITE_REVERB_PORT ?? 8080,
    wssPort: import.meta.env.VITE_REVERB_PORT ?? 8080,
    forceTLS: (import.meta.env.VITE_REVERB_SCHEME ?? 'http') === 'https',
    enabledTransports: ['ws', 'wss'],
    disableStats: true,
    // Auth endpoint for presence/private channels
    authEndpoint: '/broadcasting/auth',
    auth: {
        headers: {
            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content ?? '',
        },
    },
});

// Log connection state changes
window.Echo.connector.pusher.connection.bind('state_change', (states) => {
    console.log('[Echo] Connection state changed:', states.previous, '->', states.current);
});

window.Echo.connector.pusher.connection.bind('connected', () => {
    console.log('[Echo] ✅ Connected to Reverb!');
});

window.Echo.connector.pusher.connection.bind('error', (err) => {
    console.error('[Echo] ❌ Connection error:', err);
});

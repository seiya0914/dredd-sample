const hooks = require('hooks');
const fetch = require('node-fetch'); // Ensure node-fetch is installed or use built-in http

const API_URL = 'http://localhost:3000'; // Your API server URL

// Hook to reset server state before each transaction
hooks.beforeEach(async (transaction, done) => {
    console.log(`Resetting server state before: ${transaction.name}`);
    try {
        const response = await fetch(`${API_URL}/debug/reset`, { method: 'POST' });
        if (!response.ok) {
            console.error(`Failed to reset state: ${response.status} ${response.statusText}`);
            // Decide if you want to fail the test here
            // done(new Error('Failed to reset server state'));
            // return;
        }
         console.log(`Server state reset successful.`);
    } catch (error) {
        console.error('Error resetting server state:', error);
        // Decide if you want to fail the test here
        // done(error);
        // return;
    }
    done(); // Proceed with the test
});

// Hook to add Authorization header for /config endpoint
hooks.before('/config > GET', (transaction, done) => {
    console.log('Adding Auth header for /config GET');
    // Add Authorization header only if it doesn't exist
    if (!transaction.request.headers['Authorization']) {
        transaction.request.headers['Authorization'] = 'Bearer valid-token';
    }
    done();
});

// Example Hook for forcing a 400 on POST /items
// hooks.before('/items > POST > 400', (transaction, done) => {
//     console.log('Modifying request for POST /items 400');
//     // Intentionally make the payload invalid (e.g., remove required 'name')
//     transaction.request.body = JSON.stringify({ description: "Invalid item" });
//     transaction.request.headers['Content-Type'] = 'application/json';
//     done();
// });

// Example Hook for forcing a 404 on GET /items/{itemId}
// hooks.before('/items/{itemId} > GET > 404', (transaction, done) => {
//     console.log('Modifying request for GET /items/{itemId} 404');
//     // Replace the path parameter with a non-existent ID
//     transaction.fullPath = transaction.fullPath.replace('/items/1', '/items/99999');
//     done();
// });

// Add more hooks here for other specific test cases as needed

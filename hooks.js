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

// Hook to modify request for POST /items > 400 test
hooks.before('Items > /items > POST > 400', (transaction, done) => {
  console.log('Modifying request for POST /items 400');
  transaction.request.body = JSON.stringify({ name: "" }); // Invalid name
  transaction.request.headers['Content-Type'] = 'application/json';
  done();
});

// Hook to modify request for PUT /items/{itemId} > 400 test
hooks.before('Items > /items/{itemId} > PUT > 400', (transaction, done) => {
  console.log('Modifying request for PUT /items/{itemId} 400');
  transaction.request.body = JSON.stringify({ name: "" }); // Invalid name
  transaction.request.headers['Content-Type'] = 'application/json';
  done();
});

// Hook to modify request for GET /items/{itemId} > 404 test
hooks.before('Items > /items/{itemId} > GET > 404', (transaction, done) => {
  console.log('Modifying request for GET /items/{itemId} 404');
  transaction.fullPath = '/items/99999'; // Non-existent ID
  done();
});

// Hook to modify request for PUT /items/{itemId} > 404 test
hooks.before('Items > /items/{itemId} > PUT > 404', (transaction, done) => {
  console.log('Modifying request for PUT /items/{itemId} 404');
  transaction.fullPath = '/items/99999'; // Non-existent ID
  done();
});

// Hook to modify request for GET /users/{userId} > 404 test
hooks.before('Users > /users/{userId} > GET > 404', (transaction, done) => {
  console.log('Modifying request for GET /users/{userId} 404');
  transaction.fullPath = '/users/99999'; // Non-existent ID
  done();
});

// Add more hooks here for other specific test cases as needed

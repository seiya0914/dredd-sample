// const hooks = require('hooks');
// const fetch = require('node-fetch'); // Ensure node-fetch is installed or use built-in http

// const API_URL = 'http://localhost:3000'; // Your API server URL

// // Hook to reset server state before each transaction
// hooks.beforeEach(async (transaction, done) => {
//     console.log(`Resetting server state before: ${transaction.name}`);
//     try {
//         const response = await fetch(`${API_URL}/debug/reset`, { method: 'POST' });
//         if (!response.ok) {
//             console.error(`Failed to reset state: ${response.status} ${response.statusText}`);
//             // Decide if you want to fail the test here
//             // done(new Error('Failed to reset server state'));
//             // return;
//         }
//          console.log(`Server state reset successful.`);
//     } catch (error) {
//         console.error('Error resetting server state:', error);
//         // Decide if you want to fail the test here
//         // done(error);
//         // return;
//     }
//     done(); // Proceed with the test
// });

// // Hook to modify request for POST /items > 400 test
// hooks.before('Items > /items > POST > 400', (transaction, done) => {
//   console.log('Modifying request for POST /items 400');
//   transaction.request.body = JSON.stringify({ name: "" }); // Invalid name
//   transaction.request.headers['Content-Type'] = 'application/json';
//   done();
// });

// // Hook to modify request for PUT /items/{itemId} > 400 test
// hooks.before('Items > /items/{itemId} > PUT > 400', (transaction, done) => {
//   console.log('Modifying request for PUT /items/{itemId} 400');
//   transaction.request.body = JSON.stringify({ name: "" }); // Invalid name
//   transaction.request.headers['Content-Type'] = 'application/json';
//   done();
// });

// // Hook to modify request for GET /items/{itemId} > 404 test
// hooks.before('Items > /items/{itemId} > GET > 404', (transaction, done) => {
//   console.log('Modifying request for GET /items/{itemId} 404');
//   transaction.fullPath = '/items/99999'; // Non-existent ID
//   done();
// });

// // Hook to modify request for PUT /items/{itemId} > 404 test
// hooks.before('Items > /items/{itemId} > PUT > 404', (transaction, done) => {
//   console.log('Modifying request for PUT /items/{itemId} 404');
//   transaction.fullPath = '/items/99999'; // Non-existent ID
//   done();
// });

// // Hook to modify request for GET /users/{userId} > 404 test
// hooks.before('Users > /users/{userId} > GET > 404', (transaction, done) => {
//   console.log('Modifying request for GET /users/{userId} 404');
//   transaction.fullPath = '/users/99999'; // Non-existent ID
//   done();
// });

const hooks = require('hooks');
const Ajv = require('ajv');
const addFormats = require('ajv-formats');

// Test: Add a simple beforeEach hook to see if any hook runs
hooks.beforeEach((transaction, done) => {
  hooks.log('>>> beforeEach hook running <<< Test Hook');
  done(); // Necessary for beforeEach
});

// Initialize Ajv
const ajv = new Ajv({ allErrors: true }); // allErrors: true helps in debugging
addFormats(ajv); // Add support for formats like date-time

// Hook to perform strict validation on GET /items response
hooks.beforeValidation('/items > Get a list of all items > 200 > application/json', (transaction) => {
  hooks.log('>>> ENTERING custom validation for GET /items <<<'); // Mark entry

  if (!transaction.expected || !transaction.expected.bodySchema) {
    hooks.log('!!! Skipping custom validation: Expected body schema not found.');
    hooks.log(`Transaction details: ${JSON.stringify(transaction, null, 2)}`); // Log transaction if schema missing
    return;
  }
  hooks.log('Expected body schema found.');
  // hooks.log(`Expected Schema (raw): ${JSON.stringify(transaction.expected.bodySchema)}`); // Log raw schema if needed (can be large)

  if (!transaction.real || !transaction.real.body) {
    hooks.log('!!! Skipping custom validation: Real body not found.');
    return;
  }
  hooks.log(`Real body found: ${transaction.real.body.substring(0, 200)}...`); // Log beginning of real body

  try {
    const schema = typeof transaction.expected.bodySchema === 'string'
      ? JSON.parse(transaction.expected.bodySchema)
      : transaction.expected.bodySchema;
    hooks.log(`Parsed schema type: ${typeof schema}, isArray: ${Array.isArray(schema)}`);
    hooks.log(`Schema keys: ${Object.keys(schema)}`);

    let appliedAdditionalProperties = false; // Flag to track change
    if (schema.type === 'array' && schema.items) {
      hooks.log(`Schema is array. Checking items schema: ${JSON.stringify(schema.items)}`);
      if (!schema.items.hasOwnProperty('additionalProperties')) {
           schema.items.additionalProperties = false;
           appliedAdditionalProperties = true;
           hooks.log('>>> Applied additionalProperties: false to items schema <<<');
      }
    } else {
        hooks.log('!!! Warning: Expected schema is not an array type as expected.');
    }

    hooks.log(`Schema to compile by Ajv (additionalProperties applied: ${appliedAdditionalProperties}): ${JSON.stringify(schema)}`);

    const validate = ajv.compile(schema);
    hooks.log('Ajv schema compiled.');

    const data = JSON.parse(transaction.real.body);
    hooks.log('Real body parsed.');

    const valid = validate(data);
    hooks.log(`>>> Ajv validation result: ${valid} <<<`);

    if (!valid) {
      hooks.log('!!! Custom validation failed:');
      hooks.log(`Validation Errors: ${JSON.stringify(validate.errors, null, 2)}`);

      transaction.test = transaction.test || {};
      transaction.test.status = 'fail';
      transaction.test.message = `Custom validation failed: ${ajv.errorsText(validate.errors)}`;
      transaction.results = transaction.results || {};
      transaction.results.errors = transaction.results.errors || [];
      transaction.results.errors.push({
          severity: 'error',
          message: `Custom AJV Validation Failed: ${ajv.errorsText(validate.errors)}`,
          details: validate.errors
      });
    } else {
      hooks.log('Custom validation passed.');
    }

  } catch (error) {
    hooks.log(`!!! Error during custom validation: ${error.message}\n${error.stack}`); // Log stack trace
    transaction.test = transaction.test || {};
    transaction.test.status = 'fail';
    transaction.test.message = `Error in custom validation hook: ${error.message}`;
  }
  hooks.log('>>> EXITING custom validation for GET /items <<<'); // Mark exit
});

// // Add more hooks here for other specific test cases as needed

// Example of a hook that resets the database before each test
// (Assuming you have a /debug/reset endpoint like in the original example)
// hooks.beforeEach((transaction, done) => {
//   const http = require('http');
//   const options = {
//     hostname: 'localhost',
//     port: 3000, // Adjust if your server runs on a different port
//     path: '/debug/reset',
//     method: 'POST',
//   };
//   const req = http.request(options, (res) => {
//     if (res.statusCode !== 204) {
//       hooks.log(`Warning: Failed to reset state before test. Status: ${res.statusCode}`);
//     }
//     done();
//   });
//   req.on('error', (e) => {
//     hooks.log(`Error resetting state: ${e.message}`);
//     done(); // Continue test even if reset fails, but log the error
//   });
//   req.end();
// });

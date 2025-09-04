const express = require('express');
const axios = require('axios');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

const AIRTABLE_TOKEN = process.env.AIRTABLE_PAT;
const BASE_ID = 'appEZQLiRm9cfnVkP'; // Growth AI base

// Logging array to store activity
let logs = [];

function log(message) {
  const timestamp = new Date().toISOString();
  const logEntry = `${timestamp}: ${message}`;
  console.log(logEntry);
  logs.push(logEntry);
  // Keep only last 100 logs
  if (logs.length > 100) {
    logs = logs.slice(-100);
  }
}

app.get('/', (req, res) => {
  res.json({
    status: 'Airtable Table Creator Agent',
    endpoints: {
      'GET /': 'This status page',
      'GET /health': 'Health check',
      'GET /logs': 'View recent logs',
      'POST /create-table': 'Create the team task list table',
      'POST /test': 'Test run - creates the table'
    }
  });
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    base_id: BASE_ID
  });
});

app.get('/logs', (req, res) => {
  res.json({ 
    logs: logs.slice(-20), // Return last 20 logs
    total_logs: logs.length 
  });
});

app.post('/create-table', async (req, res) => {
  try {
    log('Starting team task list table creation...');

    const tableSchema = {
      name: "Team Task List",
      description: "Daily/weekly team task management with assignments and completion tracking",
      fields: [
        {
          name: "Task Name",
          type: "singleLineText"
        },
        {
          name: "Team Member",
          type: "singleSelect",
          options: {
            choices: [
              { name: "Blake", color: "blueLight2" },
              { name: "Sarah", color: "cyanLight2" },
              { name: "Mike", color: "tealLight2" },
              { name: "Jessica", color: "greenLight2" },
              { name: "David", color: "yellowLight2" },
              { name: "Emma", color: "orangeLight2" },
              { name: "Alex", color: "redLight2" },
              { name: "Lisa", color: "pinkLight2" },
              { name: "Unassigned", color: "grayLight2" }
            ]
          }
        },
        {
          name: "Status",
          type: "singleSelect",
          options: {
            choices: [
              { name: "Not Started", color: "grayLight2" },
              { name: "In Progress", color: "yellowLight2" },
              { name: "Completed", color: "greenLight2" },
              { name: "On Hold", color: "orangeLight2" },
              { name: "Cancelled", color: "redLight2" }
            ]
          }
        },
        {
          name: "Priority",
          type: "singleSelect",
          options: {
            choices: [
              { name: "High", color: "redLight2" },
              { name: "Medium", color: "yellowLight2" },
              { name: "Low", color: "greenLight2" }
            ]
          }
        },
        {
          name: "Due Date",
          type: "date",
          options: {
            dateFormat: {
              name: "us"
            }
          }
        },
        {
          name: "Week Starting",
          type: "date",
          options: {
            dateFormat: {
              name: "us"
            }
          }
        },
        {
          name: "Description",
          type: "multilineText"
        },
        {
          name: "Time Estimate (hours)",
          type: "number",
          options: {
            precision: 1
          }
        },
        {
          name: "Completed Date",
          type: "date",
          options: {
            dateFormat: {
              name: "us"
            }
          }
        },
        {
          name: "Notes",
          type: "multilineText"
        },
        {
          name: "Created Date",
          type: "createdTime"
        },
        {
          name: "Last Modified",
          type: "lastModifiedTime"
        }
      ]
    };

    log(`Sending request to create table: ${tableSchema.name}`);

    const response = await axios.post(
      `https://api.airtable.com/v0/meta/bases/${BASE_ID}/tables`,
      tableSchema,
      {
        headers: {
          'Authorization': `Bearer ${AIRTABLE_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    log(`Table created successfully! Table ID: ${response.data.id}`);

    res.json({
      success: true,
      message: 'Team Task List table created successfully!',
      table: {
        id: response.data.id,
        name: response.data.name,
        fields: response.data.fields.length,
        base_id: BASE_ID
      },
      details: response.data
    });

  } catch (error) {
    log(`Error creating table: ${error.message}`);
    
    if (error.response) {
      log(`API Error Details: ${JSON.stringify(error.response.data)}`);
    }

    res.status(500).json({
      success: false,
      error: error.message,
      details: error.response?.data || 'No additional details available'
    });
  }
});

app.post('/test', async (req, res) => {
  try {
    log('Test run - creating team task list table...');
    
    // Call the create-table endpoint
    const createResponse = await axios.post(`http://localhost:${port}/create-table`);
    
    res.json({
      test_result: 'success',
      message: 'Test completed - table creation attempted',
      result: createResponse.data
    });
    
  } catch (error) {
    log(`Test failed: ${error.message}`);
    res.status(500).json({
      test_result: 'failed',
      error: error.message
    });
  }
});

app.listen(port, () => {
  log(`Airtable Table Creator Agent listening on port ${port}`);
});
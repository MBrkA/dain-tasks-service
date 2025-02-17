# Google Tasks DAIN Service

A DAIN service for managing Google Tasks. This service provides a comprehensive interface to interact with Google Tasks API, allowing users to manage task lists and tasks.

## Features

- Create, read, update and delete task lists
- Create, read, update and delete tasks
- List all task lists and tasks
- OAuth2 authentication with Google
- Comprehensive error handling
- UI components for better user interaction

## Prerequisites

- Node.js 14 or higher
- A Google Cloud Platform account
- Google Tasks API enabled
- OAuth2 credentials (Client ID and Client Secret)

## Environment Variables

The following environment variables need to be set in your `.env.development` file:

\`\`\`
DAIN_API_KEY=your_dain_api_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
TUNNEL_URL=your_tunnel_url (optional, defaults to http://localhost:2022)
\`\`\`

## Installation

1. Clone the repository
2. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`
3. Create `.env.development` file with required environment variables
4. Start the service:
   \`\`\`bash
   npm run dev
   \`\`\`

## Available Tools

- `list-tasklists`: List all task lists
- `get-tasklist`: Get a specific task list
- `create-tasklist`: Create a new task list
- `update-tasklist`: Update an existing task list
- `delete-tasklist`: Delete a task list
- `list-tasks`: List all tasks in a task list
- `create-task`: Create a new task
- `update-task`: Update an existing task
- `delete-task`: Delete a task

## Used prompts to generate this application:
- generate a dain application which utilizes google tasks. it will have four tools: list tasklists, get tasklist, create tasklist, list tasks. have google oauth before using tools
 (Added https://developers.google.com/tasks/reference/rest/v1/tasklists#TaskList, https://developers.google.com/tasks/reference/rest/v1/tasks/list, https://developers.google.com/tasks/reference/rest/v1/tasklists/get, https://developers.google.com/tasks/reference/rest/v1/tasklists/list to mentions)
- add a tool: delete tasklist
 (Added https://developers.google.com/tasks/reference/rest/v1/tasklists/delete to mentions)
- add a tool: update tasklist
 (Added https://developers.google.com/tasks/reference/rest/v1/tasklists/update to mentions)
- add three tools: delete task, create task, update task
 (Added https://developers.google.com/tasks/reference/rest/v1/tasks/delete, https://developers.google.com/tasks/reference/rest/v1/tasks/insert, https://developers.google.com/tasks/reference/rest/v1/tasks/update, https://developers.google.com/tasks/reference/rest/v1/tasks#Task to mentions)
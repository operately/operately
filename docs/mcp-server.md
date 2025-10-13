# MCP Server Implementation

This document describes the implementation of the MCP (Model Context Protocol) server for Operately.

## Overview

The MCP server exposes Operately data to AI agents through a standardized protocol. It is implemented using the [Hermes MCP](https://github.com/cloudwalk/hermes-mcp) library.

The server implements two MCP capabilities:
1. **Tools** - Actions that can be invoked to interact with Operately
2. **Resources** - Data that can be discovered and fetched using URIs

## Endpoint

The MCP server is available at: `{app.operately.com}/mcp`

## Tools

The server provides four tools:

### 1. switch_organization

**Purpose**: Sets the internal context of the conversation to a specific organization.

**Parameters**:
- `company_id` (required, string): The ID of the company to switch to
- `person_id` (required, string): The ID of the person making the switch

**Response**: 
```json
{
  "success": true,
  "message": "Switched to organization: Company Name",
  "company": {
    "id": "company_id",
    "name": "Company Name"
  },
  "person": {
    "id": "person_id", 
    "full_name": "Person Name",
    "email": "person@company.com"
  }
}
```

### 2. get_work_map

**Purpose**: Returns the work map from the current organization set in the context.

**Parameters**: None

**Prerequisites**: Must call `switch_organization` first to set context.

**Response**: 
```json
{
  "success": true,
  "work_map": "...markdown content..."
}
```

### 3. get_goal

**Purpose**: Returns information about a specific goal.

**Parameters**:
- `id` (required, string): The ID of the goal to retrieve

**Prerequisites**: Must call `switch_organization` first to set context.

**Response**: 
```json
{
  "success": true,
  "goal": "...markdown content..."
}
```

### 4. get_project

**Purpose**: Returns information about a specific project.

**Parameters**:
- `id` (required, string): The ID of the project to retrieve

**Prerequisites**: Must call `switch_organization` first to set context.

**Response**: 
```json
{
  "success": true,
  "project": "...markdown content..."
}
```

## Resources

Resources provide a way to discover and fetch Operately data using URIs. This follows the MCP specification for resource-based data access, enabling AI agents to search and fetch information.

### Available Resources

#### 1. operately://goals

**Purpose**: List all goals in the current organization.

**Prerequisites**: Must call `switch_organization` tool first to set context.

**Response**:
```json
{
  "goals": [
    {
      "id": "goal_id_1",
      "name": "Goal Name 1",
      "uri": "operately://goals/goal_id_1"
    },
    {
      "id": "goal_id_2",
      "name": "Goal Name 2",
      "uri": "operately://goals/goal_id_2"
    }
  ]
}
```

#### 2. operately://goals/{id}

**Purpose**: Fetch detailed information about a specific goal.

**Prerequisites**: Must call `switch_organization` tool first to set context.

**Response**: Returns markdown-formatted goal details including:
- Goal description
- Champion and reviewer information
- Associated projects
- Progress updates
- Targets and milestones

#### 3. operately://projects

**Purpose**: List all projects in the current organization.

**Prerequisites**: Must call `switch_organization` tool first to set context.

**Response**:
```json
{
  "projects": [
    {
      "id": "project_id_1",
      "name": "Project Name 1",
      "uri": "operately://projects/project_id_1"
    },
    {
      "id": "project_id_2",
      "name": "Project Name 2",
      "uri": "operately://projects/project_id_2"
    }
  ]
}
```

#### 4. operately://projects/{id}

**Purpose**: Fetch detailed information about a specific project.

**Prerequisites**: Must call `switch_organization` tool first to set context.

**Response**: Returns markdown-formatted project details including:
- Project description
- Champion and reviewer information
- Milestones and tasks
- Check-ins and updates
- Contributors

## Workflow: Search and Fetch

The resources capability enables a "search and fetch" workflow for AI agents:

1. **Search**: Use list resources (`operately://goals` or `operately://projects`) to discover available items
2. **Fetch**: Use specific resource URIs to retrieve detailed information about individual items

**Example workflow**:
```
1. Agent: Read resource "operately://goals"
   → Returns list of goals with URIs

2. Agent: Read resource "operately://goals/abc123"
   → Returns detailed markdown content for goal abc123
```

This pattern allows AI agents to efficiently discover and access Operately data without requiring specific IDs upfront.

## Error Responses

### Tool Errors
All tools can return error responses in the following format:
```json
{
  "success": false,
### Resource Errors
Resources return MCP-standard error codes:
- `-32002`: Invalid state (e.g., no organization context set)
- `-32602`: Invalid parameters (e.g., malformed ID)
- `-32603`: Internal error (e.g., database error)

## Implementation Details

### Files Added/Modified

1. **`app/mix.exs`**: Added `hermes_mcp` dependency
2. **`app/lib/operately/mcp/server.ex`**: Main MCP server implementation with tools and resources
3. **`app/lib/operately/application.ex`**: Added MCP server to supervision tree
4. **`app/lib/operately_web/router.ex`**: Added `/mcp` endpoint
5. **`app/test/operately/mcp/server_test.exs`**: Tests for MCP server functionality
6. **`app/test/support/mcp_test_helper.ex`**: Test helper for MCP server logic
7. **`docs/mcp-server.md`**: This documentation

### Architecture

The MCP server uses Hermes.Server with the following components:

- **Transport**: StreamableHTTP for web-based connections
- **Capabilities**: Tools and Resources (following MCP specification)
- **State Management**: Uses frame assigns to maintain session context
- **Error Handling**: Comprehensive error responses for invalid inputs
- **Authentication**: Relies on Operately's existing access control

### Security

- Person must belong to the specified company
- All data access uses existing Operately permission system
- Context validation ensures data isolation between organizations
- Uses existing API endpoints that respect access controls
- Resources require organization context to be set via tools

## Usage Examples

### Example 1: Using Tools

```json
// First, set the organization context
{
  "tool": "switch_organization",
  "params": {
    "company_id": "12345", 
    "person_id": "67890"
  }
}

// Then use other tools
{
  "tool": "get_work_map",
  "params": {}
}

{
  "tool": "get_goal", 
  "params": {
    "id": "goal-id-here"
  }
}

{
  "tool": "get_project",
  "params": {
    "id": "project-id-here" 
  }
}
```

### Example 2: Search and Fetch with Resources

```json
// Step 1: Set organization context (required)
Tool: switch_organization
Params: { "company_id": "12345", "person_id": "67890" }

// Step 2: Search - List all goals
Resource: operately://goals
Response: {
  "goals": [
    { "id": "g1", "name": "Q4 Revenue", "uri": "operately://goals/g1" },
    { "id": "g2", "name": "Product Launch", "uri": "operately://goals/g2" }
  ]
}

// Step 3: Fetch - Get specific goal details
Resource: operately://goals/g1
Response: "# Q4 Revenue\n\n**Status**: On Track\n**Champion**: John Doe\n..."

// Step 4: Search - List all projects
Resource: operately://projects
Response: {
  "projects": [
    { "id": "p1", "name": "Website Redesign", "uri": "operately://projects/p1" },
    { "id": "p2", "name": "Mobile App", "uri": "operately://projects/p2" }
  ]
}

// Step 5: Fetch - Get specific project details
Resource: operately://projects/p1
Response: "# Website Redesign\n\n**Status**: In Progress\n**Champion**: Jane Smith\n..."
```
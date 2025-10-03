# MCP Server Implementation

This document describes the implementation of the MCP (Model Context Protocol) server for Operately.

## Overview

The MCP server exposes Operately data to AI agents through a standardized protocol. It is implemented using the [Hermes MCP](https://github.com/cloudwalk/hermes-mcp) library.

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

## Error Responses

All tools can return error responses in the following format:
```json
{
  "success": false,
  "error": "Error description"
}
```

## Implementation Details

### Files Added/Modified

1. **`app/mix.exs`**: Added `hermes_mcp` dependency
2. **`app/lib/operately/mcp/server.ex`**: Main MCP server implementation
3. **`app/lib/operately/application.ex`**: Added MCP server to supervision tree
4. **`app/lib/operately_web/router.ex`**: Added `/mcp` endpoint
5. **`app/test/operately/mcp/server_test.exs`**: Tests for MCP server functionality
6. **`app/test/support/mcp_test_helper.ex`**: Test helper for MCP server logic

### Architecture

The MCP server uses Hermes.Server with the following components:

- **Transport**: StreamableHTTP for web-based connections
- **Capabilities**: Tools (no resources or prompts)
- **State Management**: Uses frame assigns to maintain session context
- **Error Handling**: Comprehensive error responses for invalid inputs
- **Authentication**: Relies on Operately's existing access control

### Security

- Person must belong to the specified company
- All data access uses existing Operately permission system
- Context validation ensures data isolation between organizations
- Uses existing API endpoints that respect access controls

## Usage Example

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
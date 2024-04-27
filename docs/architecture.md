# Architecture Overview

This document provides a comprehensive overview of the architecture for Operately, a project 
developed using Elixir for backend services, React with TypeScript for the frontend, and GraphQL
for data querying capabilities. The purpose of this document is to outline the project 
structure, key technologies, and individual components.

Table of Contents:

- [Technologies](#technologies)
- [Project Directory Structure](#project-directory-structure)
- [Frontend Directory Structure](#frontend-directory-structure)
- [Backend Directory Structure](#backend-directory-structure)
- [Database Schema](#database-schema)
- [Operations](#operations)
- [Data flow](#data-flow)

## Technologies

- **Frontend**: React (TypeScript) + Apollo Client (GraphQL)
- **Backend**: Elixir (Phoenix Framework) + Absinthe (GraphQL)
- **Database**: PostgreSQL
- **Background Jobs Processing**: Oban
- **Email Notifications**: Bamboo

## Project Directory Structure

- `assets` - Contains all frontend code, including React components, styles, and GraphQL queries.
- `lib` - Contains all backend code, including Elixir modules, GraphQL schemas, and Phoenix controllers, Bamboo email notifications.
- `priv` - Contains private files, such as static assets, seeds, and configuration files.
- `config` - Contains configuration files for the application, including database settings, environment variables, and routes.
- `test` - Contains test files for backend modules and e2e tests that cover both frontend and backend code.

## Frontend Directory Structure

The frontend of Operately is built using React with TypeScript, following a component-based
architecture. The project uses Apollo Client for GraphQL data fetching and state management.

The directory structure follows a typical React project layout:

- `assets/js/components` - Contains reusable UI components, such as buttons,
  forms, and modals. No business logic should be present in these components, nor
  should they make direct API calls.

- `assets/js/pages` - Contains top-level components that represent different pages
  of the application. These components can fetch data from the API and pass it down
  to child components.

- `assets/js/features` - Contains feature-specific components, such as project
  management, goal tracking, and various forms. These components can contain
  business logic and make API calls.

- `assets/js/models` - Contains logic for fetching and manipulating data, as well as
  GraphQL queries and mutations. This directory is intended to encapsulate all data
  fetching logic and keep it separate from the UI components.

- `assets/js/gql` - Contains GraphQL queries and mutations used by the Apollo Client
  Client to fetch data from the backend. Typescript interfaces, types, and functions
  are generated from these queries and mutations with the help of `graphql-codegen`.

- `assets/js/graphql` - (DEPRECATED) Contains GraphQL queries and mutations used by 
  the Apollo Client the client initialization and cache setup. Do not add new queries
  to this directory, use `assets/js/gql` or `assets/js/models` instead.

- `assets/js/routes` - Contains route definitions for the application, using `react-router-dom`
  for client-side routing. Each route corresponds to a page component in `assets/js/pages`.

- `asserts/js/utils` - Contains utility functions used across the frontend application. E.g. 
  date formatting, string manipulation, utility hooks, etc.

## Backend Directory Structure

The backend of Operately is built using Elixir with the Phoenix Framework and Absinthe for
GraphQL support. The communication between the frontend and backend is done mostly through
GraphQL queries and mutations, except for some specific cases where RESTful endpoints are used,
e.g. for file uploads, authentication, etc.

The directory structure follows a typical Phoenix project layout:

- `lib/operately` - Contains the core business logic of the application, including
  database models, context modules, and services. This directory is responsible for
  handling all business logic and data manipulation.

- `lib/operately_web` - Contains the web interface of the application, including
  controllers, views, and GraphQL schemas. This directory is responsible for
  handling HTTP requests, rendering views, and serving GraphQL queries.

- `lib/operately_web/graphql` - Contains GraphQL schemas, queries, mutations, and
  resolvers. This directory is responsible for defining the GraphQL API and
  handling data fetching and manipulation.

- `lib/operately_web/controllers` - Contains controllers that handle HTTP requests
  and responses. These controllers interact with the context modules to fetch data
  and send it back to the client. Mostly used for Session management and file uploads.

- `lib/operately_email` - Contains email notification modules using Bamboo. This directory
  is responsible for sending email notifications to users based on specific events or triggers.

## Database Schema

Operately uses PostgreSQL as its primary database. The database schema is designed to
support the core features of the application, such as projects, goals, tasks, users,
and notifications. The schema is normalized to reduce redundancy and improve data integrity.

The database schema consists of the following tables:

- `accounts` - Contains user account information, such as email, password, and role.
- `companies` - Contains company information, such as name, logo, and description.
- `people` - Contains user profile information, such as name, avatar, and bio.

An account can be associated with multiple companies, and a company can have multiple people.

- `projects` - Contains project information, such as name, description, and status.
- `goals` - Contains goal information, such as title, description, and due date.
- `tasks` - Contains task information, such as title, description, and status.
- `groups` - (In the app called "Spaces") Contains group information, such as name, description, and members.
- `blobs` - Contains file uploads information, such as filename, content type, and size.

Operately stores every data change in the application, including user actions, project updates, deletions, or
any other significant event. When a user performs an action, a corresponding activity record is created in the
database to track the change.

- `activities` - Contains activity information, such as action type, user ID, and timestamp.
- `notifications` - Contains notification information, such as message, recipient ID, and status.

An activity will be associated with multiple notifications.

## Operations

Operately does not change the data in the database directly. Instead, it uses a set of operations
to manipulate the data. These operations are defined in the `Operately.Operations` module and are
used throughout the application to ensure consistency and data integrity.

An operation is a module that encapsulates a specific action, such as creating a project, updating
a goal, or deleting a task. Each operation module exposes a single function, `run`, that takes the
necessary parameters and performs the action. The operation function is responsible for validating
the input, executing the action, and handling any errors that may occur.

The typical flow of an operation is as follows:

1. Validate the input parameters.
2. Start a database transaction.
3. Perform the action (e.g., create, update, delete).
4. Create an activity record to track the change.
5. Trigger any necessary notifications to inform users of the change.
6. Commit the transaction if successful, rollback if an error occurs.

By using operations, Operately ensures that all data changes are consistent and that the application
keep track of every action performed by users.

The created activity records are used to generate notifications for users, displaying activity feeds
for projects, goals, tasks, and other entities.

## Data flow

The data flow in Operately typically follows these steps:

#### Querying data

1. The frontend sends a GraphQL query to the backend.
2. The backend resolves the query by fetching data from the database using the appropriate context module.
3. The backend returns the data to the frontend, which displays it to the user.

#### Mutating data

1. The frontend sends a GraphQL mutation to the backend.
2. The backend resolves the mutation by running the corresponding operation from `Operately.Operations`.
3. The operation performs the necessary action, such as creating a project or updating a goal.
4. The operation creates an activity record to track the change.
5. The operation triggers any necessary notifications to inform users of the change.
6. The backend returns the updated data to the frontend, which displays it to the user.

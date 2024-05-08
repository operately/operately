# Pages, Routes and Data Loading

On the front-end, Operately is a React based application that uses `react-routes-dom` for routing. 
The application is structured in a way that each page is a React component that is rendered when 
a specific route is matched.

In this document, we will explain how pages are structured, how data is loaded for pages, and how
pages are connected to routes.

- [Pages](#pages)
- [Creating new pages](#creating-new-pages)
- [Data Loading](#data-loading)
- [Routes](#routes)
- [Naming conventions](#naming-conventions)

## Pages

Pages are located in the `assets/pages/` directory. Each page is a module that exports a `Page`
React component, and a `loader` function that is used to load data for the page. The `loader` function
is called by the router before the page is rendered.

Here is an example of a page module that loads a project by id and renders the project name:

```tsx
import * as React from "react";
import * as Projects from "@/models/projects";
import * as Pages from "@/components/Pages";

interface LoaderResult {
  project: Projects.Project[];
}

export async function loader({params}) : Promise<LoaderResult> {
  return {
    project: await Projects.getProject({ id: params["id"] }),
  };
}

export function Page() {
  const { project } = Pages.useLoaderData<LoaderResult>();

  return (
    <div>{project.name}</div>
  );
}
```

## Creating new pages

To create a new page, run the following command:

```bash
make gen.page NAME=MyNewPage
```

This will create a new page module in the `assets/pages/MyNewPage` directory. The module will contain
a `Page` component and a `loader` function. You can edit the `loader` function to load the data that
the page needs, and edit the `Page` component to render the data.

To add a route for the new page, edit the `assets/routes/index.tsx` file and add a new route that matches
the path for the new page and renders the new page component.

```tsx
...
  pageRoute("/my-new-page", MyNewPagePage),
...
```

That's it! You can now visit the `/my-new-page` path in the browser and see the new page.

## Data Loading

The `loader` function is used to load data for the page. The `loader` function is an async function
that is passed to `react-router` as the `loader` prop for the route.

Read the documentation for the `react-router` `loader` prop [here](https://reactrouter.com/en/main/route/loader).

The `loader` function is called by the router before the page is rendered. The `loader` function is passed
an object with the following properties:

- `params`: An object containing the route parameters.
- `request`: The current request object.

The `params` object contains the route parameters. For example, if the route path is `/projects/:id`,
and the URL is `/projects/123`, the `params` object will be `{ id: "123" }`.

```tsx
export async function loader({params}) : Promise<LoaderResult> {
  const id = params["id"];

  return {
    project: await Projects.getProject({ id }),
  };
}
```

The `request` object contains the current request object. The request object is an instance of the
Fetch Request object. You can use the request object to access the search parameters, headers, and other
request properties.

```tsx
export async function loader({params, request}) : Promise<LoaderResult> {
  const url = new URL(request.url);
  const projectState = url.searchParams.get("state");

  reutrn {
    project: await Projects.getProject({ id: params["id"], state: projectState }),
  };
}
```

## Routes

Routes are defined in the `assets/routes/index.tsx` file.

Here is an example of a route that matches the `/projects/:id` path and renders the `ProjectPage`:

```tsx
pageRoute("/projects/:id", ProjectPage),
```

The `pageRoute` function is a helper function that creates a route object that matches the given path
and renders the given page component.

## Naming conventions

- Page modules should be named using `PascalCase` (e.g. `assets/pages/MyNewPage`).
- Page modules should end with `Page` (e.g. `MyNewPagePage`).

The page name should resemble the route path, for example:

- `/projects/:id` -> `ProjectsPage`
- `/projects/:id/tasks` -> `ProjectTasksPage`
- `/projects/:id/tasks/:taskId` -> `ProjectTaskPage`
- `/projects/new` -> `ProjectsNewPage`
- `/projects/:id/edit` -> `ProjectEditPage`

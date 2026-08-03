# Operately Repo Getter

`Operately.Repo.Getter` is the standard way to load one Ecto resource while
enforcing the requester's access level. Extend it with schema-declared profiles
when a table contains different resource kinds or a resource can inherit access
from different parents. Do not create a resource-specific Getter wrapper for
these cases.

## Standard usage

Add Getter to the schema and include `request_info()`:

```elixir
defmodule Operately.Example do
  use Operately.Schema
  use Operately.Repo.Getter

  schema "examples" do
    has_one :access_context, Operately.Access.Context, foreign_key: :example_id
    request_info()
  end
end
```

Then call `get/2` or `get!/2`:

```elixir
Example.get(person, id: id)
Example.get(person.id, id: id, opts: [required_access_level: Binding.edit_access()])
Example.get!(:system, id: id)
```

`get/2` returns `{:ok, resource}` or `{:error, :not_found}`. A loaded resource's
`request_info` contains the canonical requester, effective access level, and
whether it was a system request. `get!/2` raises `Ecto.NoResultsError` when the
resource is unavailable.

Supported options are:

- `preload`: ordinary Ecto preloads.
- `auth_preload`: top-level associations filtered through their own default
  Getter profile. For `:system`, these behave like ordinary preloads.
- `required_access_level`: minimum `Operately.Access.Binding` level; defaults
  to view access.
- `with_deleted`: includes soft-deleted records.
- `after_load`: unary functions run after authorization and preloading.
- `getter_profile`: selects a schema-declared profile; defaults to `:default`.

Schemas without `getter_profile/1` are unchanged: Getter applies no additional
scope and authorizes through `:access_context`. This also preserves schemas that
only use Getter with the `:system` requester and do not have an access context.

## Getter profiles

A profile keeps row selection and authorization paths together:

```elixir
alias Operately.Repo.Getter.Profile

has_one :project_access_context, Operately.Access.Context, foreign_key: :project_id
has_one :space_access_context, through: [:group, :access_context]

def getter_profile(:default) do
  %Profile{
    scope: &scope_projects/1,
    access_contexts: [:project_access_context]
  }
end

def getter_profile(:template) do
  %Profile{
    scope: &scope_templates/1,
    access_contexts: [:space_access_context]
  }
end

def getter_profile(_), do: nil

defp scope_projects(query) do
  where(query, [resource: project], project.kind == :project)
end

defp scope_templates(query) do
  where(query, [resource: project], project.kind == :template)
end
```

Callers select only the name:

```elixir
Project.get(person, id: id)
Project.get(person, id: id, opts: [getter_profile: :template])
```

Do not accept caller-provided scopes, functions, or association paths. A domain
context such as `ProjectTemplates` should expose a focused function that selects
the named profile internally.

Profile rules:

- `scope` is `nil` or a unary function returning an `Ecto.Query`.
- Scope queries must preserve the root's `:resource` named binding.
- Scopes run for both people and `:system`; system requests bypass authorization,
  not resource classification.
- `access_contexts` is a non-empty list of unique, named Ecto associations that
  resolve to `Operately.Access.Context`.
- Use explicit direct or through associations. Do not encode raw join paths in
  a profile.
- When several paths grant access, Getter uses the highest matching access
  level.
- When a schema declares multiple named profiles, return `nil` for unknown
  names so Getter can raise a diagnostic error. Schemas with only `:default`
  do not need a catch-all clause.

## Polymorphic parents

For a row that belongs to one of several parents, declare one access-context
association per parent and list all of them in the default profile:

```elixir
has_one :project_access_context, through: [:project, :access_context]
has_one :space_access_context, through: [:space, :access_context]

def getter_profile(:default) do
  %Profile{access_contexts: [:project_access_context, :space_access_context]}
end
```

This is the Task pattern. The same approach works for deeper through paths,
such as resource-hub children resolving access through a hub's space, project,
or goal.

## Tests

When adding or changing a profile, cover:

- Default and explicitly selected profile behavior.
- Scope isolation, including `:system` requests.
- Every declared parent/access-context path.
- Allowed and denied requesters and `required_access_level` boundaries.
- The maximum effective level when multiple paths match.
- `get!`, preloads, auth preloads, soft deletion, or after-load hooks when the
  resource previously customized those behaviors.

If associations are insufficient for a recurring authorization shape, improve
the shared Getter with focused tests and documentation instead of duplicating
its requester dispatch, access checks, or loading pipeline.

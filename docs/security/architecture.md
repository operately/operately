# Security Architecture

Access Levels:

- 0   - No Access
- 10  - View Access
- 30  - Comment Access
- 60  - Edit Access
- 100 - Full Access

Privacy Levels:

- 0   - Secret
- 30  - Confidential
- 60  - Internal
- 100 - Public

## Database Tables

Access Context:

+-----------------+-----------------------------+
| columns         | type                        |
+-----------------+-----------------------------+
| id              | primary id                  |
| resource_id     | id of the resource          |
| resource_type   | type of the resource        |
| privacy_level   | privacy level               |
+-----------------+-----------------------------+

Access Groups:

+-----------------+-----------------------------+
| columns         | type                        |
+-----------------+-----------------------------+
| id              | primary id                  |
+-----------------+-----------------------------+

Access Group Membership:

+-----------------+-----------------------------+
| columns         | type                        |
+-----------------+-----------------------------+
| id              | primary id                  |
| access_group_id | id of the group             |
| person_id       | id of the person            |
+-----------------+-----------------------------+

Access Binding:

+-----------------+-----------------------------+
| columns         | type                        |
+-----------------+-----------------------------+
| id              | primary id                  |
| access_group_id | id of the subject           |
| context_id      | id of the context           |
| access_level    | access level                |
+-----------------+-----------------------------+

{subject} has {access_level} to {context}

"John" has "read-access" to "Project A"
"Organization Members" have "write-access" to "Project A"
"Product Space Members" have "read-access" to "Project A"

## Querying Access

Given a {subject} and a {context}, we can query the access level:

```elixir

from a in Activities,
  inner_join: b in AccessBindings, on: b.context_id == a.access_context_id,
  inner_join: s in AccessGroups, on: b.access_group_id == s.id,
  inner_join: c in AccessGroupMembership, on: c.person_id == ^person.id






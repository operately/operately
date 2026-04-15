defmodule Operately.ApiDocs.MarkdownTest do
  use ExUnit.Case

  alias Operately.ApiDocs.Markdown

  test "renders endpoint reference tables with required/null/default and type details" do
    types = %{
      primitives: %{id: [encoded_type: :string]},
      objects: %{},
      unions: %{},
      enums: %{status: [:open, :closed]},
      int_enums: %{}
    }

    endpoint = %{
      full_name: "tasks/create",
      namespace_segment: "tasks",
      name: "create",
      type: :mutation,
      method: "POST",
      path: "/api/external/v1/tasks/create",
      handler: "OperatelyWeb.Api.Tasks.Create",
      inputs: [
        {:name, :string, [optional: false, null: false]},
        {:status, :status, [optional: true, null: false, default: :open]},
        {:tags, {:list, :id}, [optional: true, null: true]}
      ],
      outputs: [
        {:success, :boolean, [optional: false, null: false]}
      ]
    }

    page = Markdown.endpoint_page(endpoint, types)

    assert page =~ ~s(title: "Tasks API: Create")
    assert page =~ ~s(description: "Create with the Operately Tasks API.")
    assert page =~ ~s(<div style={{ overflowX: "auto" }}>)
    assert page =~ ~s(<th style={{ whiteSpace: "nowrap" }}>Field</th>)
    assert page =~ ~s(<th style={{ whiteSpace: "normal" }}>Type</th>)
    assert page =~ ~s(<td style={{ whiteSpace: "nowrap" }}><code>name</code></td>)
    assert page =~ ~s(<td style={{ whiteSpace: "normal" }}><code>string</code></td>)
    assert page =~ ~s(<td style={{ whiteSpace: "nowrap" }}>Yes</td>)
    assert page =~ ~s(<td style={{ whiteSpace: "nowrap" }}><code>:open</code></td>)
    assert page =~ ~s{array of <code>id</code> primitive (encoded as <code>string</code>)}
    assert page =~ "| `success` | `boolean` | Yes | No |"
    assert page =~ ~s(import CurlExampleBlock from "@components/CurlExampleBlock.jsx")
    assert page =~ "## cURL Example"
    assert page =~ "<CurlExampleBlock client:load command={"
    assert page =~ "curl --request POST"
    assert page =~ "https://app.operately.com/api/external/v1/tasks/create"
    assert page =~ "Authorization: Bearer ${OPERATELY_API_TOKEN}"
    assert page =~ "Content-Type: application/json"
    assert page =~ ~s(--data ')
    assert page =~ "## Response Example"
    assert page =~ "```json"
    assert page =~ ~s("success": true)

    {curl_pos, _} = :binary.match(page, "## cURL Example")
    {response_pos, _} = :binary.match(page, "## Response Example")
    assert curl_pos < response_pos
  end

  test "does not render response example when endpoint has no outputs" do
    endpoint = %{
      full_name: "notifications/mark_all_as_read",
      name: "mark_all_as_read",
      type: :mutation,
      method: "POST",
      path: "/api/external/v1/notifications/mark_all_as_read",
      handler: "OperatelyWeb.Api.Notifications.MarkAllAsRead",
      inputs: [],
      outputs: []
    }

    types = %{primitives: %{}, objects: %{}, unions: %{}, enums: %{}}

    page = Markdown.endpoint_page(endpoint, types)

    refute page =~ "## Response Example"
    refute page =~ "```json"
  end

  test "humanizes namespace and operation slugs in titles, descriptions, and links" do
    types = %{primitives: %{}, objects: %{}, unions: %{}, enums: %{}, int_enums: %{}}

    endpoint = %{
      full_name: "companies/update_members_permissions",
      namespace_segment: "companies",
      name: "update_members_permissions",
      type: :mutation,
      method: "POST",
      path: "/api/external/v1/companies/update_members_permissions",
      handler: "OperatelyWeb.Api.Companies.UpdateMembersPermissions",
      inputs: [],
      outputs: []
    }

    endpoint_page = Markdown.endpoint_page(endpoint, types)
    namespace_page = Markdown.namespace_index("companies", [endpoint])

    assert endpoint_page =~ ~s(title: "Companies API: Update members permissions")
    assert endpoint_page =~ ~s(description: "Update members permissions with the Operately Companies API.")
    assert namespace_page =~ "title: Companies API"
    assert namespace_page =~ ~s(<a href="./update_members_permissions">Update members permissions</a>)
  end

  test "renders root endpoints in api index without a root namespace section" do
    catalog = %{
      namespaces: ["root", "goals"],
      endpoints_by_namespace: %{
        "root" => [
          %{
            name: "get_account",
            method: "GET",
            type: :query,
            path: "/api/external/v1/get_account"
          }
        ],
        "goals" => [
          %{
            name: "update_name",
            method: "POST",
            type: :mutation,
            path: "/api/external/v1/goals/update_name"
          }
        ]
      }
    }

    page = Markdown.api_index(catalog)

    assert page =~ "title: Operately API"
    assert page =~ "description: Browse the Operately API reference by namespace."
    assert page =~ "## Endpoint Namespaces"
    assert page =~ "## Other Endpoints"
    assert page =~ "[Goals API](./goals)"
    assert page =~ ~s(<a href="./get_account">Get account</a>)
    assert page =~ ~s(<div style={{ overflowX: "auto" }}>)
    assert page =~ ~s(<table style={{ minWidth: "52rem", whiteSpace: "nowrap" }}>)
    refute page =~ "[Root](./root)"

    {namespaces_pos, _} = :binary.match(page, "## Endpoint Namespaces")
    {other_endpoints_pos, _} = :binary.match(page, "## Other Endpoints")
    assert namespaces_pos < other_endpoints_pos
  end

  test "renders namespace index with horizontal scrolling endpoint table" do
    page =
      Markdown.namespace_index("goals", [
        %{
          name: "update_name",
          method: "POST",
          type: :mutation,
          path: "/api/external/v1/goals/update_name"
        }
      ])

    assert page =~ "title: Goals API"
    assert page =~ "description: Browse endpoints in the Operately Goals API."
    assert page =~ ~s(<div style={{ overflowX: "auto" }}>)
    assert page =~ ~s(<table style={{ minWidth: "52rem", whiteSpace: "nowrap" }}>)
    assert page =~ ~s(<a href="./update_name">Update name</a>)
    assert page =~ ~s(<code>/api/external/v1/goals/update_name</code>)
  end
end

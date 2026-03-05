defmodule Operately.ApiDocs.CurlExampleTest do
  use ExUnit.Case

  alias Operately.ApiDocs.CurlExample

  test "renders GET curl with placeholders for scalars, enums, lists, objects, primitives, and unknown types" do
    types = %{
      primitives: %{id: [encoded_type: :string]},
      objects: %{
        filters: %{
          fields: [
            {:status, :status, [optional: false, null: false]},
            {:limit, :integer, [optional: true, null: false]}
          ]
        }
      },
      unions: %{search_filter: [:filters, :string]},
      enums: %{status: [:open, :closed]}
    }

    endpoint = %{
      type: :query,
      path: "/api/external/v1/tasks/list",
      inputs: [
        {:id, :id, [optional: false, null: false]},
        {:filters, :filters, [optional: true, null: true]},
        {:tags, {:list, :string}, [optional: true, null: true]},
        {:state, :status, [optional: true, null: true]},
        {:unknown, :unknown_type, [optional: true, null: true]},
        {:union, :search_filter, [optional: true, null: true]}
      ]
    }

    output = CurlExample.render(endpoint, types)

    assert output =~ "```bash"
    assert output =~ "curl --request GET"
    assert output =~ ~s(--url "https://app.operately.com/api/external/v1/tasks/list?)
    assert output =~ "id=value"
    assert output =~ "filters[status]=open"
    assert output =~ "filters[limit]=123"
    assert output =~ "tags[]=value"
    assert output =~ "state=open"
    assert output =~ "unknown=%3Cunknown_type%3E"
    assert output =~ "union=%3Csearch_filter%3E"
    assert output =~ ~s(--header "Authorization: Bearer ${OPERATELY_API_TOKEN}")
  end

  test "renders POST curl with json body placeholders and all fields" do
    types = %{
      primitives: %{id: [encoded_type: :string]},
      objects: %{
        assignee_input: %{
          fields: [
            {:id, :id, [optional: false, null: false]},
            {:admin, :boolean, [optional: true, null: true]}
          ]
        }
      },
      unions: %{},
      enums: %{priority: [:high, :medium, :low]}
    }

    endpoint = %{
      type: :mutation,
      path: "/api/external/v1/tasks/create",
      inputs: [
        {:name, :string, [optional: false, null: false]},
        {:priority, :priority, [optional: true, null: true]},
        {:assignee, :assignee_input, [optional: true, null: true]},
        {:watcher_ids, {:list, :id}, [optional: true, null: true]}
      ]
    }

    output = CurlExample.render(endpoint, types)

    assert output =~ "curl --request POST"
    assert output =~ ~s(--url "https://app.operately.com/api/external/v1/tasks/create")
    assert output =~ ~s(--header "Authorization: Bearer ${OPERATELY_API_TOKEN}")
    assert output =~ ~s(--header "Content-Type: application/json")
    assert output =~ ~s(--data ')
    assert output =~ ~s(, ")
    assert output =~ ~s("name":"value")
    assert output =~ ~s("priority":"high")
    assert output =~ ~s("assignee":{)
    assert output =~ ~s("admin":true)
    assert output =~ ~s("id":"value")
    assert output =~ ~s("watcher_ids":["value"])
  end

  test "omits query string and request body when endpoint has no inputs" do
    query_output =
      CurlExample.render(
        %{
          type: :query,
          path: "/api/external/v1/get_account",
          inputs: []
        },
        %{primitives: %{}, objects: %{}, unions: %{}, enums: %{}}
      )

    mutation_output =
      CurlExample.render(
        %{
          type: :mutation,
          path: "/api/external/v1/mark_all_notifications_as_read",
          inputs: []
        },
        %{primitives: %{}, objects: %{}, unions: %{}, enums: %{}}
      )

    assert query_output =~ ~s(--url "https://app.operately.com/api/external/v1/get_account")
    refute query_output =~ "get_account?"

    assert mutation_output =~ ~s(--url "https://app.operately.com/api/external/v1/mark_all_notifications_as_read")
    refute mutation_output =~ "--header \"Content-Type: application/json\""
    refute mutation_output =~ "--data "
  end

  test "falls back safely for recursive input object types" do
    types = %{
      primitives: %{},
      objects: %{
        recursive_node: %{
          fields: [
            {:name, :string, [optional: false, null: false]},
            {:child, :recursive_node, [optional: true, null: true]}
          ]
        }
      },
      unions: %{},
      enums: %{}
    }

    endpoint = %{
      type: :mutation,
      path: "/api/external/v1/tree/upsert",
      inputs: [
        {:node, :recursive_node, [optional: false, null: false]}
      ]
    }

    output = CurlExample.render(endpoint, types)

    assert output =~ ~s("node":{)
    assert output =~ ~s("child":"<recursive_node>")
    assert output =~ ~s("name":"value")
  end
end

defmodule Operately.ApiDocs.ResponseExampleTest do
  use ExUnit.Case

  alias Operately.ApiDocs.ResponseExample

  test "renders valid json and keeps nested object resources shallow" do
    types = %{
      primitives: %{id: [encoded_type: :string]},
      objects: %{
        task: %{
          fields: [
            {:id, :id, [optional: false, null: false]},
            {:status, :status, [optional: false, null: false]}
          ]
        },
        wrapper: %{
          fields: [
            {:task, :task, [optional: false, null: false]},
            {:tags, {:list, :string}, [optional: true, null: true]},
            {:count, :integer, [optional: false, null: false]}
          ]
        }
      },
      unions: %{},
      enums: %{status: [:open, :closed]}
    }

    endpoint = %{
      outputs: [
        {:success, :boolean, [optional: false, null: false]},
        {:wrapper, :wrapper, [optional: false, null: false]}
      ]
    }

    output = ResponseExample.render(endpoint, types)
    decoded = Jason.decode!(output)

    assert decoded["success"] == true
    assert decoded["wrapper"]["task"] == "<task>"
    assert decoded["wrapper"]["tags"] == ["value"]
    assert decoded["wrapper"]["count"] == 123

    assert output =~ "  \"success\": true"
    assert output =~ "  \"wrapper\": {"
  end

  test "falls back safely for recursive output object types" do
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
      outputs: [
        {:node, :recursive_node, [optional: false, null: false]}
      ]
    }

    output = ResponseExample.render(endpoint, types)
    decoded = Jason.decode!(output)

    assert decoded["node"]["name"] == "value"
    assert decoded["node"]["child"] == "<recursive_node>"
  end

  test "uses safe placeholders for union and unknown output types" do
    types = %{
      primitives: %{},
      objects: %{},
      unions: %{search_result: [:task, :project]},
      enums: %{}
    }

    endpoint = %{
      outputs: [
        {:union_value, :search_result, [optional: false, null: false]},
        {:unknown_value, :missing_type, [optional: false, null: false]}
      ]
    }

    output = ResponseExample.render(endpoint, types)
    decoded = Jason.decode!(output)

    assert decoded["union_value"] == "<search_result>"
    assert decoded["unknown_value"] == "<missing_type>"
  end

  test "shows related resources as typed references instead of full nested objects" do
    types = %{
      primitives: %{},
      objects: %{
        project: %{
          fields: [
            {:name, :string, [optional: false, null: false]},
            {:parent_goal, :goal, [optional: true, null: true]},
            {:goal_count, :integer, [optional: false, null: false]}
          ]
        },
        goal: %{
          fields: [
            {:name, :string, [optional: false, null: false]}
          ]
        }
      },
      unions: %{},
      enums: %{}
    }

    endpoint = %{
      outputs: [
        {:project, :project, [optional: false, null: false]}
      ]
    }

    output = ResponseExample.render(endpoint, types)
    decoded = Jason.decode!(output)

    assert decoded["project"]["name"] == "value"
    assert decoded["project"]["goal_count"] == 123
    assert decoded["project"]["parent_goal"] == "<goal>"
  end
end

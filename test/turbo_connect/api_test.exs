defmodule TurboConnect.ApiTest do
  use ExUnit.Case
  use Plug.Test

  defmodule ExampleTypes do
    use TurboConnect.Types

    object :user do
      field :full_name, :string
      field :address, :address
    end

    object :address do
      field :street, :string
      field :city, :string
    end

    union :resource, types: [:user, :address]
  end

  defmodule ExampleQuery do
    use TurboConnect.Query

    inputs do
      field :id, :id
    end

    outputs do
      field :user, :user
    end

    def call(_) do
      res = %{
        user: %{
          full_name: "John Doe", 
          address: %{
            street: "123 Main St", 
            city: "Anytown"
          }
        }
      }
      
      {:ok, res}
    end
  end

  defmodule ExampleApi do
    use TurboConnect.Api

    use_types ExampleTypes

    query :get_user, ExampleQuery
  end

  test "__types__ returns the types defined in the module" do
    assert ExampleApi.__types__() == %{
      objects: %{
        address: %{
          fields: [
            {:street, :string, []},
            {:city, :string, []}
          ]
        },
        user: %{
          fields: [
            {:full_name, :string, []},
            {:address, :address, []}
          ]
        }
      },
      unions: %{
        resource: [:user, :address]
      }
    }
  end

  test "__queries__ returns the queries defined in the module" do
    assert ExampleApi.__queries__() == %{
      get_user: %{
        handler: ExampleQuery,
        inputs: %{
          fields: [
            {:id, :id, []}
          ]
        },
        outputs: %{
          fields: [
            {:user, :user, []}
          ]
        }
      }
    }
  end

  describe "routing" do
    test "route queries to the correct handler" do
      conn = conn(:get, "/get_user")
      conn = ExampleApi.call(conn, [])

      assert conn.status == 200
    end

    test "return 404 for unknown queries" do
      conn = conn(:get, "/unknown_query")
      conn = ExampleApi.call(conn, [])

      assert conn.status == 404
    end

    test "return 400 for invalid queries" do
      conn = conn(:get, "")
      conn = ExampleApi.call(conn, [])

      assert conn.status == 400
    end
  end

end

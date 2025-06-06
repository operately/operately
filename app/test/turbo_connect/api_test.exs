defmodule TurboConnect.ApiTest do
  use ExUnit.Case
  use Plug.Test

  defmodule ExampleTypes do
    use TurboConnect.Types

    primitive(:id, encoded_type: :string, decode_with: &String.to_integer/1)

    object :user do
      field :full_name, :string
      field :address, :address
    end

    object :address do
      field :street, :string
      field :city, :string
    end

    union(:resource, types: [:user, :address])
  end

  defmodule ExampleQuery do
    use TurboConnect.Query

    inputs do
      field :id, :id
    end

    outputs do
      field :user, :user
    end

    def call(_, _) do
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

  defmodule ExampleMutation do
    use TurboConnect.Query

    inputs do
      field :name, :string, required: true
      field :email, :string
    end

    outputs do
      field :user, :user
    end

    def call(_, _) do
      {:ok, %{}}
    end
  end

  defmodule ExampleApi do
    use TurboConnect.Api

    use_types(ExampleTypes)

    query(:get_user, ExampleQuery)
    mutation(:create_user, ExampleMutation)

    namespace(:users) do
      query(:get_user, ExampleQuery)
      mutation(:create_user, ExampleMutation)
    end
  end

  test "__types__ returns the types defined in the module" do
    assert ExampleApi.__types__() == %{
             primitives: %{
               id: [encoded_type: :string, decode_with: &String.to_integer/1]
             },
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
             },
             enums: %{}
           }
  end

  test "__queries__ returns the queries defined in the module" do
    assert ExampleApi.__queries__() == %{
             "get_user" => %{
               namespace: nil,
               type: :query,
               name: :get_user,
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
             },
             "users/get_user" => %{
               namespace: :users,
               type: :query,
               name: :get_user,
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

  test "__mutations__ returns the mutations defined in the module" do
    assert ExampleApi.__mutations__() == %{
             "create_user" => %{
               namespace: nil,
               type: :mutation,
               name: :create_user,
               handler: ExampleMutation,
               inputs: %{
                 fields: [
                   {:name, :string, [required: true]},
                   {:email, :string, []}
                 ]
               },
               outputs: %{
                 fields: [
                   {:user, :user, []}
                 ]
               }
             },
             "users/create_user" => %{
               namespace: :users,
               type: :mutation,
               name: :create_user,
               handler: ExampleMutation,
               inputs: %{
                 fields: [
                   {:name, :string, [required: true]},
                   {:email, :string, []}
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

  describe "routing queries" do
    test "route queries to the correct handler" do
      conn = conn(:get, "/get_user")
      conn = ExampleApi.call(conn, [])

      assert conn.status == 200
    end

    test "route namespaced queries to the correct handler" do
      conn = conn(:get, "/users/get_user")
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

  describe "routing mutations" do
    test "route mutations to the correct handler" do
      conn = conn(:post, "/create_user", %{"name" => "John Doe"})
      conn = ExampleApi.call(conn, [])

      assert conn.status == 200
    end

    test "route namespaced queries to the correct handler" do
      conn = conn(:post, "/users/create_user", %{"name" => "John Doe"})
      conn = ExampleApi.call(conn, [])

      assert conn.status == 200
    end

    test "return 404 for unknown mutations" do
      conn = conn(:post, "/unknown_mutation")
      conn = ExampleApi.call(conn, [])

      assert conn.status == 404
    end

    test "return 400 for invalid mutations" do
      conn = conn(:post, "")
      conn = ExampleApi.call(conn, [])

      assert conn.status == 400
    end
  end

  describe "required field validation" do
    test "return 400 for missing required fields in mutations" do
      conn = conn(:post, "/create_user", %{})
      conn = ExampleApi.call(conn, [])

      assert conn.status == 400
      assert conn.resp_body == ~s({"error":"Bad request","message":"Missing required fields: name"})
    end
  end
end

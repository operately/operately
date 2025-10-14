defmodule TurboConnect.ApiTest do
  use ExUnit.Case
  import Plug.Test

  defmodule ExampleTypes do
    use TurboConnect.Types

    primitive(:id, encoded_type: :string, decode_with: &String.to_integer/1)

    object :user do
      field? :full_name, :string
      field? :address, :address, null: true
    end

    object :address do
      field? :street, :string
      field? :city, :string
    end

    union(:resource, types: [:user, :address])
  end

  defmodule ExampleQuery do
    use TurboConnect.Query

    inputs do
      field? :id, :id
      field? :include_address, :boolean, default: true
    end

    outputs do
      field? :user, :user
      field? :echod_id, :id
      field? :echod_include_address, :boolean
    end

    def call(_, inputs) do
      res = %{
        echod_id: inputs[:id],
        echod_include_address: inputs[:include_address],
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
      field :name, :string, null: false
      field? :email, :string
    end

    outputs do
      field? :user, :user
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
                   {:street, :string, [null: false, optional: true]},
                   {:city, :string, [null: false, optional: true]}
                 ]
               },
               user: %{
                 fields: [
                   {:full_name, :string, [null: false, optional: true]},
                   {:address, :address, [optional: true, null: true]}
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
                   {:id, :id, [null: false, optional: true]},
                   {:include_address, :boolean, [null: false, optional: true, default: true]}
                 ]
               },
               outputs: %{
                 fields: [
                   {:user, :user, [null: false, optional: true]},
                   {:echod_id, :id, [null: false, optional: true]},
                   {:echod_include_address, :boolean, [null: false, optional: true]}
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
                   {:id, :id, [null: false, optional: true]},
                   {:include_address, :boolean, [null: false, optional: true, default: true]}
                 ]
               },
               outputs: %{
                 fields: [
                   {:user, :user, [null: false, optional: true]},
                   {:echod_id, :id, [null: false, optional: true]},
                   {:echod_include_address, :boolean, [null: false, optional: true]}
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
                   {:name, :string, [optional: false, null: false]},
                   {:email, :string, [null: false, optional: true]}
                 ]
               },
               outputs: %{
                 fields: [
                   {:user, :user, [null: false, optional: true]}
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
                   {:name, :string, [optional: false, null: false]},
                   {:email, :string, [null: false, optional: true]}
                 ]
               },
               outputs: %{
                 fields: [
                   {:user, :user, [null: false, optional: true]}
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

  describe "non-optional fields validation" do
    test "return 400 for missing required fields in mutations" do
      conn = conn(:post, "/create_user", %{})
      conn = ExampleApi.call(conn, [])

      assert conn.status == 400
      assert conn.resp_body == ~s({"error":"Bad request","message":"Missing required fields: name"})
    end
  end

  describe "non-nullable fields" do
    test "return 400 for null values in non-nullable fields" do
      conn = conn(:post, "/create_user", %{name: nil})
      conn = ExampleApi.call(conn, [])

      assert conn.status == 400
      assert conn.resp_body == ~s({"error":"Bad request","message":"Field 'name' cannot be null"})
    end
  end

  # describe "default values" do
  #   test "default values are applied correctly" do
  #     conn = conn(:get, "/get_user", %{})
  #     conn = ExampleApi.call(conn, [])

  #     resp = Jason.decode!(conn.resp_body)
  #     assert resp["echod_include_address"] == true
  #   end

  #   test "if the value is provided, it overrides the default" do
  #     conn = conn(:get, "/get_user", %{"include_address" => false})
  #     conn = ExampleApi.call(conn, [])

  #     resp = Jason.decode!(conn.resp_body)
  #     assert resp["echod_include_address"] == false
  #   end
  # end
end

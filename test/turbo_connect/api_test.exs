defmodule TurboConnect.ApiTest do
  use ExUnit.Case

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

  defmodule ExampleApi do
    use TurboConnect.Api

    use_types ExampleTypes
  end

  test "get_types" do
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

end

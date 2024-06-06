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
  end

  defmodule ExampleApi do
    use TurboConnect.Api

    use_types ExampleTypes
  end

  test "get_types" do
    assert ExampleApi.get_types() == %{
      objects: %{
        address: %{
          fields: [
            %{name: :street, type: :string, opts: []},
            %{name: :city, type: :string, opts: []}
          ]
        },
        user: %{
          fields: [
            %{name: :full_name, type: :string, opts: []},
            %{name: :address, type: :address, opts: []}
          ]
        }
      },
      unions: %{}
    }
  end

end

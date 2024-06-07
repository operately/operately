defmodule TurboConnect.QueryTest do
  use ExUnit.Case

  defmodule ExampleQuery do
    use TurboConnect.Query

    inputs do
      field :id, :string
    end

    outputs do
      field :id, :string
      field :name, :string
    end

    def call(inputs) do
      res = %{id: inputs.id, name: "Example"}

      {:ok, res}
    end
  end

  test "defining a query with inputs and outputs" do
    assert ExampleQuery.get_specs() == %{
      inputs: [
        {:id, :string, []}
      ],
      outputs: [
        {:name, :string, []},
        {:id, :string, []}
      ]
    }
  end

end

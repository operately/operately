defmodule TurboConnect.MutationTest do
  use ExUnit.Case

  defmodule ExampleMutation do
    use TurboConnect.Mutation

    inputs do
      field :name, :string
      field :age, :integer
    end

    outputs do
      field :user, :user
    end

    def call(_, _) do
      res = %{id: "1", name: "Example", age: 30}

      {:ok, res}
    end
  end

  test "defining a mutation with inputs and outputs" do
    assert ExampleMutation.__inputs__() == %{
      fields: [
        {:name, :string, []},
        {:age, :integer, []}
      ]
    }

    assert ExampleMutation.__outputs__() == %{
      fields: [
        {:user, :user, []}
      ]
    }
  end

end

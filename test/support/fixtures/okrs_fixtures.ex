defmodule Operately.OkrsFixtures do

  def objective_fixture(attrs \\ %{}) do
    {:ok, objective} =
      attrs
      |> Enum.into(%{
        description: %{},
        name: "some name"
      })
      |> Operately.Okrs.create_objective()

    objective
  end

  def key_result_fixture(attrs \\ %{}) do
    {:ok, key_result} =
      attrs
      |> Enum.into(%{
        direction: :above,
        name: "some name",
        target: 42,
        unit: :percentage,
        steps_total: 10,
        steps_completed: 3
      })
      |> Operately.Okrs.create_key_result()

    key_result
  end

end

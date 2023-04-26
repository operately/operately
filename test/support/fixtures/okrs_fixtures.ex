defmodule Operately.OkrsFixtures do
  @moduledoc """
  This module defines test helpers for creating
  entities via the `Operately.Okrs` context.
  """

  @doc """
  Generate a objective.
  """
  def objective_fixture(:with_owner, attrs) do
    person = Operately.PeopleFixtures.person_fixture()
    objective = objective_fixture(Map.merge(attrs, %{
      ownership: %{
        person_id: person.id,
        target_type: :objective
      }
    }))

    {person, objective}
  end

  def objective_fixture(attrs \\ %{}) do
    {:ok, objective} =
      attrs
      |> Enum.into(%{
        description: "some description",
        name: "some name"
      })
      |> Operately.Okrs.create_objective()

    objective
  end

  @doc """
  Generate a key_result.
  """
  def key_result_fixture(:with_objective, attrs) do
    {_, objective} = objective_fixture(:with_owner, %{})
    key_result = key_result_fixture(Map.merge(attrs, %{objective_id: objective.id}))

    {objective, key_result}
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

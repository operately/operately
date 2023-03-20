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
    objective = objective_fixture(attrs)

    Operately.OwnershipsFixtures.ownership_fixture(%{
      person_id: person.id,
      target_type: "objective",
      target: objective.id
    })

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
    objective = objective_fixture()
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
        unit: :percentage
      })
      |> Operately.Okrs.create_key_result()

    key_result
  end
end

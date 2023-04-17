defmodule Operately.UpdatesFixtures do
  @moduledoc """
  This module defines test helpers for creating
  entities via the `Operately.Updates` context.
  """

  def update_fixture(:with_author, attrs) do
    person = Operately.PeopleFixtures.person_fixture()
    update = update_fixture(Map.put(attrs, :author_id, person.id))

    {update, person}
  end

  def update_fixture(attrs \\ %{}) do
    {:ok, update} =
      attrs
      |> Enum.into(%{
        content: "some content",
        updatable_id: Ecto.UUID.generate(),
        updatable_type: :objective,
      })
      |> Operately.Updates.create_update()

    update
  end

  @doc """
  Generate a comment.
  """
  def comment_fixture(attrs \\ %{}) do
    {:ok, comment} =
      attrs
      |> Enum.into(%{
        content: "some content"
      })
      |> Operately.Updates.create_comment()

    comment
  end
end

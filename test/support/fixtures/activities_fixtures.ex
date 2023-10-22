defmodule Operately.ActivitiesFixtures do
  @moduledoc """
  This module defines test helpers for creating
  entities via the `Operately.Activities` context.
  """

  @doc """
  Generate a activity.
  """
  def activity_fixture(attrs \\ %{}) do
    defaults = %{
      action: "project_discussion_created",
      author_id: Ecto.UUID.generate(),
      content: %{
        discussion_id: Ecto.UUID.generate(),
        project_id: Ecto.UUID.generate(),
        company_id: Ecto.UUID.generate(),
      }
    }

    attrs = Map.merge(defaults, attrs)
    changeset = Operately.Activities.Activity.changeset(%Operately.Activities.Activity{}, attrs)

    {:ok, activity} = Operately.Repo.insert(changeset)

    activity
  end
end

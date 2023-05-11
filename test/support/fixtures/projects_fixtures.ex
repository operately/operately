defmodule Operately.ProjectsFixtures do
  @moduledoc """
  This module defines test helpers for creating
  entities via the `Operately.Projects` context.
  """

  @doc """
  Generate a project.
  """
  def project_fixture(attrs \\ %{}) do
    {:ok, project} =
      attrs
      |> Enum.into(%{
        description: "some description",
        name: "some name"
      })
      |> Operately.Projects.create_project()

    project
  end

  @doc """
  Generate a milestone.
  """
  def milestone_fixture(attrs \\ %{}) do
    {:ok, milestone} =
      attrs
      |> Enum.into(%{
        deadline_at: ~N[2023-05-10 08:16:00],
        title: "some title"
      })
      |> Operately.Projects.create_milestone()

    milestone
  end
end

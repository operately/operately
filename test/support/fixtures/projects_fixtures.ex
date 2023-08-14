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
        name: "some name"
      })
      |> Operately.Projects.create_project()

    project
  end

  @doc """
  Generate a milestone.
  """
  def milestone_fixture(creator, attrs) do
    attrs = attrs
      |> Enum.into(%{
        deadline_at: ~N[2023-05-10 08:16:00],
        title: "some title"
      })

    {:ok, milestone} = Operately.Projects.create_milestone(creator, attrs)

    milestone
  end

  @doc """
  Generate a contributor.
  """
  def contributor_fixture(attrs \\ %{}) do
    {:ok, contributor} =
      attrs
      |> Enum.into(%{
        responsibility: "some responsibility"
      })
      |> Operately.Projects.create_contributor()

    contributor
  end

  @doc """
  Generate a document.
  """
  def document_fixture(attrs \\ %{}) do
    {:ok, document} =
      attrs
      |> Enum.into(%{
        content: %{},
        title: "some title"
      })
      |> Operately.Projects.create_document()

    document
  end

  @doc """
  Generate a key_resource.
  """
  def key_resource_fixture(attrs \\ %{}) do
    {:ok, key_resource} =
      attrs
      |> Enum.into(%{
        link: "some link",
        title: "some title",
        type: :github
      })
      |> Operately.Projects.create_key_resource()

    key_resource
  end
end

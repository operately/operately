defmodule Operately.ProjectsFixtures do
  alias Operately.Access.Binding

  @moduledoc """
  This module defines test helpers for creating
  entities via the `Operately.Projects` context.
  """

  @doc """
  Generate a project.
  """
  def project_fixture(attrs \\ %{}) do
    attrs = Enum.into(attrs, %{})

    attrs = Map.merge(%{
      name: "some name",
      visibility: "everyone",
      champion_id: attrs[:champion_id] || attrs[:creator_id],
      reviewer_id: attrs[:reviewer_id] || attrs[:creator_id],
      company_access_level: Binding.view_access(),
      space_access_level: Binding.comment_access(),
    }, attrs)

    attrs = struct!(Operately.Operations.ProjectCreation, attrs)

    {:ok, project} = Operately.Projects.create_project(attrs)

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
  def contributor_fixture(creator, attrs \\ %{}) do
    attrs = Enum.into(attrs, %{ responsibility: "some responsibility", permissions: Binding.edit_access() })

    {:ok, contributor} = Operately.Projects.create_contributor(creator, attrs)

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
        resource_type: "slack-channel"
      })
      |> Operately.Projects.create_key_resource()

    key_resource
  end

  @doc """
  Generate a phase_history.
  """
  def phase_history_fixture(attrs \\ %{}) do
    {:ok, phase_history} =
      attrs
      |> Enum.into(%{
        end_time: ~U[2023-08-24 09:36:00Z],
        phase: :planning,
        start_time: ~U[2023-08-24 09:36:00Z]
      })
      |> Operately.Projects.create_phase_history()

    phase_history
  end

  @doc """
  Generate a check_in_fixture.
  """
  def check_in_fixture(attrs) do
    {:ok, check_in} =
      attrs
      |> Enum.into(%{
        status: "on_track",
        description: %{},
      })
      |> Operately.Projects.CheckIn.changeset()
      |> Operately.Repo.insert()

    check_in
  end
end

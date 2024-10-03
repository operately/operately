defmodule Operately.Operations.ProjectContributorsAddition do
  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.Access
  alias Operately.Activities
  alias Operately.Access
  alias Operately.Projects.Contributor

  def run(author, project, contributors) do
    Multi.new()
    |> add_contributors(project, contributors)
    |> insert_activity(author, project)
    |> Repo.transaction()
    |> Repo.extract_result(:contributors)
  end

  def add_contributors(multi, project, contributors) do
    Multi.run(multi, :contributors, fn _, _ ->
      context = Access.get_context!(project_id: project.id)

      contribs = Enum.map(contributors, fn  attrs ->
        add_contributor(project, context, attrs)
      end)

      {:ok, contribs}
    end)
  end

  defp add_contributor(project, access_context, attrs) do
    changeset = Contributor.changeset(%{
      project_id: project.id,
      person_id: attrs.person_id,
      role: attrs.role,
      responsibility: attrs.responsibility,
    })

    {:ok, contrib} = Operately.Repo.insert(changeset)
    {:ok, _} = Access.bind(access_context, person_id: attrs.person_id, level: attrs.access_level)

    contrib
  end

  defp insert_activity(multi, author, project) do
    Activities.insert_sync(multi, author.id, :project_contributors_addition, fn %{contributors: contributors} ->
      %{
        company_id: project.company_id,
        project_id: project.id,
        space_id: project.group_id,
        contributors: Enum.map(contributors, fn contributor ->
          %{
            person_id: contributor.person_id,
            contributor_id: contributor.id,
            responsibility: contributor.responsibility,
            role: Atom.to_string(contributor.role),
          }
        end)
      }
    end)
  end
end

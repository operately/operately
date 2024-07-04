defmodule Operately.Operations.ProjectContributorAddition do
  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.Access
  alias Operately.Activities
  alias Operately.Projects.Contributor

  def run(author, attrs) do
    Multi.new()
    |> Multi.insert(:contributor, Contributor.changeset(attrs))
    |> insert_binding(attrs)
    |> insert_activity(author)
    |> Repo.transaction()
    |> Repo.extract_result(:contributor)
  end

  defp insert_binding(multi, attrs) do
    access_group = Access.get_group!(person_id: attrs.person_id)

    Multi.run(multi, :context, fn _, _ ->
      context = Access.get_context!(project_id: attrs.project_id)
      {:ok, context}
    end)
    |> Access.insert_binding(:contributor_binding, access_group, attrs.permissions)
  end

  defp insert_activity(multi, author) do
    Activities.insert_sync(multi, author.id, :project_contributor_addition, fn %{contributor: contributor} ->
      %{
        company_id: author.company_id,
        project_id: contributor.project_id,
        person_id: contributor.person_id,
        contributor_id: contributor.id,
        responsibility: contributor.responsibility,
        role: Atom.to_string(:contributor)
      }
    end)
  end
end

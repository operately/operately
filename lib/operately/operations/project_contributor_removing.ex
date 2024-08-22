defmodule Operately.Operations.ProjectContributorRemoving do
  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.Access
  alias Operately.Activities

  def run(author, contrib) do
    Multi.new()
    |> Multi.delete(:contributor, fn _ -> contrib end)
    |> delete_binding()
    |> insert_activity(author)
    |> Repo.transaction()
    |> Repo.extract_result(:contributor)
  end

  defp delete_binding(multi) do
    multi
    |> Multi.run(:binding, fn _, %{contributor: contributor} ->
      context = Access.get_context!(project_id: contributor.project_id)
      group = Access.get_group!(person_id: contributor.person_id)

      binding = Access.get_binding!(group_id: group.id, context_id: context.id)

      {:ok, binding}
    end)
    |> Multi.delete(:binding_deleted, fn %{binding: binding} ->
      binding
    end)
  end

  defp insert_activity(multi, author) do
    Activities.insert_sync(multi, author.id, :project_contributor_removed, fn %{contributor: contributor} ->
      %{
        company_id: author.company_id,
        project_id: contributor.project_id,
        person_id: contributor.person_id,
        contributor_id: contributor.id,
        responsibility: contributor.responsibility,
        role: Atom.to_string(contributor.role)
      }
    end)
  end
end

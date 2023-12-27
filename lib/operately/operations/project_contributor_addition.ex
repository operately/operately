defmodule Operately.Operations.ProjectContributorAddition do
  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.Activities

  def run(author, attrs) do
    changeset = Operately.Projects.Contributor.changeset(attrs)

    Multi.new()
    |> Multi.insert(:contributor, changeset)
    |> Activities.insert(author.id, :project_contributor_addition, fn %{contributor: contributor} ->
      %{
        company_id: author.company_id,
        project_id: contributor.project_id,
        person_id: contributor.person_id,
        contributor_id: contributor.id,
        responsibility: contributor.responsibility,
        role: Atom.to_string(:contributor)
      }
    end)
    |> Repo.transaction()
    |> Repo.extract_result(:contributor)
  end
end

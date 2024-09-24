defmodule Operately.Operations.ProjectRetrospectiveEditing do
  alias Ecto.Multi
  alias Operately.{Repo, Activities}
  alias Operately.Projects.Retrospective

  def run(author, retrospective, new_content) do
    Multi.new()
    |> Multi.update(:retrospective, Retrospective.changeset(retrospective, %{
      content: new_content,
    }))
    |> Activities.insert_sync(author.id, :project_retrospective_edited, fn _ ->
      %{
        company_id: author.company_id,
        space_id: retrospective.project.group_id,
        project_id: retrospective.project_id,
        retrospective_id: retrospective.id,
      }
    end)
    |> Repo.transaction()
    |> Repo.extract_result(:retrospective)
  end
end

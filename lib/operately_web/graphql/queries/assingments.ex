defmodule OperatelyWeb.GraphQL.Queries.Assignments do
  use Absinthe.Schema.Notation

  import Ecto.Query

  object :assignments do
    field :project_status_udpates, list_of(:project)
    field :milestones, list_of(:milestone)
  end

  object :assignment_queries do
    field :assignments, non_null(:assignments) do
      resolve fn _, %{context: context} ->
        person = context.current_account.person

        projects = Operately.Repo.all(
          from p in Operately.Projects.Project,
            join: a in assoc(p, :contributors),
            where: a.person_id == ^person.id and a.role == :champion
        )

        milestones = Operately.Repo.all(
          from m in Operately.Projects.Milestone, where: m.project_id in ^(Enum.map(projects, & &1.id))
        )

        {:ok, %{
          project_status_udpates: projects,
          milestones: milestones
        }}
      end
    end
  end

end

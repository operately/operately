defmodule OperatelyWeb.GraphQL.Queries.Assignments do
  use Absinthe.Schema.Notation

  import Ecto.Query

  alias Operately.Repo
  alias Operately.Projects.Project
  alias Operately.Projects.Milestone

  object :assignments do
    field :project_status_updates, non_null(list_of(:project))
    field :milestones, non_null(list_of(:milestone))
  end

  object :assignment_queries do
    field :assignments, non_null(:assignments) do
      resolve fn _, %{context: context} ->

        one_week_from_now = DateTime.utc_now() |> DateTime.add(7, :day)

        person = context.current_account.person

        projects = Repo.all(
          from p in Project,
            join: a in assoc(p, :contributors),
            where: a.person_id == ^person.id and a.role == :champion
        )

        milestones = Repo.all(
          from m in Milestone, 
            where: m.project_id in ^(Enum.map(projects, & &1.id)),
            where: not is_nil(m.deadline_at),
            where: m.deadline_at < ^one_week_from_now
        )

        pendingStatusUpdate = Repo.all(
          from p in Project,
            where: p.id in ^(Enum.map(projects, & &1.id)),
            where: not is_nil(p.next_update_scheduled_at),
            where: p.next_update_scheduled_at < ^one_week_from_now
        )

        {:ok, %{
          project_status_updates: pendingStatusUpdate,
          milestones: milestones
        }}
      end
    end
  end

end

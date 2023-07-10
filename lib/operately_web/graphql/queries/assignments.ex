defmodule OperatelyWeb.GraphQL.Queries.Assignments do
  use Absinthe.Schema.Notation

  import Ecto.Query

  alias Operately.Repo
  alias Operately.Projects.Project
  alias Operately.Projects.Milestone

  object :assignment_queries do
    field :assignments, non_null(:assignments) do
      arg :range_start, non_null(:datetime)
      arg :range_end, non_null(:datetime)

      resolve fn args, %{context: context} ->
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
            where: m.deadline_at > ^args.range_start and m.deadline_at < ^args.range_end,
            where: m.status == :pending
        )

        pending_status_updates = Repo.all(
          from p in Project,
            where: p.id in ^(Enum.map(projects, & &1.id)),
            where: not is_nil(p.next_update_scheduled_at),
            where: p.next_update_scheduled_at > ^args.range_start and p.next_update_scheduled_at < ^args.range_end
        )

        assignments = [] 
          ++ Enum.map(milestones, fn milestone ->
            %{
              type: "milestone",
              due: milestone.deadline_at,
              resource: milestone
            }
          end) 
          ++ Enum.map(pending_status_updates, fn project_status_update ->
            %{
              type: "project_status_update",
              due: project_status_update.next_update_scheduled_at,
              resource: project_status_update
            }
          end)

        assignments = Enum.sort_by(assignments, & &1.due)

        {:ok, %{
          assignments: assignments
        }}
      end
    end
  end

end

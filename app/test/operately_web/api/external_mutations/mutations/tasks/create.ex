defmodule OperatelyWeb.Api.ExternalMutations.Mutations.Tasks.Create do
  use Operately.Support.ExternalApi.MutationSpec
  use OperatelyWeb.TurboCase

  @impl true
  def mutation_name, do: "tasks/create"

  @impl true
  def setup(ctx) do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_project(:project, :space)
    |> Factory.add_project_milestone(:milestone, :project)
    |> Factory.add_company_member(:member)
  end

  @impl true
  def inputs(ctx) do
    status_input =
      Enum.find(ctx.project.task_statuses || [], fn s -> s.value == "done" end)
      |> then(fn status ->
        status
        |> Map.from_struct()
        |> Map.put(:color, to_string(status.color))
      end)

    %{
      type: "project",
      id: Paths.project_id(ctx.project),
      name: "Updated Name",
      milestone_id: Paths.milestone_id(ctx.milestone),
      assignee_id: Paths.person_id(ctx.member),
      due_date: date(7),
      status: status_input
    }
  end

  @impl true
  def assert(response, _ctx) do
    assert response.task.id
    assert response.task.status.value == "done"
    refute Map.has_key?(response, :error)
  end

  defp date(days) do
    %{
      date: Date.utc_today() |> Date.add(days) |> Date.to_iso8601(),
      date_type: "day",
      value: "date"
    }
  end
end

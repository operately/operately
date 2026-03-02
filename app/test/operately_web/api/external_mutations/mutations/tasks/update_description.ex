defmodule OperatelyWeb.Api.ExternalMutations.Mutations.Tasks.UpdateDescription do
  use Operately.Support.ExternalApi.MutationSpec
  use OperatelyWeb.TurboCase

  @impl true
  def mutation_name, do: "tasks/update_description"

  @impl true
  def setup(ctx) do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_project(:project, :space)
    |> Factory.add_project_milestone(:milestone, :project)
    |> Factory.add_project_task(:task, :milestone)
  end

  @impl true
  def inputs(ctx) do
    %{
      task_id: Paths.task_id(ctx.task),
      description: rich_text_string("Updated content"),
      type: "project"
    }
  end

  @impl true
  def assert(response, _ctx) do
    assert response.task.id
    refute Map.has_key?(response, :error)
  end

  defp rich_text_string(text), do: Operately.Support.RichText.rich_text(text, :as_string)
end

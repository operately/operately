defmodule OperatelyWeb.Api.ExternalMutations.Mutations.ProjectTemplates.DeleteTask do
  use Operately.Support.ExternalApi.MutationSpec
  use OperatelyWeb.TurboCase

  @impl true
  def mutation_name, do: "project_templates/delete_task"

  @impl true
  def setup(ctx),
    do:
      ctx
      |> Factory.setup()
      |> Factory.enable_feature("project_templates")
      |> Factory.add_space(:space)
      |> Factory.add_project_template(:template, :space)
      |> Factory.add_project_template_task(:task, :template)

  @impl true
  def inputs(ctx), do: %{template_id: Paths.project_template_id(ctx.template), task_id: Paths.project_template_task_id(ctx.task)}

  @impl true
  def assert(response, _ctx), do: assert(response.success)
end

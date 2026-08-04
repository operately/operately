defmodule OperatelyWeb.Api.ExternalMutations.Mutations.ProjectTemplates.CreateMilestone do
  use Operately.Support.ExternalApi.MutationSpec
  use OperatelyWeb.TurboCase

  @impl true
  def mutation_name, do: "project_templates/create_milestone"

  @impl true
  def setup(ctx), do: ctx |> Factory.setup() |> Factory.enable_feature("project_templates") |> Factory.add_space(:space) |> Factory.add_project_template(:template, :space)

  @impl true
  def inputs(ctx), do: %{template_id: Paths.project_template_id(ctx.template), title: "Milestone"}

  @impl true
  def assert(response, _ctx), do: assert(response.milestone.id)
end

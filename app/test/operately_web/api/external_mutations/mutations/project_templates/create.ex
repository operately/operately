defmodule OperatelyWeb.Api.ExternalMutations.Mutations.ProjectTemplates.Create do
  use Operately.Support.ExternalApi.MutationSpec
  use OperatelyWeb.TurboCase

  @impl true
  def mutation_name, do: "project_templates/create"

  @impl true
  def setup(ctx), do: ctx |> Factory.setup() |> Factory.enable_feature("project_templates") |> Factory.add_space(:space)

  @impl true
  def inputs(ctx), do: %{space_id: Paths.space_id(ctx.space), name: "Template"}

  @impl true
  def assert(response, _ctx), do: assert(response.template.id)
end

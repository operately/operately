defmodule OperatelyWeb.Api.ExternalMutations.Mutations.ProjectTemplates.DeleteResource do
  use Operately.Support.ExternalApi.MutationSpec
  use OperatelyWeb.TurboCase

  def mutation_name, do: "project_templates/delete_resource"

  def setup(ctx),
    do:
      ctx
      |> Factory.setup()
      |> Factory.enable_feature("project_templates")
      |> Factory.add_space(:space)
      |> Factory.add_project_template(:template, :space)
      |> Factory.add_project_template_resource_folder(:folder, :template)

  def inputs(ctx), do: %{template_id: Paths.project_template_id(ctx.template), node_id: Paths.project_template_resource_node_id(ctx.folder.node)}

  def assert(response, _ctx), do: assert(response.success)
end

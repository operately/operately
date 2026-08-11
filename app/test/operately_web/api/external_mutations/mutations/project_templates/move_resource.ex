defmodule OperatelyWeb.Api.ExternalMutations.Mutations.ProjectTemplates.MoveResource do
  use Operately.Support.ExternalApi.MutationSpec
  use OperatelyWeb.TurboCase

  def mutation_name, do: "project_templates/move_resource"

  def setup(ctx),
    do:
      ctx
      |> Factory.setup()
      |> Factory.enable_feature("project_templates")
      |> Factory.add_space(:space)
      |> Factory.add_project_template(:template, :space)
      |> Factory.add_project_template_resource_folder(:folder, :template)
      |> Factory.add_project_template_resource_document(:document, :template)

  def inputs(ctx),
    do: %{
      template_id: Paths.project_template_id(ctx.template),
      node_id: Paths.project_template_resource_node_id(ctx.document.node),
      parent_folder_id: Paths.project_template_resource_folder_id(ctx.folder)
    }

  def assert(response, _ctx), do: assert(response.success)
end

defmodule OperatelyWeb.Api.ExternalMutations.Mutations.ProjectTemplates.UpdateFolder do
  use Operately.Support.ExternalApi.MutationSpec
  use OperatelyWeb.TurboCase

  def mutation_name, do: "project_templates/update_folder"

  def setup(ctx),
    do:
      ctx
      |> Factory.setup()
      |> Factory.enable_feature("project_templates")
      |> Factory.add_space(:space)
      |> Factory.add_project_template(:template, :space)
      |> Factory.add_project_template_resource_folder(:folder, :template)

  def inputs(ctx), do: %{template_id: Paths.project_template_id(ctx.template), folder_id: Paths.project_template_resource_folder_id(ctx.folder), name: "Updated folder"}

  def assert(response, _ctx), do: assert(response.folder.name == "Updated folder")
end

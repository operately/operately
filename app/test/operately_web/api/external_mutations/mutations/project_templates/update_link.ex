defmodule OperatelyWeb.Api.ExternalMutations.Mutations.ProjectTemplates.UpdateLink do
  use Operately.Support.ExternalApi.MutationSpec
  use OperatelyWeb.TurboCase

  def mutation_name, do: "project_templates/update_link"

  def setup(ctx),
    do:
      ctx
      |> Factory.setup()
      |> Factory.enable_feature("project_templates")
      |> Factory.add_space(:space)
      |> Factory.add_project_template(:template, :space)
      |> Factory.add_project_template_resource_link(:link, :template)

  def inputs(ctx),
    do: %{template_id: Paths.project_template_id(ctx.template), link_id: Paths.project_template_resource_link_id(ctx.link), name: "Updated link", url: "https://operately.com/updated", type: "other"}

  def assert(response, _ctx), do: assert(response.link.name == "Updated link")
end

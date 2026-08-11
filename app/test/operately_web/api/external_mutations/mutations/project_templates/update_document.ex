defmodule OperatelyWeb.Api.ExternalMutations.Mutations.ProjectTemplates.UpdateDocument do
  use Operately.Support.ExternalApi.MutationSpec
  use OperatelyWeb.TurboCase

  def mutation_name, do: "project_templates/update_document"

  def setup(ctx),
    do:
      ctx
      |> Factory.setup()
      |> Factory.enable_feature("project_templates")
      |> Factory.add_space(:space)
      |> Factory.add_project_template(:template, :space)
      |> Factory.add_project_template_resource_document(:document, :template)

  def inputs(ctx),
    do: %{
      template_id: Paths.project_template_id(ctx.template),
      document_id: Paths.project_template_resource_document_id(ctx.document),
      name: "Updated guide",
      content: Jason.encode!(%{"type" => "doc", "content" => []})
    }

  def assert(response, _ctx), do: assert(response.document.name == "Updated guide")
end

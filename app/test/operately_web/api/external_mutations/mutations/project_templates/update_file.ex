defmodule OperatelyWeb.Api.ExternalMutations.Mutations.ProjectTemplates.UpdateFile do
  use Operately.Support.ExternalApi.MutationSpec
  use OperatelyWeb.TurboCase

  def mutation_name, do: "project_templates/update_file"

  def setup(ctx),
    do:
      ctx
      |> Factory.setup()
      |> Factory.enable_feature("project_templates")
      |> Factory.add_space(:space)
      |> Factory.add_blob(:blob)
      |> Factory.add_project_template(:template, :space)
      |> Factory.add_project_template_resource_file(:file, :template, :blob)

  def inputs(ctx), do: %{template_id: Paths.project_template_id(ctx.template), file_id: Paths.project_template_resource_file_id(ctx.file), name: "Updated file"}

  def assert(response, _ctx), do: assert(response.file.name == "Updated file")
end

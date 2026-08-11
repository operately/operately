defmodule OperatelyWeb.Api.ExternalMutations.Mutations.ProjectTemplates.CreateFolder do
  use Operately.Support.ExternalApi.MutationSpec
  use OperatelyWeb.TurboCase

  def mutation_name, do: "project_templates/create_folder"

  def setup(ctx) do
    ctx
    |> Factory.setup()
    |> Factory.enable_feature("project_templates")
    |> Factory.add_space(:space)
    |> Factory.add_project_template(:template, :space)
  end

  def inputs(ctx), do: %{template_id: Paths.project_template_id(ctx.template), name: "Reusable files"}

  def assert(response, _ctx), do: assert(response.folder.name == "Reusable files")
end

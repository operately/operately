defmodule OperatelyWeb.Api.ExternalMutations.Mutations.ProjectTemplates.DeletePerson do
  use Operately.Support.ExternalApi.MutationSpec
  use OperatelyWeb.TurboCase

  @impl true
  def mutation_name, do: "project_templates/delete_person"

  @impl true
  def setup(ctx),
    do:
      ctx
      |> Factory.setup()
      |> Factory.enable_feature("project_templates")
      |> Factory.add_space(:space)
      |> Factory.add_project_template(:template, :space)
      |> Factory.add_project_template_person(:template_person, :template, :creator)

  @impl true
  def inputs(ctx), do: %{template_id: Paths.project_template_id(ctx.template), template_person_id: Paths.project_template_person_id(ctx.template_person)}

  @impl true
  def assert(response, _ctx), do: assert(response.success)
end

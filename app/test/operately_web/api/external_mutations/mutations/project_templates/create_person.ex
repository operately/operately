defmodule OperatelyWeb.Api.ExternalMutations.Mutations.ProjectTemplates.CreatePerson do
  use Operately.Support.ExternalApi.MutationSpec
  use OperatelyWeb.TurboCase

  @impl true
  def mutation_name, do: "project_templates/create_person"

  @impl true
  def setup(ctx),
    do: ctx |> Factory.setup() |> Factory.enable_feature("project_templates") |> Factory.add_space(:space) |> Factory.add_project_template(:template, :space) |> Factory.add_company_member(:member)

  @impl true
  def inputs(ctx), do: %{template_id: Paths.project_template_id(ctx.template), person_id: Paths.person_id(ctx.member), role: "contributor", access_level: Operately.Access.Binding.edit_access()}

  @impl true
  def assert(response, _ctx), do: assert(response.person.id)
end

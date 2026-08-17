defmodule OperatelyWeb.Api.ExternalMutations.Mutations.ProjectTemplates.Restore do
  use Operately.Support.ExternalApi.MutationSpec
  use OperatelyWeb.TurboCase

  alias Operately.ProjectTemplates.ProjectTemplate
  alias Operately.Repo

  @impl true
  def mutation_name, do: "project_templates/restore"

  @impl true
  def setup(ctx) do
    ctx
    |> Factory.setup()
    |> Factory.enable_feature("project_templates")
    |> Factory.add_space(:space)
    |> Factory.add_project_template(:template, :space)
    |> then(fn ctx -> %{ctx | template: ctx.template |> ProjectTemplate.changeset(%{archived_at: DateTime.utc_now()}) |> Repo.update!()} end)
  end

  @impl true
  def inputs(ctx), do: %{id: Paths.project_template_id(ctx.template)}

  @impl true
  def assert(response, _ctx), do: assert(response.success)
end

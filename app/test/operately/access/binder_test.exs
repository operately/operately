defmodule Operately.Access.BinderTest do
  use Operately.DataCase

  alias Operately.Access
  alias Operately.Access.Binding
  alias Operately.ResourceHubs.ProjectHub

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_project(:project, :space)
    |> Factory.add_company_member(:viewer)
  end

  test "binding a person to a project context syncs the project resource hub access", ctx do
    project_context = Access.get_context!(project_id: ctx.project.id)

    assert {:ok, _} = Access.bind_person(project_context, ctx.viewer.id, Binding.view_access())

    hub = ProjectHub.get_project_hub(ctx.project.id)
    hub_context = Access.get_context!(resource_hub_id: hub.id)
    binding = Access.get_binding(hub_context, person_id: ctx.viewer.id)

    assert binding.access_level == Binding.view_access()
  end
end

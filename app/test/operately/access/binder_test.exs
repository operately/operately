defmodule Operately.Access.BinderTest do
  use Operately.DataCase

  alias Operately.Access
  alias Operately.Access.Binding
  alias Operately.ResourceHubs.ProjectHub
  alias Operately.ResourceHubs.ResourceHub

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_project(:project, :space)
    |> Factory.add_company_member(:viewer)
  end

  test "binding a person to a project context grants project hub access through the project context", ctx do
    project_context = Access.get_context!(project_id: ctx.project.id)

    assert {:ok, _} = Access.bind_person(project_context, ctx.viewer.id, Binding.full_access())

    hub = ProjectHub.get_project_hub(ctx.project.id)
    hub_context = Access.get_context!(resource_hub_id: hub.id)

    refute Access.get_binding(hub_context, person_id: ctx.viewer.id)
    assert {:ok, hub} = ResourceHub.get(ctx.viewer, id: hub.id)
    assert hub.request_info.access_level == Binding.full_access()
  end
end

defmodule OperatelyWeb.Api.TypeNamesTest do
  use ExUnit.Case, async: true

  alias OperatelyWeb.Api.TypeNames
  alias TurboConnect.TypeNames, as: Resolve

  test "resolves modules from object for: declarations" do
    assert TypeNames.for_module(Operately.Projects.Project) == "project"
    assert TypeNames.for_module(Operately.Goals.Goal) == "goal"
    assert TypeNames.for_module(Operately.Groups.Group) == "space"
    assert TypeNames.for_module(Operately.ResourceHubs.ResourceHub) == "resource_hub"
    assert TypeNames.for_module(Operately.ResourceHubs.Folder) == "resource_hub_folder"
    assert TypeNames.for_module(Operately.People.Person) == "person"
    assert TypeNames.for_module(Operately.Messages.Message) == "discussion"
    assert TypeNames.for_module(Operately.People.Permissions) == "person_permissions"
  end

  test "supports multiple modules for one object" do
    assert TypeNames.for_module(Operately.Activities.Content.ProjectTimelineEdited.NewMilestones) == "activity_milestone"
    assert TypeNames.for_module(Operately.Activities.Content.ProjectTimelineEdited.MilestoneUpdate) == "activity_milestone"
  end

  test "returns nil for unmapped modules" do
    assert TypeNames.for_module(Operately.Tasks.KanbanState) == nil
    assert TypeNames.for_module(String) == nil
  end

  test "resolve/1 uses last segment by default" do
    assert Resolve.resolve(Operately.WorkMaps.WorkMapItem) == "work_map_item"
    assert Resolve.resolve(Operately.Projects.Project) == "project"
  end

  test "resolve/1 uses activity_content rule for content modules" do
    assert Resolve.resolve(Operately.Activities.Content.TaskStatusUpdating) ==
             "activity_content_task_status_updating"
  end

  test "resolve/1 prefers __api_typename__/0 override" do
    assert Resolve.resolve(Operately.People.Permissions) == "person_permissions"
    assert Resolve.resolve(Operately.Groups.Group) == "space"
  end

  test "tag/2 adds __typename to maps" do
    assert TypeNames.tag("project", %{id: "1"}) == %{id: "1", __typename: "project"}
  end

  test "TsGen literals match TypeNames.resolve/1 for every registered for: module" do
    objects = OperatelyWeb.Api.Types.__objects__()
    modules = OperatelyWeb.Api.Types.__object_modules__()

    Enum.each(modules, fn {mod, typename} ->
      assert TypeNames.resolve(mod) == typename

      matching_objects =
        Enum.filter(objects, fn {_name, object} -> Map.get(object, :typename) == typename end)

      assert matching_objects != [], "expected an object with typename #{inspect(typename)} for #{inspect(mod)}"

      Enum.each(matching_objects, fn {_name, object} ->
        assert Map.get(object, :typename) == TypeNames.resolve(mod)
      end)
    end)
  end

  @unmapped_serializable_modules [
    Any,
    List,
    # Returns a raw kanban map, not an API object
    Operately.Tasks.KanbanState,
    # Internal review categorizer DTO without a TurboConnect object
    Operately.Assignments.Categorizer.AssignmentCategory,
    # Activity content serializers exist but objects are not yet in types.ex
    Operately.Activities.Content.ResourceHubCreated,
    Operately.Activities.Content.ResourceHubParentFolderEdited
  ]

  test "every Serializable module is registered via object for:" do
    registered = MapSet.new(Map.keys(TypeNames.mapping()))
    allowlist = MapSet.new(@unmapped_serializable_modules)

    missing =
      Protocol.extract_impls(OperatelyWeb.Api.Serializable, :code.get_path())
      |> Enum.reject(&(MapSet.member?(registered, &1) or MapSet.member?(allowlist, &1)))
      |> Enum.sort()

    assert missing == [], """
    These Serializable modules are missing object for: registration in types.ex:

    #{Enum.map_join(missing, "\n", &"  - #{inspect(&1)}")}

    Add `object :name, for: Module do` (or include the module in a for: list /
    the allowlist if it intentionally has no API object).
    """
  end
end

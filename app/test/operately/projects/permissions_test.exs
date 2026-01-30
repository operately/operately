defmodule Operately.Projects.PermissionsTest do
  use ExUnit.Case, async: true

  alias Operately.Access.Binding
  alias Operately.Projects.Permissions

  test "edit access allows child actions but not parent edits" do
    perms = Permissions.calculate(Binding.edit_access())

    assert perms.can_create_milestone
    assert perms.can_edit_task
    assert perms.can_check_in
    assert perms.can_edit_resources
    assert perms.can_acknowledge_check_in
    refute perms.can_edit_description
    refute perms.can_edit_name
    refute perms.can_edit_permissions
    refute perms.can_close
    refute perms.can_edit_retrospective
  end
end

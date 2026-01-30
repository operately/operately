defmodule Operately.Groups.PermissionsTest do
  use ExUnit.Case, async: true

  alias Operately.Access.Binding
  alias Operately.Groups.Permissions

  test "edit access allows child creation without space edits" do
    perms = Permissions.calculate_permissions(Binding.edit_access())

    assert perms.can_create_goal
    assert perms.can_create_project
    assert perms.can_create_resource_hub
    assert perms.can_create_task
    assert perms.can_post_discussions
    assert perms.can_edit_discussions
    assert perms.can_edit_statuses
    refute perms.can_edit
    refute perms.can_edit_permissions
    refute perms.can_remove_member
  end
end

defmodule Operately.Goals.PermissionsTest do
  use ExUnit.Case, async: true

  alias Operately.Access.Binding
  alias Operately.Goals.Permissions

  test "contribute access allows check-ins and discussions without goal edits" do
    perms = Permissions.calculate(Binding.contribute_access())

    assert perms.can_check_in
    assert perms.can_open_discussion
    assert perms.can_edit_discussion
    refute perms.can_edit
    refute perms.can_close
    refute perms.can_archive
  end
end

defmodule Operately.Goals.UpdatePermissionsTest do
  use ExUnit.Case, async: true

  alias Operately.Access.Binding
  alias Operately.Goals.Update.Permissions

  test "contribute access allows editing and deleting updates" do
    assert Permissions.can_edit(Binding.contribute_access())
    assert Permissions.can_delete(Binding.contribute_access())
    refute Permissions.can_edit(Binding.comment_access())
  end
end

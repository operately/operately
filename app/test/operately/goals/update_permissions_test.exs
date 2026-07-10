defmodule Operately.Goals.UpdatePermissionsTest do
  use ExUnit.Case, async: true

  alias Operately.Access.Binding
  alias Operately.Goals.Update.Permissions

  test "edit access allows editing and deleting updates" do
    assert Permissions.can_edit(Binding.edit_access())
    assert Permissions.can_delete(Binding.edit_access())
    refute Permissions.can_edit(Binding.comment_access())
  end

  test "anyone with edit access can acknowledge except the author" do
    update = %Operately.Goals.Update{author_id: "author"}

    assert Permissions.can_acknowledge(Binding.edit_access(), update, "reviewer")
    assert Permissions.can_acknowledge(Binding.edit_access(), update, "champion")
    assert Permissions.can_acknowledge(Binding.full_access(), update, "editor")
    refute Permissions.can_acknowledge(Binding.edit_access(), update, "author")
    refute Permissions.can_acknowledge(Binding.comment_access(), update, "reviewer")
  end
end

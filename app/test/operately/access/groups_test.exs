defmodule Operately.AccessGroupsTest do
  use Operately.DataCase

  alias Operately.Access
  alias Operately.Access.Group

  import Operately.AccessFixtures

  describe "access_groups" do
    test "list_groups/0 returns all groups" do
      group = group_fixture()
      assert Access.list_groups() == [group]
    end

    test "get_group!/1 returns the group with given id" do
      group = group_fixture()
      assert Access.get_group!(group.id) == group
    end

    test "create_group/1 with valid data creates a group" do
      valid_attrs = %{}

      assert {:ok, %Group{} = _group} = Access.create_group(valid_attrs)
    end

    test "update_group/2 with valid data updates the group" do
      group = group_fixture()
      update_attrs = %{}

      assert {:ok, %Group{} = _group} = Access.update_group(group, update_attrs)
    end

    test "delete_group/1 deletes the group" do
      group = group_fixture()
      assert {:ok, %Group{}} = Access.delete_group(group)
      assert_raise Ecto.NoResultsError, fn -> Access.get_group!(group.id) end
    end

    test "change_group/1 returns a group changeset" do
      group = group_fixture()
      assert %Ecto.Changeset{} = Access.change_group(group)
    end
  end
end

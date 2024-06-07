defmodule Operately.AccessTest do
  use Operately.DataCase

  alias Operately.Access

  describe "access_contexts" do
    alias Operately.Access.AccessContext

    import Operately.AccessFixtures

    @invalid_attrs %{}

    test "list_access_contexts/0 returns all access_contexts" do
      access_context = access_context_fixture()
      assert Access.list_access_contexts() == [access_context]
    end

    test "get_access_context!/1 returns the access_context with given id" do
      access_context = access_context_fixture()
      assert Access.get_access_context!(access_context.id) == access_context
    end

    test "create_access_context/1 with valid data creates a access_context" do
      valid_attrs = %{}

      assert {:ok, %AccessContext{} = access_context} = Access.create_access_context(valid_attrs)
    end

    test "create_access_context/1 with invalid data returns error changeset" do
      assert {:error, %Ecto.Changeset{}} = Access.create_access_context(@invalid_attrs)
    end

    test "update_access_context/2 with valid data updates the access_context" do
      access_context = access_context_fixture()
      update_attrs = %{}

      assert {:ok, %AccessContext{} = access_context} = Access.update_access_context(access_context, update_attrs)
    end

    test "update_access_context/2 with invalid data returns error changeset" do
      access_context = access_context_fixture()
      assert {:error, %Ecto.Changeset{}} = Access.update_access_context(access_context, @invalid_attrs)
      assert access_context == Access.get_access_context!(access_context.id)
    end

    test "delete_access_context/1 deletes the access_context" do
      access_context = access_context_fixture()
      assert {:ok, %AccessContext{}} = Access.delete_access_context(access_context)
      assert_raise Ecto.NoResultsError, fn -> Access.get_access_context!(access_context.id) end
    end

    test "change_access_context/1 returns a access_context changeset" do
      access_context = access_context_fixture()
      assert %Ecto.Changeset{} = Access.change_access_context(access_context)
    end
  end

  describe "access_groups" do
    alias Operately.Access.AccessGroup

    import Operately.AccessFixtures

    @invalid_attrs %{}

    test "list_access_groups/0 returns all access_groups" do
      access_group = access_group_fixture()
      assert Access.list_access_groups() == [access_group]
    end

    test "get_access_group!/1 returns the access_group with given id" do
      access_group = access_group_fixture()
      assert Access.get_access_group!(access_group.id) == access_group
    end

    test "create_access_group/1 with valid data creates a access_group" do
      valid_attrs = %{}

      assert {:ok, %AccessGroup{} = access_group} = Access.create_access_group(valid_attrs)
    end

    test "create_access_group/1 with invalid data returns error changeset" do
      assert {:error, %Ecto.Changeset{}} = Access.create_access_group(@invalid_attrs)
    end

    test "update_access_group/2 with valid data updates the access_group" do
      access_group = access_group_fixture()
      update_attrs = %{}

      assert {:ok, %AccessGroup{} = access_group} = Access.update_access_group(access_group, update_attrs)
    end

    test "update_access_group/2 with invalid data returns error changeset" do
      access_group = access_group_fixture()
      assert {:error, %Ecto.Changeset{}} = Access.update_access_group(access_group, @invalid_attrs)
      assert access_group == Access.get_access_group!(access_group.id)
    end

    test "delete_access_group/1 deletes the access_group" do
      access_group = access_group_fixture()
      assert {:ok, %AccessGroup{}} = Access.delete_access_group(access_group)
      assert_raise Ecto.NoResultsError, fn -> Access.get_access_group!(access_group.id) end
    end

    test "change_access_group/1 returns a access_group changeset" do
      access_group = access_group_fixture()
      assert %Ecto.Changeset{} = Access.change_access_group(access_group)
    end
  end

  describe "access_bindings" do
    alias Operately.Access.AccessBinding

    import Operately.AccessFixtures

    @invalid_attrs %{access_level: nil}

    test "list_access_bindings/0 returns all access_bindings" do
      access_binding = access_binding_fixture()
      assert Access.list_access_bindings() == [access_binding]
    end

    test "get_access_binding!/1 returns the access_binding with given id" do
      access_binding = access_binding_fixture()
      assert Access.get_access_binding!(access_binding.id) == access_binding
    end

    test "create_access_binding/1 with valid data creates a access_binding" do
      valid_attrs = %{access_level: :full_access}

      assert {:ok, %AccessBinding{} = access_binding} = Access.create_access_binding(valid_attrs)
      assert access_binding.access_level == :full_access
    end

    test "create_access_binding/1 with invalid data returns error changeset" do
      assert {:error, %Ecto.Changeset{}} = Access.create_access_binding(@invalid_attrs)
    end

    test "update_access_binding/2 with valid data updates the access_binding" do
      access_binding = access_binding_fixture()
      update_attrs = %{access_level: :edit_access}

      assert {:ok, %AccessBinding{} = access_binding} = Access.update_access_binding(access_binding, update_attrs)
      assert access_binding.access_level == :edit_access
    end

    test "update_access_binding/2 with invalid data returns error changeset" do
      access_binding = access_binding_fixture()
      assert {:error, %Ecto.Changeset{}} = Access.update_access_binding(access_binding, @invalid_attrs)
      assert access_binding == Access.get_access_binding!(access_binding.id)
    end

    test "delete_access_binding/1 deletes the access_binding" do
      access_binding = access_binding_fixture()
      assert {:ok, %AccessBinding{}} = Access.delete_access_binding(access_binding)
      assert_raise Ecto.NoResultsError, fn -> Access.get_access_binding!(access_binding.id) end
    end

    test "change_access_binding/1 returns a access_binding changeset" do
      access_binding = access_binding_fixture()
      assert %Ecto.Changeset{} = Access.change_access_binding(access_binding)
    end
  end

  describe "access_group_memberships" do
    alias Operately.Access.AccessGroupMembership

    import Operately.AccessFixtures

    @invalid_attrs %{}

    test "list_access_group_memberships/0 returns all access_group_memberships" do
      access_group_membership = access_group_membership_fixture()
      assert Access.list_access_group_memberships() == [access_group_membership]
    end

    test "get_access_group_membership!/1 returns the access_group_membership with given id" do
      access_group_membership = access_group_membership_fixture()
      assert Access.get_access_group_membership!(access_group_membership.id) == access_group_membership
    end

    test "create_access_group_membership/1 with valid data creates a access_group_membership" do
      valid_attrs = %{}

      assert {:ok, %AccessGroupMembership{} = access_group_membership} = Access.create_access_group_membership(valid_attrs)
    end

    test "create_access_group_membership/1 with invalid data returns error changeset" do
      assert {:error, %Ecto.Changeset{}} = Access.create_access_group_membership(@invalid_attrs)
    end

    test "update_access_group_membership/2 with valid data updates the access_group_membership" do
      access_group_membership = access_group_membership_fixture()
      update_attrs = %{}

      assert {:ok, %AccessGroupMembership{} = access_group_membership} = Access.update_access_group_membership(access_group_membership, update_attrs)
    end

    test "update_access_group_membership/2 with invalid data returns error changeset" do
      access_group_membership = access_group_membership_fixture()
      assert {:error, %Ecto.Changeset{}} = Access.update_access_group_membership(access_group_membership, @invalid_attrs)
      assert access_group_membership == Access.get_access_group_membership!(access_group_membership.id)
    end

    test "delete_access_group_membership/1 deletes the access_group_membership" do
      access_group_membership = access_group_membership_fixture()
      assert {:ok, %AccessGroupMembership{}} = Access.delete_access_group_membership(access_group_membership)
      assert_raise Ecto.NoResultsError, fn -> Access.get_access_group_membership!(access_group_membership.id) end
    end

    test "change_access_group_membership/1 returns a access_group_membership changeset" do
      access_group_membership = access_group_membership_fixture()
      assert %Ecto.Changeset{} = Access.change_access_group_membership(access_group_membership)
    end
  end
end

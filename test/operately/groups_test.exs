defmodule Operately.GroupsTest do
  use Operately.DataCase

  alias Operately.Groups

  describe "groups" do
    alias Operately.Groups.Group

    import Operately.GroupsFixtures
    import Operately.PeopleFixtures
    import Operately.CompaniesFixtures

    @invalid_attrs %{name: nil}

    setup do
      company = company_fixture()
      person = person_fixture(%{company_id: company.id})
      group = group_fixture(person, %{company_id: company.id})

      %{creator: person, group: group, company: company}
    end

    test "list_groups/0 returns all groups", ctx do
      assert Groups.list_groups() == [ctx.group]
    end

    test "list_potential_members returns members that are not in the group", ctx do
      person1 = person_fixture(full_name: "John Doe", title: "CEO", company_id: ctx.company.id)
      person2 = person_fixture(full_name: "Mike Smith", title: "CTO", company_id: ctx.company.id)

      assert Groups.list_potential_members(ctx.group.id, "", [], 10) == [person1, person2]
      assert Groups.list_potential_members(ctx.group.id, "", [person1.id], 10) == [person2]
      assert Groups.list_potential_members(ctx.group.id, "Doe", [], 10) == [person1]
      assert Groups.list_potential_members(ctx.group.id, "CTO", [], 10) == [person2]

      {:ok, _} = Groups.add_members(ctx.group, [person1.id])

      assert Groups.list_potential_members(ctx.group.id, "", [], 10) == [person2]
    end

    test "get_group!/1 returns the group with given id", ctx do
      assert Groups.get_group!(ctx.group.id) == ctx.group
    end

    test "create_group/1 with valid data creates a group", ctx do
      valid_attrs = %{name: "some name", mission: "some mission", company_id: ctx.company.id}

      assert {:ok, %Group{} = group} = Groups.create_group(ctx.creator, valid_attrs)
      assert group.name == "some name"
    end

    test "create_group/1 with invalid data returns error changeset", ctx do
      assert {:error, :group, %Ecto.Changeset{}, _} = Groups.create_group(ctx.creator, @invalid_attrs)
    end

    test "update_group/2 with valid data updates the group", ctx do
      update_attrs = %{name: "some updated name"}

      assert {:ok, %Group{} = group} = Groups.update_group(ctx.group, update_attrs)
      assert group.name == "some updated name"
    end

    test "update_group/2 with invalid data returns error changeset", ctx do
      assert {:error, %Ecto.Changeset{}} = Groups.update_group(ctx.group, @invalid_attrs)
      assert ctx.group == Groups.get_group!(ctx.group.id)
    end

    test "delete_group/1 deletes the group", ctx do
      Groups.remove_member(ctx.group, ctx.creator.id)
      assert {:ok, %Group{}} = Groups.delete_group(ctx.group)
      assert_raise Ecto.NoResultsError, fn -> Groups.get_group!(ctx.group.id) end
    end

    test "change_group/1 returns a group changeset", ctx do
      assert %Ecto.Changeset{} = Groups.change_group(ctx.group)
    end
  end
end

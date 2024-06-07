defmodule Operately.AccessGroupMembershipsTest do
  use Operately.DataCase

  alias Operately.Access
  alias Operately.Access.GroupMembership

  import Operately.AccessFixtures
  import Operately.PeopleFixtures
  import Operately.CompaniesFixtures

  describe "access_group_memberships" do
    @invalid_attrs %{}

    setup do
      company = company_fixture()
      person = person_fixture(company_id: company.id)
      group = group_fixture()

      {:ok, %{person: person, group: group, company: company}}
    end

    test "list_group_memberships/0 returns all group_memberships", ctx do
      group_membership = group_membership_fixture(%{
        person_id: ctx.person.id,
        group_id: ctx.group.id,
      })

      assert Access.list_group_memberships() == [group_membership]
    end

    test "get_group_membership!/1 returns the group_membership with given id", ctx do
      group_membership = group_membership_fixture(%{
        person_id: ctx.person.id,
        group_id: ctx.group.id,
      })

      assert Access.get_group_membership!(group_membership.id) == group_membership
    end

    test "create_group_membership/1 with valid data creates a group_membership", ctx do
      valid_attrs = %{
        person_id: ctx.person.id,
        group_id: ctx.group.id,
      }

      assert {:ok, %GroupMembership{} = _group_membership} = Access.create_group_membership(valid_attrs)
    end

    test "create_group_membership/1 with invalid data returns error changeset" do
      assert {:error, %Ecto.Changeset{}} = Access.create_group_membership(@invalid_attrs)
    end

    test "update_group_membership/2 with valid data updates the group_membership", ctx do
      another_person = person_fixture(company_id: ctx.company.id)
      group_membership = group_membership_fixture(%{
        person_id: ctx.person.id,
        group_id: ctx.group.id,
      })

      update_attrs = %{person_id: another_person.id}

      assert {:ok, %GroupMembership{} = _group_membership} = Access.update_group_membership(group_membership, update_attrs)
    end

    test "delete_group_membership/1 deletes the group_membership", ctx do
      group_membership = group_membership_fixture(%{
        person_id: ctx.person.id,
        group_id: ctx.group.id,
      })

      assert {:ok, %GroupMembership{}} = Access.delete_group_membership(group_membership)
      assert_raise Ecto.NoResultsError, fn -> Access.get_group_membership!(group_membership.id) end
    end

    test "change_group_membership/1 returns a group_membership changeset", ctx do
      group_membership = group_membership_fixture(%{
        person_id: ctx.person.id,
        group_id: ctx.group.id,
      })

      assert %Ecto.Changeset{} = Access.change_group_membership(group_membership)
    end
  end
end

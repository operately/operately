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

    test "list_potential_members returns members that are not in the group", ctx do
      person0 = Ecto.assoc(ctx.company, :people) |> Repo.all() |> hd()
      person1 = person_fixture(full_name: "John Doe", title: "CEO", company_id: ctx.company.id)
      person2 = person_fixture(full_name: "Mike Smith", title: "CTO", company_id: ctx.company.id)

      assert Groups.list_potential_members(ctx.group.id, "", [], 10) == [person1, person0, person2]
      assert Groups.list_potential_members(ctx.group.id, "", [person0.id, person1.id], 10) == [person2]
      assert Groups.list_potential_members(ctx.group.id, "Doe", [], 10) == [person1]
      assert Groups.list_potential_members(ctx.group.id, "CTO", [], 10) == [person2]
    end

    test "get_group!/1 returns the group with given id", ctx do
      assert Groups.get_group!(ctx.group.id) == ctx.group
    end

    test "create_group/1 with valid data creates a group", ctx do
      valid_attrs = %{name: "some name", mission: "some mission", company_id: ctx.company.id}

      assert {:ok, %Group{} = group} = Groups.create_group(ctx.creator, valid_attrs)
      assert group.name == "some name"
    end

    test "create_group/1 creates group with default task statuses", ctx do
      valid_attrs = %{name: "space with defaults", mission: "some mission", company_id: ctx.company.id}

      assert {:ok, %Group{} = group} = Groups.create_group(ctx.creator, valid_attrs)

      assert length(group.task_statuses) == 4

      statuses_by_value = Enum.group_by(group.task_statuses, & &1.value)
      assert Map.has_key?(statuses_by_value, "pending")
      assert Map.has_key?(statuses_by_value, "in_progress")
      assert Map.has_key?(statuses_by_value, "done")
      assert Map.has_key?(statuses_by_value, "canceled")

      pending = hd(statuses_by_value["pending"])
      assert pending.label == "Not started"
      assert pending.color == :gray
    end

    test "create_group/1 creates group with default tools", ctx do
      valid_attrs = %{name: "space with defaults", mission: "some mission", company_id: ctx.company.id}

      assert {:ok, %Group{} = group} = Groups.create_group(ctx.creator, valid_attrs)

      assert group.tools != nil
      assert group.tools.tasks_enabled == false
      assert group.tools.discussions_enabled == true
      assert group.tools.resource_hub_enabled == true
    end

    test "create_group/1 creates group with custom tools", ctx do
      valid_attrs = %{
        name: "space with custom tools",
        mission: "some mission",
        company_id: ctx.company.id,
        tools: %{
          tasks_enabled: true,
          discussions_enabled: false,
          resource_hub_enabled: false
        }
      }

      assert {:ok, %Group{} = group} = Groups.create_group(ctx.creator, valid_attrs)

      assert group.tools.tasks_enabled == true
      assert group.tools.discussions_enabled == false
      assert group.tools.resource_hub_enabled == false
    end

    test "create_group/1 with invalid data returns error changeset", ctx do
      assert {:error, :group, %Ecto.Changeset{}, _} = Groups.create_group(ctx.creator, @invalid_attrs)
    end

    test "update_group/2 with valid data updates the group", ctx do
      update_attrs = %{name: "some updated name"}

      assert {:ok, %Group{} = group} = Groups.update_group(ctx.group, update_attrs)
      assert group.name == "some updated name"
    end

    test "update_group/2 does not overwrite custom task statuses", ctx do
      custom_statuses = [
        %{
          id: "custom_todo",
          label: "Custom Todo",
          color: :gray,
          index: 0,
          value: "custom_todo",
          closed: false
        }
      ]

      assert {:ok, %Group{} = group_with_custom_statuses} =
               Groups.update_group(ctx.group, %{task_statuses: custom_statuses})

      assert Enum.map(group_with_custom_statuses.task_statuses, & &1.id) == ["custom_todo"]

      assert {:ok, %Group{} = updated_group} =
               Groups.update_group(group_with_custom_statuses, %{name: "some updated name"})

      assert updated_group.name == "some updated name"
      assert Enum.map(updated_group.task_statuses, & &1.id) == ["custom_todo"]
    end

    test "update_group/2 can update tools settings", ctx do
      assert ctx.group.tools.tasks_enabled == false

      assert {:ok, %Group{} = updated_group} =
               Groups.update_group(ctx.group, %{tools: %{tasks_enabled: true}})

      assert updated_group.tools.tasks_enabled == true
      assert updated_group.tools.discussions_enabled == true
      assert updated_group.tools.resource_hub_enabled == true
    end

    test "update_group/2 does not overwrite tools when updating other fields", ctx do
      assert {:ok, %Group{} = group_with_tasks} =
               Groups.update_group(ctx.group, %{tools: %{tasks_enabled: true}})

      assert group_with_tasks.tools.tasks_enabled == true

      assert {:ok, %Group{} = updated_group} =
               Groups.update_group(group_with_tasks, %{name: "some updated name"})

      assert updated_group.name == "some updated name"
      assert updated_group.tools.tasks_enabled == true
    end

    test "update_group/2 with invalid data returns error changeset", ctx do
      assert {:error, %Ecto.Changeset{}} = Groups.update_group(ctx.group, @invalid_attrs)
      assert ctx.group == Groups.get_group!(ctx.group.id)
    end

    test "change_group/1 returns a group changeset", ctx do
      assert %Ecto.Changeset{} = Groups.change_group(ctx.group)
    end
  end
end

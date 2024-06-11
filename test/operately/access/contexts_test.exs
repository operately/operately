defmodule Operately.AccessContextsTest do
  use Operately.DataCase

  alias Operately.Access
  alias Operately.Access.Context

  import Operately.AccessFixtures, only: [context_fixture: 1]
  import Operately.PeopleFixtures
  import Operately.GroupsFixtures
  import Operately.ProjectsFixtures
  import Operately.CompaniesFixtures

  describe "access_contexts" do
    setup do
      company = company_fixture()
      creator = person_fixture_with_account(%{company_id: company.id})
      group = group_fixture(creator)
      project = project_fixture(%{company_id: company.id, group_id: group.id, creator_id: creator.id})
      context = context_fixture(%{project_id: project.id})

      {:ok, company: company, group: group, creator: creator, context: context}
    end

    test "list_contexts/0 returns all contexts", ctx do
      assert Access.list_contexts() == [ctx.context]
    end

    test "get_context!/1 returns the context with given id", ctx do
      assert Access.get_context!(ctx.context.id) == ctx.context
    end

    test "create_context/1 with valid data creates a context", ctx do
      another_project = project_fixture(%{company_id: ctx.company.id, group_id: ctx.group.id, creator_id: ctx.creator.id})
      valid_attrs = %{project_id: another_project.id}

      assert {:ok, %Context{} = _context} = Access.create_context(valid_attrs)
    end

    test "update_context/2 with valid data updates the context", ctx do
      another_project = project_fixture(%{company_id: ctx.company.id, group_id: ctx.group.id, creator_id: ctx.creator.id})
      update_attrs = %{project_id: another_project.id}

      assert {:ok, %Context{} = _context} = Access.update_context(ctx.context, update_attrs)
    end

    test "delete_context/1 deletes the context", ctx do
      assert {:ok, %Context{}} = Access.delete_context(ctx.context)
      assert_raise Ecto.NoResultsError, fn -> Access.get_context!(ctx.context.id) end
    end

    test "change_context/1 returns a context changeset", ctx do
      assert %Ecto.Changeset{} = Access.change_context(ctx.context)
    end
  end

  describe "access_contexts relationships with projects, groups, activities and companies" do
    import Operately.ActivitiesFixtures

    setup do
      company = company_fixture()
      creator = person_fixture_with_account(%{company_id: company.id})
      group = group_fixture(creator)
      project = project_fixture(%{company_id: company.id, group_id: group.id, creator_id: creator.id})
      activity = activity_fixture(%{author_id: creator.id})

      {:ok, company: company, group: group, project: project, activity: activity}
    end

    test "create access_context for a group", ctx do
      attrs = %{group_id: ctx.group.id}

      assert {:ok, %Context{} = _context} = Access.create_context(attrs)
    end

    test "create access_context for a project", ctx do
      attrs = %{project_id: ctx.project.id}

      assert {:ok, %Context{} = _context} = Access.create_context(attrs)
    end

    test "create access_context for an activity", ctx do
      attrs = %{activity_id: ctx.activity.id}

      assert {:ok, %Context{} = _context} = Access.create_context(attrs)
    end

    test "access_context cannot be attached to more than one entity", ctx do
      attrs = %{project_id: ctx.project.id, group_id: ctx.group.id}
      changeset = Context.changeset(%Context{}, attrs)

      refute changeset.valid?
      assert {:error, %Ecto.Changeset{}} = Access.create_context(attrs)

      attrs = %{activity_id: ctx.activity.id, group_id: ctx.group.id}
      changeset = Context.changeset(%Context{}, attrs)

      refute changeset.valid?
      assert {:error, %Ecto.Changeset{}} = Access.create_context(attrs)
    end
  end
end

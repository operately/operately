defmodule Operately.Data.Change021CreateProjectBindingsToCompanyAndSpaceTest do
  use Operately.DataCase

  import Operately.CompaniesFixtures
  import Operately.PeopleFixtures
  import Operately.GroupsFixtures
  import Operately.ProjectsFixtures

  alias Operately.Repo
  alias Operately.Access
  alias Operately.Access.Binding
  alias Operately.Projects.Project

  setup do
    company = company_fixture()
    creator = person_fixture_with_account(%{company_id: company.id})
    group = group_fixture(creator)

    project_with_bindings = Enum.map(1..3, fn _ ->
      create_project_with_bindings(%{
        company_id: company.id,
        creator_id: creator.id,
        group_id: group.id,
      })
    end)

    project_without_bindings = Enum.map(1..3, fn _ ->
      create_project_without_bindings(%{
        company_id: company.id,
        creator_id: creator.id,
        group_id: group.id,
      })
    end)

    {:ok, company: company, group: group, creator: creator, project_with_bindings: project_with_bindings, project_without_bindings: project_without_bindings}
  end

  test "creates access binding to companies", ctx do
    Enum.each(ctx.project_with_bindings, fn project ->
      context = Access.get_context!(project_id: project.id)

      full_access = Access.get_group!(company_id: ctx.company.id, tag: :full_access)
      standard = Access.get_group!(company_id: ctx.company.id, tag: :standard)

      assert Access.get_binding(context_id: context.id, group_id: full_access.id)
      assert Access.get_binding(context_id: context.id, group_id: standard.id)
    end)

    Enum.each(ctx.project_without_bindings, fn project ->
      context = Access.get_context!(project_id: project.id)

      full_access = Access.get_group!(company_id: ctx.company.id, tag: :full_access)
      standard = Access.get_group!(company_id: ctx.company.id, tag: :standard)

      refute Access.get_binding(context_id: context.id, group_id: full_access.id)
      refute Access.get_binding(context_id: context.id, group_id: standard.id)
    end)

    Operately.Data.Change021CreateProjectBindingsToCompanyAndSpace.run()

    Enum.each(ctx.project_without_bindings, fn project ->
      context = Access.get_context!(project_id: project.id)

      full_access = Access.get_group!(company_id: ctx.company.id, tag: :full_access)
      standard = Access.get_group!(company_id: ctx.company.id, tag: :standard)

      assert Access.get_binding(context_id: context.id, group_id: full_access.id, access_level: Binding.full_access())
      assert Access.get_binding(context_id: context.id, group_id: standard.id, access_level: Binding.edit_access())
    end)
  end

  test "creates access binding to spaces", ctx do
    Enum.each(ctx.project_with_bindings, fn project ->
      context = Access.get_context!(project_id: project.id)

      full_access = Access.get_group!(group_id: ctx.group.id, tag: :full_access)
      standard = Access.get_group!(group_id: ctx.group.id, tag: :standard)

      assert Access.get_binding(context_id: context.id, group_id: full_access.id)
      assert Access.get_binding(context_id: context.id, group_id: standard.id)
    end)

    Enum.each(ctx.project_without_bindings, fn project ->
      context = Access.get_context!(project_id: project.id)

      full_access = Access.get_group!(group_id: ctx.group.id, tag: :full_access)
      standard = Access.get_group!(group_id: ctx.group.id, tag: :standard)

      refute Access.get_binding(context_id: context.id, group_id: full_access.id)
      refute Access.get_binding(context_id: context.id, group_id: standard.id)
    end)

    Operately.Data.Change021CreateProjectBindingsToCompanyAndSpace.run()

    Enum.each(ctx.project_without_bindings, fn project ->
      context = Access.get_context!(project_id: project.id)

      full_access = Access.get_group!(group_id: ctx.group.id, tag: :full_access)
      standard = Access.get_group!(group_id: ctx.group.id, tag: :standard)

      assert Access.get_binding(context_id: context.id, group_id: full_access.id)
      assert Access.get_binding(context_id: context.id, group_id: standard.id)
    end)
  end

  test "doesn't create access binding to spaces when it's the company space", ctx do
    space_id = ctx.company.company_space_id

    projects_no_space = Enum.map(1..3, fn _ ->
      create_project_without_bindings(%{
        company_id: ctx.company.id,
        creator_id: ctx.creator.id,
        group_id: space_id,
      })
    end)

    Operately.Data.Change021CreateProjectBindingsToCompanyAndSpace.run()

    Enum.each(projects_no_space, fn project ->
      refute Access.get_group(group_id: space_id, tag: :full_access)
      refute Access.get_group(group_id: space_id, tag: :standard)

      context = Access.get_context!(project_id: project.id)

      full_access = Access.get_group!(company_id: ctx.company.id, tag: :full_access)
      standard = Access.get_group!(company_id: ctx.company.id, tag: :standard)

      assert Access.get_binding(context_id: context.id, group_id: full_access.id)
      assert Access.get_binding(context_id: context.id, group_id: standard.id)
    end)
  end

  #
  # Helpers
  #

  defp create_project_with_bindings(attrs) do
    reviewer = person_fixture_with_account(%{company_id: attrs.company_id})
    champion = person_fixture_with_account(%{company_id: attrs.company_id})

    project_fixture(%{
      company_id: attrs.company_id,
      creator_id: attrs.creator_id,
      reviewer_id: reviewer.id,
      champion_id: champion.id,
      group_id: attrs.group_id,
      creator_is_contributor: "yes",
    })
  end

  defp create_project_without_bindings(attrs) do
    {:ok, project} = Project.changeset(%{
      name: "some name",
      company_id: attrs.company_id,
      group_id: attrs.group_id,
      creator_id: attrs.creator_id,
    })
    |> Repo.insert()

    Access.create_context(%{project_id: project.id})

    project
  end
end

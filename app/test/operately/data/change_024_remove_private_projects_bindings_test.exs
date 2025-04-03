defmodule Operately.Data.Change024RemovePrivateProjectsBindingsTest do
  use Operately.DataCase

  import Operately.CompaniesFixtures
  import Operately.PeopleFixtures
  import Operately.GroupsFixtures
  import Operately.ProjectsFixtures

  alias Operately.Access
  alias Operately.Access.Binding

  setup do
    company = company_fixture()
    creator = person_fixture_with_account(%{company_id: company.id})
    space = group_fixture(creator, %{company_id: company.id})

    {:ok, company: company, creator: creator, space: space}
  end

  test "removes private projects bindings", ctx do
    private = Enum.map(1..3, fn _ ->
      create_project(ctx, "no one")
    end)
    public = Enum.map(1..3, fn _ ->
      create_project(ctx, "everyone")
    end)

    assert_has_access(private)
    assert_has_access(public)

    Operately.Data.Change024RemovePrivateProjectsBindings.run()

    private = reload_project(private)
    public = reload_project(public)

    assert_no_access(private)
    assert_has_access(public)
  end

  #
  # Assertions
  #

  defp assert_has_access(projects) do
    Enum.each(projects, fn p ->
      context = Access.get_context!(project_id: p.id)

      fetch_groups(p.company_id, p.group_id)
      |> Enum.each(fn g ->
        assert Access.get_binding(context_id: context.id, group_id: g.id)
        refute Access.get_binding(context_id: context.id, group_id: g.id, access_level: Binding.no_access())
      end)
    end)
  end

  defp assert_no_access(projects) do
    Enum.each(projects, fn p ->
      context = Access.get_context!(project_id: p.id)

      fetch_groups(p.company_id, p.group_id)
      |> Enum.each(fn g ->
        assert Access.get_binding(context_id: context.id, group_id: g.id)
        assert Access.get_binding(context_id: context.id, group_id: g.id, access_level: Binding.no_access())
      end)
    end)
  end

  #
  # Helpers
  #

  defp create_project(ctx, visibility) do
    project_fixture(%{
      company_id: ctx.company.id,
      creator_id: ctx.creator.id,
      group_id: ctx.space.id,
      visibility: visibility,
    })
    |> create_anonymous_binding()
  end

  defp create_anonymous_binding(project) do
    context = Access.get_context!(project_id: project.id)
    group = Access.get_group!(company_id: project.company_id, tag: :anonymous)

    {:ok, _} = Access.create_binding(%{
      context_id: context.id,
      group_id: group.id,
      access_level: Binding.view_access(),
    })

    project
  end

  defp reload_project(projects) do
    Enum.map(projects, &(Repo.reload(&1)))
  end

  defp fetch_groups(company_id, space_id) do
    [
      Access.get_group!(company_id: company_id, tag: :anonymous),
      Access.get_group!(company_id: company_id, tag: :standard),
      Access.get_group!(group_id: space_id, tag: :standard),
    ]
  end
end

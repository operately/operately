defmodule Operately.Operations.ProjectContributorsAdditionTest do
  use Operately.DataCase
  use Operately.Support.Notifications

  import Operately.CompaniesFixtures
  import Operately.PeopleFixtures
  import Operately.ProjectsFixtures

  alias Operately.Projects
  alias Operately.Access
  alias Operately.Access.Binding
  alias Operately.Activities.Activity

  setup do
    company = company_fixture()
    creator = person_fixture_with_account(%{company_id: company.id})
    contributor1 = person_fixture_with_account(%{company_id: company.id})
    contributor2 = person_fixture_with_account(%{company_id: company.id})
    contributor3 = person_fixture_with_account(%{company_id: company.id})
    project = project_fixture(%{company_id: company.id, creator_id: creator.id, group_id: company.company_space_id})

    contributors = [
      %{person_id: contributor1.id, responsibility: "Developer", role: :contributor, access_level: Binding.edit_access()},
      %{person_id: contributor2.id, responsibility: "Designer", role: :contributor, access_level: Binding.view_access()},
      %{person_id: contributor3.id, responsibility: "QA", role: :contributor, access_level: Binding.edit_access()}
    ]

    {:ok, company: company, creator: creator, contributors: [contributor1, contributor2, contributor3], contributor_attrs: contributors, project: project}
  end

  test "ProjectContributorsAddition operation creates multiple contributors", ctx do
    {:ok, created_contributors} =
      Operately.Operations.ProjectContributorsAddition.run(
        ctx.creator,
        ctx.project,
        ctx.contributor_attrs
      )

    assert length(created_contributors) == 3

    db_contributors = Projects.list_project_contributors(ctx.project)
    # +1 for the creator
    assert length(db_contributors) == 4

    Enum.each(ctx.contributor_attrs, fn attr ->
      contributor = Enum.find(db_contributors, fn c -> c.person_id == attr.person_id end)
      assert contributor != nil
      assert contributor.responsibility == attr.responsibility
      assert contributor.role == attr.role
    end)
  end

  test "ProjectContributorsAddition operation creates access bindings for all contributors", ctx do
    context = Access.get_context!(project_id: ctx.project.id)

    Enum.each(ctx.contributors, fn contributor ->
      group = Access.get_group!(person_id: contributor.id)
      refute Access.get_binding(context_id: context.id, group_id: group.id)
    end)

    Operately.Operations.ProjectContributorsAddition.run(ctx.creator, ctx.project, ctx.contributor_attrs)

    Enum.zip(ctx.contributors, ctx.contributor_attrs)
    |> Enum.each(fn {contributor, attrs} ->
      group = Access.get_group!(person_id: contributor.id)
      assert Access.get_binding(context_id: context.id, group_id: group.id)
      assert Access.get_binding(context_id: context.id, group_id: group.id, access_level: attrs.access_level)
    end)
  end

  test "ProjectContributorsAddition operation creates activity", ctx do
    Oban.Testing.with_testing_mode(:manual, fn ->
      Operately.Operations.ProjectContributorsAddition.run(
        ctx.creator,
        ctx.project,
        ctx.contributor_attrs
      )
    end)

    activity = fetch_activity(ctx.project.id)

    assert activity.content["contributors"] != nil
    assert length(activity.content["contributors"]) == 3

    Enum.each(ctx.contributor_attrs, fn attr ->
      contributor_entry =
        Enum.find(activity.content["contributors"], fn c ->
          c["person_id"] == attr.person_id
        end)

      assert contributor_entry["responsibility"] == attr.responsibility
      assert contributor_entry["role"] == Atom.to_string(attr.role)
    end)
  end

  test "ProjectContributorsAddition operation creates notifications for added contributors", ctx do
    Oban.Testing.with_testing_mode(:manual, fn ->
      Operately.Operations.ProjectContributorsAddition.run(
        ctx.creator,
        ctx.project,
        ctx.contributor_attrs
      )
    end)

    activity = fetch_activity(ctx.project.id)

    assert 0 == notifications_count()
    perform_job(activity.id)

    assert fetch_notifications(activity.id)
    assert 3 == notifications_count()
  end

  test "ProjectContributorsAddition doesn't create notification when people add themselves as contributors", ctx do
    [self_contributor | other_contributors] = ctx.contributors

    Oban.Testing.with_testing_mode(:manual, fn ->
      Operately.Operations.ProjectContributorsAddition.run(
        self_contributor,
        ctx.project,
        ctx.contributor_attrs
      )
    end)

    activity = fetch_activity(ctx.project.id)
    assert 0 == notifications_count()

    perform_job(activity.id)

    assert 2 == notifications_count()
    notifications = fetch_notifications(activity.id)

    Enum.each(other_contributors, fn contrib ->
      assert Enum.find(notifications, fn n -> n.person_id == contrib.id end)
    end)
  end

  defp fetch_activity(project_id) do
    from(a in Activity, where: a.action == "project_contributors_addition" and a.content["project_id"] == ^project_id)
    |> Repo.one()
  end
end

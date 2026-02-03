defmodule Operately.Operations.ProjectCreationTest do
  use Operately.DataCase
  use Operately.Support.Notifications

  import Ecto.Query, only: [from: 2]

  import Operately.CompaniesFixtures
  import Operately.PeopleFixtures
  import Operately.GroupsFixtures

  alias Operately.Repo
  alias Operately.Projects
  alias Operately.Access
  alias Operately.Access.Binding
  alias Operately.Activities.Activity
  alias Operately.Notifications.Subscription

  setup do
    company = company_fixture()

    creator = person_fixture_with_account(%{company_id: company.id})
    reviewer = person_fixture_with_account(%{company_id: company.id})
    champion = person_fixture_with_account(%{company_id: company.id})

    space = group_fixture(creator)

    project_attrs = %Operately.Operations.ProjectCreation{
      name: "my project",
      champion_id: champion.id,
      reviewer_id: reviewer.id,
      creator_role: "developer",
      visibility: "everyone",
      creator_id: creator.id,
      company_id: company.id,
      group_id: space.id,
      anonymous_access_level: Binding.view_access(),
      company_access_level: Binding.comment_access(),
      space_access_level: Binding.edit_access(),
    }


    {:ok, company: company, space: space, creator: creator, reviewer: reviewer, champion: champion, project_attrs: project_attrs}
  end

  test "ProjectCreation operation creates project with default task statuses", ctx do
    {:ok, project} = Operately.Operations.ProjectCreation.run(ctx.project_attrs)

    # Verify project has 4 default task statuses
    assert length(project.task_statuses) == 4

    # Verify the default statuses are present
    statuses_by_value = Enum.group_by(project.task_statuses, & &1.value)
    assert Map.has_key?(statuses_by_value, "pending")
    assert Map.has_key?(statuses_by_value, "in_progress")
    assert Map.has_key?(statuses_by_value, "done")
    assert Map.has_key?(statuses_by_value, "canceled")

    # Verify specific properties of default statuses
    pending = hd(statuses_by_value["pending"])
    assert pending.label == "Not started"
    assert pending.color == :gray

    in_progress = hd(statuses_by_value["in_progress"])
    assert in_progress.label == "In progress"
    assert in_progress.color == :blue

    done = hd(statuses_by_value["done"])
    assert done.label == "Done"
    assert done.color == :green
    assert done.closed == true

    canceled = hd(statuses_by_value["canceled"])
    assert canceled.label == "Canceled"
    assert canceled.color == :red
    assert canceled.closed == true
  end

  test "ProjectCreation operation creates project", ctx do
    {:ok, project} = Operately.Operations.ProjectCreation.run(ctx.project_attrs)

    contributors = Projects.list_project_contributors(project)

    assert length(contributors) == 3

    contributors = Enum.map(contributors, fn contributor -> {contributor.person_id, contributor.role} end)

    assert Enum.member?(contributors, {ctx.creator.id, :contributor})
    assert Enum.member?(contributors, {ctx.reviewer.id, :reviewer})
    assert Enum.member?(contributors, {ctx.champion.id, :champion})
  end

  test "ProjectCreation operation doesn't add creator as contributor when creator is champion", ctx do
    attrs = Map.merge(ctx.project_attrs, %{champion_id: ctx.creator.id})

    {:ok, project} = Operately.Operations.ProjectCreation.run(attrs)

    contributors = Projects.list_project_contributors(project) |> Enum.map(fn contributor -> {contributor.person_id, contributor.role} end)

    assert length(contributors) == 2
    assert Enum.member?(contributors, {ctx.creator.id, :champion})
    assert Enum.member?(contributors, {ctx.reviewer.id, :reviewer})
    refute Enum.member?(contributors, {ctx.creator.id, :contributor})
  end

  test "ProjectCreation operation doesn't add creator as contributor when creator is reviewer", ctx do
    attrs = Map.merge(ctx.project_attrs, %{reviewer_id: ctx.creator.id})

    {:ok, project} = Operately.Operations.ProjectCreation.run(attrs)

    contributors = Projects.list_project_contributors(project) |> Enum.map(fn contributor -> {contributor.person_id, contributor.role} end)

    assert length(contributors) == 2
    assert Enum.member?(contributors, {ctx.creator.id, :reviewer})
    assert Enum.member?(contributors, {ctx.champion.id, :champion})
    refute Enum.member?(contributors, {ctx.creator.id, :contributor})
  end

  test "ProjectCreation operation creates bindings to company", ctx do
    {:ok, project} = Operately.Operations.ProjectCreation.run(ctx.project_attrs)

    context = Access.get_context!(project_id: project.id)

    full_access = Access.get_group!(company_id: ctx.company.id, tag: :full_access)
    members = Access.get_group!(company_id: ctx.company.id, tag: :standard)
    anonymous = Access.get_group!(company_id: ctx.company.id, tag: :anonymous)

    assert Access.get_binding(group_id: full_access.id, context_id: context.id, access_level: Binding.full_access())
    assert Access.get_binding(group_id: members.id, context_id: context.id, access_level: Binding.comment_access())
    assert Access.get_binding(group_id: anonymous.id, context_id: context.id, access_level: Binding.view_access())
  end

  test "ProjectCreation operation creates bindings to space", ctx do
    {:ok, project} = Operately.Operations.ProjectCreation.run(ctx.project_attrs)

    context = Access.get_context!(project_id: project.id)
    full_access = Access.get_group!(group_id: ctx.space.id, tag: :full_access)
    members = Access.get_group!(group_id: ctx.space.id, tag: :standard)

    assert Access.get_binding(group_id: full_access.id, context_id: context.id, access_level: Binding.full_access())
    assert Access.get_binding(group_id: members.id, context_id: context.id, access_level: Binding.edit_access())
  end

  test "ProjectCreation operation creates bindings to contributors", ctx do
    {:ok, project} = Operately.Operations.ProjectCreation.run(ctx.project_attrs)

    context = Access.get_context!(project_id: project.id)
    creator = Access.get_group!(person_id: ctx.creator.id)
    reviewer = Access.get_group!(person_id: ctx.reviewer.id)
    champion = Access.get_group!(person_id: ctx.champion.id)

    assert Access.get_binding(group_id: creator.id, context_id: context.id, access_level: Binding.full_access())
    assert Access.get_binding(group_id: reviewer.id, context_id: context.id, access_level: Binding.full_access())
    assert Access.get_binding(group_id: champion.id, context_id: context.id, access_level: Binding.full_access())
  end

  test "ProjectCreation operation creates subscriptions for contributors", ctx do
    {:ok, project} = Operately.Operations.ProjectCreation.run(ctx.project_attrs)

    {:ok, champion_subscription} =
      Subscription.get(:system,
        subscription_list_id: project.subscription_list_id,
        person_id: ctx.champion.id
      )
    assert champion_subscription.type == :invited
    refute champion_subscription.canceled

    {:ok, reviewer_subscription} =
      Subscription.get(:system,
        subscription_list_id: project.subscription_list_id,
        person_id: ctx.reviewer.id
      )
    assert reviewer_subscription.type == :invited
    refute reviewer_subscription.canceled

    {:ok, creator_subscription} =
      Subscription.get(:system,
        subscription_list_id: project.subscription_list_id,
        person_id: ctx.creator.id
      )
    assert creator_subscription.type == :invited
    refute creator_subscription.canceled
  end

  test "ProjectCreation operation always adds creator as contributor", ctx do
    {:ok, project} = Operately.Operations.ProjectCreation.run(ctx.project_attrs)

    contributors = Projects.list_project_contributors(project) |> Enum.map(fn c -> {c.person_id, c.role} end)

    assert Enum.member?(contributors, {ctx.creator.id, :contributor})

    context = Access.get_context!(project_id: project.id)
    creator = Access.get_group!(person_id: ctx.creator.id)

    assert Access.get_binding(group_id: creator.id, context_id: context.id, access_level: Binding.full_access())
  end

  test "ProjectCreation operation doesn't create bindings to space", ctx do
    attrs = Map.merge(ctx.project_attrs, %{group_id: ctx.company.company_space_id})

    {:ok, project} = Operately.Operations.ProjectCreation.run(attrs)

    context = Access.get_context!(project_id: project.id)
    full_access = Access.get_group!(group_id: ctx.space.id, tag: :full_access)
    members = Access.get_group!(group_id: ctx.space.id, tag: :standard)

    refute Access.get_binding(group_id: full_access.id, context_id: context.id)
    refute Access.get_binding(group_id: members.id, context_id: context.id)
  end

  test "ProjectCreation operation doesn't create without champion or reviewer", ctx do
    {_, attrs} = Map.pop(ctx.project_attrs, :champion_id)

    assert_raise KeyError, ~r/^key :champion_id not found in:/, fn ->
      Operately.Operations.ProjectCreation.run(attrs)
    end

    {_, attrs} = Map.pop(ctx.project_attrs, :reviewer_id)

    assert_raise KeyError, ~r/^key :reviewer_id not found in:/, fn ->
      Operately.Operations.ProjectCreation.run(attrs)
    end
  end

  test "ProjectCreation operation adds tags to reviewer's and champion's bindings", ctx do
    {:ok, project} = Operately.Operations.ProjectCreation.run(ctx.project_attrs)

    context = Access.get_context!(project_id: project.id)
    reviewer = Access.get_group!(person_id: ctx.reviewer.id)
    champion = Access.get_group!(person_id: ctx.champion.id)

    assert Access.get_binding(group_id: reviewer.id, context_id: context.id)
    assert Access.get_binding(tag: :reviewer, group_id: reviewer.id, context_id: context.id, access_level: Binding.full_access())

    assert Access.get_binding(group_id: champion.id, context_id: context.id)
    assert Access.get_binding(tag: :champion, group_id: champion.id, context_id: context.id, access_level: Binding.full_access())
  end

  test "ProjectCreation operation creates activity and notification", ctx do
    {:ok, project} = Oban.Testing.with_testing_mode(:manual, fn ->
      Operately.Operations.ProjectCreation.run(ctx.project_attrs)
    end)

    activity = from(a in Activity, where: a.action == "project_created" and a.content["project_id"] == ^project.id) |> Repo.one()

    assert 0 == notifications_count()

    perform_job(activity.id)

    assert fetch_notifications(activity.id)
    assert 2 == notifications_count()
  end
end

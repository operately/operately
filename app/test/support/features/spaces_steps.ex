defmodule Operately.Support.Features.SpacesSteps do
  use Operately.FeatureCase

  alias Operately.Access.Binding
  alias Operately.Support.Features.UI
  alias Operately.Support.Features.NotificationsSteps
  alias Operately.Support.Features.EmailSteps
  alias Operately.Support.{Factory, RichText}

  import Operately.GroupsFixtures
  import Operately.PeopleFixtures
  import Operately.ProjectsFixtures

  step :setup, ctx do
    ctx
    |> Factory.setup()
    |> Factory.log_in_person(:creator)
  end

  step(:visit_home, ctx, do: UI.visit(ctx, Paths.home_path(ctx.company)))
  step(:visit_space, ctx, do: UI.visit(ctx, Paths.space_path(ctx.company, ctx.marketing)))

  step :visit_access_management, ctx, name do
    ctx
    |> UI.click(title: name)
    |> UI.click(testid: "access-management")
  end

  step :given_two_spaces_exists, ctx do
    space1 = group_fixture(ctx.creator, %{name: "Marketing", mission: "Let the world know about our products", company_permissions: Binding.view_access()})
    space2 = group_fixture(ctx.creator, %{name: "Engineering", mission: "Build the best product", company_permissions: Binding.no_access()})

    Map.merge(ctx, %{spaces: [space1, space2]})
  end

  step :given_space_with_member_exists, ctx, attrs do
    space = group_fixture(ctx.creator, %{name: attrs.space_name})
    member = person_fixture_with_account(%{full_name: attrs.person_name, company_id: ctx.company.id})

    Operately.Groups.add_members(ctx.creator, space.id, [
      %{
        id: member.id,
        access_level: attrs[:access_level] || Operately.Access.Binding.comment_access()
      }
    ])

    [space, member]
  end

  step :assert_all_spaces_are_listed, ctx do
    Enum.reduce(ctx.spaces, ctx, fn space, ctx ->
      ctx
      |> UI.assert_text(space.name)
      |> UI.assert_text(space.mission)
    end)
  end

  step(:click_on_add_space, ctx, do: UI.click(ctx, testid: "add-space"))

  step :fill_in_space_form, ctx, %{name: name, mission: mission} do
    ctx
    |> UI.fill(testid: "name", with: name)
    |> UI.fill(testid: "mission", with: mission)
  end

  step(:submit_space_form, ctx, do: UI.click(ctx, Query.button("Create Space")))

  step :assert_space_created, ctx, %{name: name, mission: mission} do
    UI.sleep(ctx, 500)

    group = Operately.Groups.get_group_by_name(name)
    assert group != nil

    ctx
    |> UI.assert_has(Query.text(name, count: 1))
    |> UI.assert_has(Query.text(mission))
  end

  step :assert_creator_is_space_member, ctx, %{name: name} do
    group = Operately.Groups.get_group_by_name(name)

    members = Operately.Groups.list_members(group)
    assert Enum.find(members, fn member -> member.id == ctx.creator.id end) != nil

    ctx
  end

  step :add_new_members, ctx, members do
    ctx
    |> UI.visit(Paths.space_path(ctx.company, ctx.marketing))
    |> UI.click(testid: "access-management")
    |> UI.click(testid: "add-members")

    ctx =
      Enum.reduce(Enum.with_index(members), ctx, fn {person, index}, ctx ->
        UI.find(ctx, UI.query(testid: "member-#{index}"), fn ctx ->
          UI.select_person_in(ctx, testid: "members-#{index}-personid", name: person.full_name)
        end)

        if index == length(members) - 1 do
          ctx
        else
          ctx |> UI.click(testid: "add-more")
        end
      end)

    ctx
    |> UI.click(testid: "submit")
    |> UI.assert_has(testid: "space-access-management-page")
  end

  step :remove_member, ctx, person do
    ctx
    |> UI.click(testid: UI.testid(["member", "menu", person.full_name]))
    |> UI.click(testid: "remove-member")
    |> UI.sleep(500)
  end

  step :assert_members_added, ctx, members do
    ctx
    |> UI.find(UI.query(testid: "members-section"), fn ctx ->
      Enum.reduce(members, ctx, fn person, ctx ->
        ctx |> UI.assert_text(person.full_name)
      end)
    end)
  end

  step :assert_member_removed, ctx, person do
    ctx |> UI.refute_text(person.full_name)
  end

  step :assert_members_added_notification_sent, ctx, members do
    Enum.reduce(members, ctx, fn member, ctx ->
      ctx
      |> UI.login_as(member)
      |> NotificationsSteps.assert_space_members_added_sent(author: ctx.creator, title: ctx.marketing.name)
    end)
  end

  step :assert_members_added_email_sent, ctx, members do
    Enum.reduce(members, ctx, fn member, ctx ->
      ctx
      |> EmailSteps.assert_space_members_added_sent(author: ctx.creator, to: member, title: ctx.marketing.name)
    end)
  end

  step :given_a_space_exists, ctx do
    ctx |> Factory.add_space(:marketing, name: "Marketing")
  end

  step :given_the_space_has_several_projects, ctx, names do
    Enum.map(names, fn name ->
      project_fixture(%{
        name: name,
        company_id: ctx.company.id,
        creator_id: ctx.creator.id,
        group_id: ctx.marketing.id
      })
    end)

    ctx
  end

  step :given_the_space_has_several_space_wide_projects, ctx, names do
    Enum.map(names, fn name ->
      project_fixture(%{
        name: name,
        company_id: ctx.company.id,
        creator_id: ctx.creator.id,
        group_id: ctx.marketing.id,
        anonymous_access_level: Binding.no_access(),
        company_access_level: Binding.no_access(),
        space_access_level: Binding.comment_access()
      })
    end)

    ctx
  end

  step :click_on_space, ctx do
    ctx |> UI.click(title: ctx.marketing.name)
  end

  step :assert_space_name_mission_and_privacy_indicator, ctx do
    ctx
    |> UI.assert_text(ctx.marketing.name)
    |> UI.assert_text(ctx.marketing.mission)
    |> UI.assert_has(testid: "secret-space-tooltip")
  end

  step :when_clicking_on_projects_tab, ctx do
    ctx
    |> UI.visit(Paths.space_path(ctx.company, ctx.marketing))
    |> UI.click(testid: "goals-and-projects")
  end

  step :assert_projects_are_listed, ctx, names do
    Enum.reduce(names, ctx, fn name, ctx ->
      ctx |> UI.assert_text(name)
    end)
  end

  step :assert_space_creationg_visible_in_activity_feed, ctx, attrs do
    space = Operately.Groups.get_group_by_name(attrs.name)

    ctx
    |> UI.visit(Paths.space_path(ctx.company, space))
    |> UI.assert_feed_item(ctx.creator, "created this space")
    |> UI.visit(Paths.feed_path(ctx.company))
    |> UI.assert_feed_item(ctx.creator, "created the #{attrs.name} space")
  end

  step :assert_privacy_indicator_is_visible, ctx do
    ctx |> UI.assert_has(testid: "secret-space-tooltip")
  end

  step :promote_to_manager, ctx, member do
    ctx
    |> UI.click(testid: UI.testid(["member", "menu", member.full_name]))
    |> UI.click(testid: "promote-to-manager")
  end

  step :demote_to_member, ctx, member do
    ctx
    |> UI.click(testid: UI.testid(["member", "menu", member.full_name]))
    |> UI.click(testid: "demote-to-member")
  end

  step :assert_member_promoted, ctx, member do
    ctx
    |> UI.find(UI.query(testid: "space-managers-section"), fn ctx ->
      ctx |> UI.assert_text(member.full_name)
    end)
  end

  step :assert_member_demoted, ctx, member do
    ctx
    |> UI.find(UI.query(testid: "members-section"), fn ctx ->
      ctx |> UI.assert_text(member.full_name)
    end)
  end

  step :change_access_level, ctx, %{member: member, access_level: access_level} do
    ctx
    |> UI.click(testid: UI.testid(["member", "menu", member.full_name]))
    |> UI.click(testid: "change-access-level")
    |> UI.click(testid: "#{access_level}-access")
  end

  step :assert_access_level_changed, ctx, access_level do
    ctx |> UI.assert_has(testid: "#{access_level}-access-badge")
  end

  step :assert_space_appearance_changed, ctx, values do
    space = Operately.Groups.get_group_by_name(ctx.marketing.name)

    assert space.color == values.color
    assert space.icon == values.icon
  end

  step :given_that_i_am_on_the_space_page, ctx do
    ctx
    |> UI.visit(Paths.space_path(ctx.company, ctx.marketing))
    |> UI.assert_has(testid: "space-page")
  end

  step :click_edit_space, ctx do
    ctx |> UI.click(testid: "edit-space")
  end

  step :change_space_name_and_purpose, ctx do
    ctx
    |> UI.fill(testid: "name", with: "Marketing 2")
    |> UI.fill(testid: "purpose", with: "Let the world know about our products 2")
    |> UI.click(testid: "submit")
    |> UI.assert_has(testid: "space-page")
  end

  step :assert_space_name_and_purpose_changed, ctx do
    ctx
    |> UI.assert_text("Marketing 2")
    |> UI.assert_text("Let the world know about our products 2")
  end

  step :given_a_completed_project_exists, ctx do
    ctx
    |> Factory.add_project(:project_a, :marketing)
    |> then(fn ctx ->
      ctx.project_a
      |> Operately.Projects.Project.changeset(%{status: "closed", closed_at: DateTime.utc_now()})
      |> Repo.update()

      ctx
    end)
  end

  step :given_a_completed_goal_exists, ctx do
    ctx
    |> Factory.add_goal(:goal_a, :marketing)
    |> then(fn ctx ->
      ctx.goal_a
      |> Operately.Goals.Goal.changeset(%{closed_at: DateTime.utc_now()})
      |> Repo.update()

      ctx
    end)
  end

  step :assert_all_goals_and_projects_are_completed_message, ctx do
    ctx |> UI.assert_text("All done!")
    ctx |> UI.assert_text("1 goal and 1 project completed this quarter")
  end

  step :given_active_and_closed_projects_exist, ctx do
    ctx
    |> Factory.add_project(:active_project, :marketing, name: "Active Project")
    |> Factory.add_project(:closed_project, :marketing, name: "Closed Project")
    |> then(fn ctx ->
      # Close one project using the proper operation that sets closed_at
      {:ok, _} =
        Operately.Operations.ProjectClosed.run(ctx.creator, ctx.closed_project, %{
          content: RichText.rich_text("Project closed for testing"),
          success_status: :achieved,
          subscription_parent_type: :comment_thread,
          send_to_everyone: false,
          subscriber_ids: []
        })

      ctx
    end)
  end

  step :assert_closed_projects_not_shown_in_goals_and_projects, ctx do
    # Closed projects should not appear in the Goals & Projects section
    ctx
    |> UI.click(testid: "goals-and-projects")
    |> UI.refute_text("Closed Project")
  end

  step :assert_active_projects_shown_in_goals_and_projects, ctx do
    # Active projects should still appear in the Goals & Projects section
    ctx
    |> UI.assert_text("Active Project")
  end

  step :given_a_space_with_active_and_paused_projects, ctx do
    ctx
    |> Factory.add_space(:marketing, name: "Test Space", mission: "Test space for paused projects")
    |> Factory.add_project(:active_project1, :marketing, name: "Active Project 1")
    |> Factory.add_project(:active_project2, :marketing, name: "Active Project 2")
    |> Factory.add_project(:paused_project1, :marketing, name: "Paused Project 1")
    |> Factory.add_project(:paused_project2, :marketing, name: "Paused Project 2")
    |> Factory.pause_project(:paused_project1)
    |> Factory.pause_project(:paused_project2)
  end

  step :assert_goals_and_projects_box_shows_correct_counts, ctx do
    # Should show "0/4 projects on track" (0 with check-ins out of 4 total)
    # because active projects without check-ins are pending, not on track
    ctx |> UI.assert_text("0/4 projects on track")
  end

  step :assert_paused_projects_are_listed, ctx do
    # Both paused and active projects should be visible in the list
    ctx
    |> UI.assert_text("Active Project 1")
    |> UI.assert_text("Active Project 2")
    |> UI.assert_text("Paused Project 1")
    |> UI.assert_text("Paused Project 2")
  end

  step :given_a_space_with_pending_projects_and_goals, ctx do
    ctx
    |> Factory.add_space(:marketing, name: "Test Space", mission: "Test space for pending projects")
    |> Factory.add_project(:pending_project1, :marketing, name: "Pending Project 1")
    |> Factory.add_project(:pending_project2, :marketing, name: "Pending Project 2")
    |> Factory.add_project(:on_track_project, :marketing, name: "On Track Project")
    |> Factory.add_goal(:pending_goal1, :marketing, name: "Pending Goal 1")
    |> Factory.add_goal(:pending_goal2, :marketing, name: "Pending Goal 2")
    |> Factory.add_goal(:on_track_goal, :marketing, name: "On Track Goal")
    # Add check-ins to make some projects/goals "on track"
    |> Factory.add_project_check_in(:on_track_check_in_project, :on_track_project, :creator, status: "on_track")
    |> Factory.add_goal_update(:on_track_update_goal, :on_track_goal, :creator, status: "on_track")
  end

  step :assert_pending_projects_and_goals_counted_correctly, ctx do
    # Should show "1/3 projects on track" (1 with check-in out of 3 total)
    # and "1/3 goals on track" (1 with update out of 3 total)
    ctx
    |> UI.assert_text("1/3 projects on track")
    |> UI.assert_text("1/3 goals on track")
  end

  step :given_space_has_subresources, ctx do
    ctx
    |> Factory.add_goal(:goal_to_delete, :marketing, name: "Goal slated for deletion")
    |> Factory.add_project(:project_to_delete, :marketing, name: "Project slated for deletion")
    |> Factory.add_messages_board(:board_to_delete, :marketing, name: "Updates Board")
    |> Factory.add_message(:message_to_delete, :board_to_delete, title: "Weekly update")
    |> Factory.add_resource_hub(:hub_to_delete, :marketing, :creator, name: "Team Resources")
    |> Factory.add_document(:document_to_delete, :hub_to_delete, name: "Runbook")
  end

  step :request_space_deletion, ctx do
    ctx
    |> UI.click(testid: "options-button")
    |> UI.click(testid: "delete-space")
  end

  step :assert_space_delete_modal_visible, ctx do
    ctx
    |> UI.assert_has(testid: "confirm-delete-space")
  end

  step :assert_space_still_exists, ctx do
    assert Operately.Repo.get(Operately.Groups.Group, ctx.marketing.id)

    ctx |> UI.assert_has(testid: "space-page")
  end

  step :confirm_space_deletion, ctx do
    ctx |> UI.click(testid: "confirm-delete-space")
  end

  step :assert_space_deleted, ctx do
    ctx =
      attempts(ctx, 5, fn ->
        assert Operately.Repo.get(Operately.Groups.Group, ctx.marketing.id) == nil
      end)

    ctx
    |> UI.assert_has(testid: "company-home")
    |> UI.assert_text("Space deleted")
    |> UI.assert_text("The space and its content were deleted.")
  end
end

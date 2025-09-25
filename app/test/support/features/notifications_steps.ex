defmodule Operately.Support.Features.NotificationsSteps do
  use Operately.FeatureCase

  alias Operately.Support.Features.UI
  alias OperatelyWeb.Paths
  alias Operately.Access.Binding

  step :given_a_project_creation_notification_exists, ctx do
    project_attrs = %Operately.Operations.ProjectCreation{
      name: "my project",
      champion_id: ctx.champion.id,
      reviewer_id: ctx.reviewer.id,
      creator_is_contributor: "yes",
      creator_role: "developer",
      visibility: "everyone",
      creator_id: ctx.reviewer.id,
      company_id: ctx.company.id,
      group_id: ctx.group.id,
      anonymous_access_level: Binding.view_access(),
      company_access_level: Binding.comment_access(),
      space_access_level: Binding.edit_access()
    }

    {:ok, _} = Operately.Operations.ProjectCreation.run(project_attrs)

    ctx
  end

  def visit_notifications_page(ctx) do
    UI.visit(ctx, Paths.notifications_path(ctx.company))
  end

  def click_on_notification(ctx, testid) do
    UI.click(ctx, testid: testid)
  end

  def click_on_first_mark_all_as_read(ctx) do
    UI.click(ctx, testid: "mark-all-read")
  end

  def assert_notification_exists(ctx, author: author, subject: subject) do
    author = find_person(author)

    ctx
    |> UI.sleep(100)
    |> visit_notifications_page()
    |> UI.assert_text(author.full_name)
    |> UI.assert_text(subject)
  end

  def assert_notification_count(ctx, count) do
    bell = UI.query(testid: "notifications-bell")

    ctx
    |> UI.assert_has(testid: "unread-notifications-count")
    |> UI.find(bell, fn el -> UI.assert_text(el, "#{count}") end)
  end

  def assert_no_unread_notifications(ctx) do
    # give the notification count time to update
    :timer.sleep(500)
    UI.refute_has(ctx, testid: "unread-notifications-count")
  end

  def assert_discussion_posted(ctx, author: author, title: title) do
    ctx |> assert_notification_exists(author: author, subject: "Posted: #{title}")
  end

  def assert_activity_notification(ctx, %{author: author, action: action}) do
    author = find_person(author)
    ctx |> assert_notification_exists(author: author, subject: action)
  end

  def assert_project_moved_sent(ctx, author: author, old_space: old_space, new_space: new_space) do
    ctx |> assert_notification_exists(author: author, subject: "Moved the project from #{old_space.name} to #{new_space.name}")
  end

  def assert_project_retrospective_sent(ctx, author: author) do
    ctx |> assert_notification_exists(author: author, subject: "Closed this project and submitted a retrospective")
  end

  def assert_project_review_request_notification(ctx, author: author) do
    ctx |> assert_notification_exists(author: author, subject: "Requested a review")
  end

  def assert_project_review_acknowledged_sent(ctx, author: author) do
    ctx |> assert_notification_exists(author: author, subject: "Acknowledged your review")
  end

  def assert_project_review_commented_sent(ctx, author: author) do
    ctx |> assert_notification_exists(author: author, subject: "Re: project review")
  end

  def assert_project_check_in_submitted_sent(ctx, author: author) do
    ctx |> assert_notification_exists(author: author, subject: "Submitted a check-in")
  end

  def assert_project_paused_sent(ctx, author: author) do
    ctx |> assert_notification_exists(author: author, subject: "Paused the project")
  end

  def assert_goal_created_sent(ctx, author: author, role: role) do
    ctx |> assert_notification_exists(author: author, subject: "Added a new goal and assigned you as the #{role}")
  end

  def assert_project_archived_sent(ctx, author: author, project: project) do
    ctx |> assert_notification_exists(author: author, subject: "Archived the #{project.name} project")
  end

  def assert_goal_archived_sent(ctx, author: author, goal: project) do
    ctx |> assert_notification_exists(author: author, subject: "Archived the #{project.name} goal")
  end

  def assert_project_update_acknowledged_sent(ctx, author: author) do
    ctx |> assert_notification_exists(author: author, subject: "Acknowledged check-in")
  end

  def assert_project_update_submitted_sent(ctx, author: author, title: title) do
    ctx |> assert_notification_exists(author: author, subject: "Posted: #{title}")
  end

  def assert_project_update_commented_sent(ctx, author: author) do
    ctx |> assert_notification_exists(author: author, subject: "Re: project check-in")
  end

  def assert_discussion_commented_sent(ctx, author: author, title: title) do
    ctx |> assert_notification_exists(author: author, subject: "Re: #{title}")
  end

  def assert_project_timeline_edited_sent(ctx, author: author) do
    ctx |> assert_notification_exists(author: author, subject: "Changed the project timeline")
  end

  def assert_milestone_comment_sent(ctx, author: author, title: title) do
    ctx |> assert_notification_exists(author: author, subject: "Re: #{title}")
  end

  def assert_milestone_completed_sent(ctx, author: author, title: title) do
    ctx |> assert_notification_exists(author: author, subject: "Completed: #{title}")
  end

  def assert_milestone_reopened_sent(ctx, author: author, title: title) do
    ctx |> assert_notification_exists(author: author, subject: "Re-opened: #{title}")
  end

  def assert_space_members_added_sent(ctx, author: author, title: title) do
    ctx |> assert_notification_exists(author: author, subject: "Added you to the #{title} space")
  end

  defp find_person(person) do
    case person do
      %Operately.People.Person{} -> person
      %Operately.Projects.Contributor{} -> Operately.People.get_person(person.person_id)
      _ -> raise "Invalid person: #{inspect(person)}"
    end
  end
end

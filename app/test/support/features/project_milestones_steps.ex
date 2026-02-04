defmodule Operately.Support.Features.ProjectMilestonesSteps do
  use Operately.FeatureCase

  import Ecto.Query, only: [from: 2]

  alias Operately.Support.Features.{EmailSteps, NotificationsSteps, FeedSteps}
  alias Operately.ContextualDates.ContextualDate
  alias Operately.Access.Binding
  alias OperatelyWeb.Paths
  alias Wallaby.QueryError

  step :given_that_a_milestone_exists, ctx, title do
    milestone =
      Operately.ProjectsFixtures.milestone_fixture(%{
        project_id: ctx.project.id,
        title: title,
        timeframe: %{
          contextual_start_date: ContextualDate.create_day_date(Date.utc_today()),
          contextual_end_date: ContextualDate.create_day_date(~D[2023-06-17])
        }
      })

    Map.put(ctx, :milestone, milestone)
  end

  step :given_that_milestone_is_completed, ctx do
    {:ok, milestone} =
      Operately.Projects.update_milestone(ctx.milestone, %{
        status: :done
      })

    Map.put(ctx, :milestone, milestone)
  end

  step :given_that_milestone_has_comment, ctx do
    ctx
    |> Map.put(:creator, ctx.commenter.person)
    |> Factory.add_comment(:comment, :milestone)
  end

  step :given_milestone_with_comments_exists, ctx do
    ctx
    |> Map.put(:creator, ctx.champion)
    |> Factory.add_project_milestone(:milestone_with_comments, :project)
    |> Factory.preload(:milestone_with_comments, :project)
    |> Factory.add_comment(:comment1, :milestone_with_comments)
    |> Factory.add_comment(:comment2, :milestone_with_comments)
    |> Factory.add_comment(:comment3, :milestone_with_comments)
  end

  step :given_milestone_without_comments_exists, ctx do
    ctx
    |> Factory.add_project_milestone(:milestone_without_comments, :project)
  end

  step :given_that_milestone_project_doesnt_have_champion, ctx do
    from(c in Operately.Projects.Contributor,
      where: c.project_id == ^ctx.project.id,
      where: c.role == :champion,
      limit: 1
    )
    |> Operately.Repo.one!()
    |> Operately.Projects.delete_contributor()

    ctx
  end

  step :given_space_member_exists, ctx, opts \\ [] do
    ctx
    |> Factory.add_space_member(:space_member, :group, opts)
  end

  step :visit_milestone_page, ctx do
    path = Paths.project_milestone_path(ctx.company, ctx.milestone)
    UI.visit(ctx, path)
  end

  step :visit_project_page, ctx do
    UI.visit(ctx, Paths.project_path(ctx.company, ctx.project))
  end

  step :visit_tasks_tab_on_project_page, ctx do
    UI.visit(ctx, Paths.project_path(ctx.company, ctx.project, tab: "tasks"))
  end

  step :log_in_as_champion, ctx do
    Factory.log_in_person(ctx, :champion)
  end

  step :log_in_as_contributor, ctx do
    Factory.log_in_contributor(ctx, :contributor)
  end

  step :log_in_as_commenter, ctx do
    Factory.log_in_contributor(ctx, :commenter)
  end

  step :log_in_as_viewer, ctx do
    Factory.log_in_contributor(ctx, :viewer)
  end

  step :assert_contributor_has_edit_access, ctx do
    {:ok, project} = Operately.Projects.Project.get(ctx.contributor.person, id: ctx.project.id)

    assert project.request_info.access_level == Binding.edit_access()

    ctx
  end

  step :assert_commenter_has_comment_access, ctx do
    {:ok, project} = Operately.Projects.Project.get(ctx.commenter.person, id: ctx.project.id)

    assert project.request_info.access_level == Binding.comment_access()

    ctx
  end

  step :assert_viewer_has_view_access, ctx do
    {:ok, project} = Operately.Projects.Project.get(ctx.viewer.person, id: ctx.project.id)

    assert project.request_info.access_level == Binding.view_access()

    ctx
  end

  step :assert_tasks_list_view, ctx do
    ctx
    |> UI.assert_has(testid: "tasks-board")
    |> UI.refute_has(testid: "kanban-board")
  end

  step :assert_tasks_board_view, ctx do
    ctx
    |> UI.assert_has(testid: "kanban-board")
    |> UI.refute_has(testid: "tasks-board")
  end

  step :click_view_on_board_link, ctx do
    UI.click(ctx, css: "[data-test-id=\"tasks-section\"] a[href*=\"taskDisplay=board\"]")
  end

  step :assert_redirected_to_project_tasks_tab, ctx do
    UI.assert_page(ctx, Paths.project_path(ctx.company, ctx.project))
  end

  step :assert_milestone_selected, ctx do
    ctx
    |> UI.assert_text(ctx.milestone.title, testid: "current-milestone")
    |> UI.refute_text("All milestones", testid: "current-milestone")
  end

  step :reload_project_page, ctx do
    UI.visit(ctx, Paths.project_path(ctx.company, ctx.project))
  end

  step :reload_milestone_page, ctx do
    UI.visit(ctx, Paths.project_milestone_path(ctx.company, ctx.milestone))
  end

  step :assert_milestone_navigation_without_space, ctx do
    home_link = Paths.home_path(ctx.company)
    space_link = Paths.space_path(ctx.company, ctx.group)
    workmap_link = Paths.space_work_map_path(ctx.company, ctx.group) <> "?tab=projects"

    ctx
    |> UI.assert_has(css: "[data-test-id=\"milestone-page\"] nav a[href=\"#{home_link}\"]")
    |> UI.refute_has(css: "[data-test-id=\"milestone-page\"] nav a[href=\"#{space_link}\"]")
    |> UI.refute_has(css: "[data-test-id=\"milestone-page\"] nav a[href=\"#{workmap_link}\"]")
  end

  step :navigate_to_milestone, ctx, name: name do
    ctx
    |> UI.find(UI.query(testid: "tasks-board"), fn el ->
      UI.click_text(el, name)
    end)
  end

  step :navigate_to_tasks_board, ctx do
    UI.click(ctx, testid: "tab-tasks")
  end

  step :add_first_milestone, ctx, name: name do
    ctx
    |> UI.click_button("Add your first milestone")
    |> UI.fill(testid: "milestone-name-input", with: name)
    |> UI.find(UI.query(testid: "add-milestone-form"), fn el ->
      UI.click_button(el, "Add milestone")
    end)
  end

  step :add_milestone, ctx, name: name do
    ctx
    |> UI.click_button("Add milestone")
    |> UI.fill(testid: "milestone-name-input", with: name)
    |> UI.find(UI.query(testid: "add-milestone-form"), fn el ->
      UI.click_button(el, "Add milestone")
    end)
  end

  step :add_milestone, ctx, name: name, due_date: due_date do
    ctx
    |> UI.click_button("Add milestone")
    |> UI.fill(testid: "milestone-name-input", with: name)
    |> UI.select_day_in_date_field(testid: "new-milestone-due-date", date: due_date)
    |> UI.find(UI.query(testid: "add-milestone-form"), fn el ->
      UI.click_button(el, "Add milestone")
    end)
  end

  step :add_multiple_milestones, ctx, names: names do
    ctx
    |> UI.click_button("Add milestone")
    |> UI.click(testid: "add-more-switch")
    |> UI.find(UI.query(testid: "add-milestone-form"), fn el ->
      Enum.reduce(names, el, fn name, el ->
        el
        |> UI.fill(testid: "milestone-name-input", with: name)
        |> UI.click_button("Add milestone")
      end)
    end)
    |> UI.click_button("Cancel")
  end

  step :edit_milestone, ctx, name: name, new_name: new_name, new_due_date: due_date do
    ctx
    |> UI.find(UI.query(testid: "timeline-section"), fn el ->
      el
      |> UI.hover(testid: UI.testid(["milestone", name]))
      |> UI.click_button("Edit")
    end)
    |> UI.fill(testid: UI.testid(["edit-title", name]), with: new_name)
    |> UI.select_day_in_date_field(testid: UI.testid(["edit-due-date", name]), date: due_date)
    |> UI.click_button("Save")
    |> UI.refute_has(testid: UI.testid(["edit-form", name]))
  end

  step :edit_milestone_due_date, ctx, due_date do
    ctx
    |> UI.select_day_in_date_field(testid: "milestone-due-date", date: due_date)
    |> UI.sleep(300)
  end

  step :remove_milestone_due_date, ctx do
    UI.clear_date_in_date_field(ctx, testid: "milestone-due-date")
  end

  step :edit_milestone_description, ctx, description do
    ctx
    |> open_milestone_description_editor()
    |> UI.fill_rich_text(description)
    |> submit_milestone_description()
  end

  step :edit_milestone_description_mentioning, ctx, person do
    ctx
    |> open_milestone_description_editor()
    |> UI.mention_person_in_rich_text(person)
    |> submit_milestone_description()
  end

  step :mark_milestone_as_completed, ctx do
    ctx
    |> UI.find(UI.query(testid: "sidebar-status"), fn el ->
      UI.click_button(el, "Mark complete")
    end)
    |> UI.sleep(300)
  end

  step :reopen_milestone, ctx do
    ctx
    |> UI.find(UI.query(testid: "sidebar-status"), fn el ->
      UI.click_button(el, "Reopen")
    end)
    |> UI.sleep(300)
  end

  step :add_task, ctx, name: name do
    ctx
    |> UI.click(testid: "tasks-section-add-task")
    |> UI.fill(placeholder: "Add a task...", with: name)
    |> UI.press_enter()
    |> UI.click_button("Cancel")
  end

  step :add_multiple_tasks, ctx, names: names do
    ctx = UI.click(ctx, testid: "tasks-section-add-task")

    Enum.reduce(names, ctx, fn name, ctx ->
      ctx
      |> UI.fill(placeholder: "Add a task...", with: name)
      |> UI.press_enter()
    end)
    |> UI.click_button("Cancel")
  end

  step :post_comment, ctx, comment do
    ctx
    |> UI.find(UI.query(testid: "timeline-section"), fn el ->
      el
      |> UI.click_text("Write a comment here...")
      |> UI.fill_rich_text(comment)
      |> UI.click_button("Post")
    end)
    |> UI.refute_has(testid: "new-comment-form")
    |> UI.sleep(300)
  end

  step :post_comment_with_mention, ctx, person do
    ctx
    |> UI.find(UI.query(testid: "timeline-section"), fn el ->
      el
      |> UI.click_text("Write a comment here...")
      |> UI.mention_person_in_rich_text(person)
      |> UI.click_button("Post")
    end)
    |> UI.refute_has(testid: "new-comment-form")
    |> UI.sleep(300)
  end

  step :edit_comment, ctx, comment do
    id =
      Repo.preload(ctx.comment, :comment).comment
      |> OperatelyWeb.Paths.comment_id()

    ctx
    |> UI.click(testid: UI.testid(["comment-menu", id]))
    |> UI.click(testid: UI.testid(["edit", id]))
    |> UI.fill_rich_text(comment)
    |> UI.click_button("Save")
    |> UI.refute_has(testid: "edit-comment-form")
    |> UI.sleep(300)
  end

  step :delete_comment, ctx do
    id = get_comment_id(ctx)

    ctx
    |> UI.click(testid: UI.testid(["comment-menu", id]))
    |> UI.click(testid: UI.testid(["delete", id]))
    |> UI.sleep(300)
  end

  step :delete_comment_by_content, ctx do
    comment = hd(Operately.Updates.list_comments(ctx.milestone.id, :project_milestone))
    id = OperatelyWeb.Paths.comment_id(comment)

    ctx
    |> Map.put(:comment, comment)
    |> UI.click(testid: UI.testid(["comment-menu", id]))
    |> UI.click(testid: UI.testid(["delete", id]))
    |> UI.sleep(300)
  end

  step :delete_milestone, ctx do
    ctx
    |> UI.find(UI.query(testid: "sidebar"), fn el ->
      UI.click_button(el, "Delete")
    end)
    |> UI.assert_text("This action cannot be undone")
    |> UI.click_button("Delete Forever")
    |> UI.sleep(300)
  end

  #
  # Assertions
  #

  step :assert_redirected_to_project_page, ctx do
    UI.assert_page(ctx, Paths.project_path(ctx.company, ctx.project))
  end

  step :assert_milestone_deleted, ctx do
    ctx
    |> UI.visit(Paths.project_path(ctx.company, ctx.project, tab: "overview"))
    |> UI.assert_text("No milestones yet")
    |> UI.assert_text("Add milestones to track key deliverables and deadlines")
  end

  step :assert_comment, ctx, comment do
    ctx
    |> UI.find(UI.query(testid: "timeline-section"), fn el ->
      UI.assert_text(el, comment)
    end)
  end

  step :assert_project_milestones_zero_state, ctx do
    ctx
    |> UI.assert_text("No milestones yet")
    |> UI.assert_text("Add milestones to track key deliverables and deadlines")
  end

  step :assert_add_milestone_form_closed, ctx do
    UI.refute_has(ctx, testid: "add-milestone-form")
  end

  step :assert_milestone_created, ctx, name: name do
    ctx
    |> UI.find(UI.query(testid: "timeline-section"), fn el ->
      UI.assert_text(el, name)
    end)
  end

  step :assert_milestone_created, ctx, name: name, due_date: due_date do
    ctx
    |> UI.find(UI.query(testid: "timeline-section"), fn el ->
      UI.assert_text(el, name)
      UI.assert_text(el, due_date)
    end)
  end

  step :assert_milestone_visible_in_tasks_board, ctx, name: name do
    ctx
    |> UI.find(UI.query(testid: "tasks-board"), fn el ->
      UI.assert_text(el, name)
    end)
  end

  step :refute_milestone_visible_in_tasks_board, ctx, name: name do
    UI.refute_text(ctx, name)
  end

  step :assert_milestone_updated, ctx, name: name, due_date: due_date do
    ctx
    |> UI.find(UI.query(testid: "timeline-section"), fn el ->
      UI.assert_text(el, name)
      UI.assert_text(el, due_date)
    end)
  end

  step :assert_milestone_status, ctx, status do
    ctx
    |> UI.find(UI.query(testid: "milestone-header"), fn el ->
      UI.assert_text(el, status)
    end)
  end

  step :assert_empty_description, ctx do
    ctx
    |> UI.find(UI.query(testid: "description-section-empty"), fn el ->
      UI.assert_text(el, "Add details about this milestone...")
    end)
  end

  step :assert_milestone_timeline_empty, ctx do
    ctx
    |> UI.find(UI.query(testid: "timeline-section"), fn el ->
      el
      |> UI.assert_text("No activity yet")
      |> UI.assert_text("Comments and task updates will appear here")
    end)
  end

  step :assert_milestone_due_date, ctx, formatted_date do
    ctx
    |> UI.find(UI.query(testid: "sidebar"), fn el ->
      UI.assert_text(el, formatted_date)
    end)
  end

  step :assert_no_due_date, ctx do
    ctx
    |> UI.find(UI.query(testid: "sidebar"), fn el ->
      UI.assert_text(el, "Set due date")
    end)
  end

  step :assert_task_created, ctx, name: name do
    ctx
    |> UI.find(UI.query(testid: "tasks-section"), fn el ->
      UI.assert_text(el, name)
    end)
  end

  step :assert_add_task_form_closed, ctx do
    ctx
    |> UI.refute_has(testid: "inline-task-creator-milestonepage")
    |> UI.refute_has(testid: "inline-task-creator-milestonepage-empty")
  end

  step :assert_comment_deleted, ctx do
    id = get_comment_id(ctx)

    ctx
    |> UI.refute_has(testid: UI.testid(["comment-menu", id]))
  end

  step :assert_comment_edit_delete_not_visible, ctx do
    id = get_comment_id(ctx)

    ctx
    |> UI.click(testid: UI.testid(["comment-menu", id]))
    |> UI.assert_has(testid: UI.testid(["copy-link", id]))
    |> UI.refute_has(testid: UI.testid(["edit", id]))
    |> UI.refute_has(testid: UI.testid(["delete", id]))
  end

  step :copy_comment_link, ctx do
    id = get_comment_id(ctx)

    ctx
    |> UI.click(testid: UI.testid(["comment-menu", id]))
    |> UI.click(testid: UI.testid(["copy-link", id]))
    |> UI.sleep(100)
  end

  step :assert_comment_link_copied_message, ctx do
    ctx
    |> UI.assert_text("Success")
    |> UI.assert_text("The comment link has been copied to your clipboard")
  end

  step :assert_activity_added_to_feed, ctx, description do
    UI.find(ctx, UI.query(testid: "timeline-section"), fn el ->
      UI.assert_text(el, description)
    end)
  end

  #
  # Feed
  #

  step :assert_milestone_due_date_change_visible_in_feed, ctx do
    short =
      "#{Operately.People.Person.first_name(ctx.champion)} updated the due date for the #{ctx.milestone.title} milestone"

    long =
      "#{Operately.People.Person.first_name(ctx.champion)} updated the due date for the #{ctx.milestone.title} milestone in #{ctx.project.name}"

    ctx
    |> UI.visit(Paths.project_path(ctx.company, ctx.project, tab: "activity"))
    |> UI.find(UI.query(testid: "project-feed"), fn el ->
      UI.assert_text(el, short)
    end)
    |> UI.visit(Paths.space_path(ctx.company, ctx.group))
    |> UI.find(UI.query(testid: "space-feed"), fn el ->
      UI.assert_text(el, long)
    end)
    |> UI.visit(Paths.feed_path(ctx.company))
    |> UI.find(UI.query(testid: "company-feed"), fn el ->
      UI.assert_text(el, long)
    end)
  end

  step :assert_comment_visible_in_feed, ctx, comment do
    ctx
    |> UI.visit(Paths.project_path(ctx.company, ctx.project, tab: "activity"))
    |> UI.find(UI.query(testid: "project-feed"), fn el ->
      el
      |> FeedSteps.assert_project_milestone_commented(
        author: ctx.champion,
        milestone_tile: ctx.milestone.title,
        comment: comment
      )
    end)
    |> UI.visit(Paths.space_path(ctx.company, ctx.group))
    |> UI.find(UI.query(testid: "space-feed"), fn el ->
      el
      |> FeedSteps.assert_project_milestone_commented(
        author: ctx.champion,
        milestone_tile: ctx.milestone.title,
        comment: comment
      )
    end)
    |> UI.visit(Paths.feed_path(ctx.company))
    |> UI.find(UI.query(testid: "company-feed"), fn el ->
      el
      |> FeedSteps.assert_project_milestone_commented(
        author: ctx.champion,
        milestone_tile: ctx.milestone.title,
        comment: comment
      )
    end)
  end

  step :assert_comment_visible_in_feed_after_deletion, ctx, comment do
    ctx
    |> UI.visit(Paths.project_path(ctx.company, ctx.project, tab: "activity"))
    |> UI.find(UI.query(testid: "project-feed"), fn el ->
      el
      |> FeedSteps.assert_project_milestone_commented(
        author: ctx.champion,
        milestone_tile: "a milestone",
        comment: comment
      )
    end)
    |> UI.visit(Paths.space_path(ctx.company, ctx.group))
    |> UI.find(UI.query(testid: "space-feed"), fn el ->
      el
      |> FeedSteps.assert_project_milestone_commented(
        author: ctx.champion,
        milestone_tile: "a milestone",
        comment: comment
      )
    end)
    |> UI.visit(Paths.feed_path(ctx.company))
    |> UI.find(UI.query(testid: "company-feed"), fn el ->
      el
      |> FeedSteps.assert_project_milestone_commented(
        author: ctx.champion,
        milestone_tile: "a milestone",
        comment: comment
      )
    end)
  end

  step :assert_comment_visible_in_feed_after_deletion, ctx do
    ctx
    |> UI.visit(Paths.project_path(ctx.company, ctx.project, tab: "activity"))
    |> UI.find(UI.query(testid: "project-feed"), fn el ->
      el
      |> FeedSteps.assert_project_milestone_commented(
        author: ctx.champion,
        milestone_tile: ctx.milestone.title,
        comment: ""
      )
    end)
    |> UI.visit(Paths.space_path(ctx.company, ctx.group))
    |> UI.find(UI.query(testid: "space-feed"), fn el ->
      el
      |> FeedSteps.assert_project_milestone_commented(
        author: ctx.champion,
        milestone_tile: ctx.milestone.title,
        comment: ""
      )
    end)
    |> UI.visit(Paths.feed_path(ctx.company))
    |> UI.find(UI.query(testid: "company-feed"), fn el ->
      el
      |> FeedSteps.assert_project_milestone_commented(
        author: ctx.champion,
        milestone_tile: ctx.milestone.title,
        comment: ""
      )
    end)
  end

  step :assert_milestone_deleted_visible_in_feed, ctx do
    person = ctx.contributor.person
    short =
      "#{Operately.People.Person.first_name(person)} deleted the \"#{ctx.milestone.title}\" milestone"

    long =
      "#{Operately.People.Person.first_name(person)} deleted the \"#{ctx.milestone.title}\" milestone in #{ctx.project.name}"

    ctx
    |> UI.visit(Paths.project_path(ctx.company, ctx.project, tab: "activity"))
    |> UI.find(UI.query(testid: "project-feed"), fn el ->
      UI.assert_text(el, short)
    end)
    |> UI.visit(Paths.space_path(ctx.company, ctx.group))
    |> UI.find(UI.query(testid: "space-feed"), fn el ->
      UI.assert_text(el, long)
    end)
    |> UI.visit(Paths.feed_path(ctx.company))
    |> UI.find(UI.query(testid: "company-feed"), fn el ->
      UI.assert_text(el, long)
    end)
  end

  step :assert_milestone_creation_visible_in_feed, ctx do
    ctx
    |> UI.visit(Paths.project_path(ctx.company, ctx.project, tab: "activity"))
    |> UI.find(UI.query(testid: "project-feed"), fn el ->
      el
      |> FeedSteps.assert_project_milestone_created(
        author: ctx.reviewer,
        milestone_name: ctx.milestone.title
      )
    end)
    |> UI.visit(Paths.space_path(ctx.company, ctx.group))
    |> UI.find(UI.query(testid: "space-feed"), fn el ->
      el
      |> FeedSteps.assert_project_milestone_created(
        author: ctx.reviewer,
        milestone_name: ctx.milestone.title,
        project_name: ctx.project.name
      )
    end)
    |> UI.visit(Paths.feed_path(ctx.company))
    |> UI.find(UI.query(testid: "company-feed"), fn el ->
      el
      |> FeedSteps.assert_project_milestone_created(
        author: ctx.reviewer,
        milestone_name: ctx.milestone.title,
        project_name: ctx.project.name
      )
    end)
  end

  #
  # Emails
  #

  step :assert_due_date_changed_email_sent, ctx do
    ctx
    |> EmailSteps.assert_activity_email_sent(%{
      where: ctx.project.name,
      to: ctx.champion,
      author: ctx.reviewer,
      action: "changed the due date for \"#{ctx.milestone.title}\""
    })
  end

  step :assert_due_date_removed_email_sent, ctx do
    ctx
    |> EmailSteps.assert_activity_email_sent(%{
      where: ctx.project.name,
      to: ctx.champion,
      author: ctx.reviewer,
      action: "removed the due date for \"#{ctx.milestone.title}\""
    })
  end

  step :assert_space_member_milestone_description_email_sent, ctx do
    ctx
    |> EmailSteps.assert_activity_email_sent(%{
      where: ctx.project.name,
      to: ctx.space_member,
      author: ctx.champion,
      action: "updated the description for \"#{ctx.milestone.title}\""
    })
  end

  step :assert_comment_email_sent_to_project_reviewer, ctx do
    ctx
    |> EmailSteps.assert_activity_email_sent(%{
      where: ctx.project.name,
      to: ctx.reviewer,
      action: "commented on the #{ctx.milestone.title} milestone",
      author: ctx.commenter.person
    })
  end

  step :assert_comment_email_sent_to_space_member, ctx do
    ctx
    |> EmailSteps.assert_activity_email_sent(%{
      where: ctx.project.name,
      to: ctx.space_member,
      action: "commented on the #{ctx.milestone.title} milestone",
      author: ctx.commenter.person
    })
  end

  step :assert_milestone_creation_email_sent, ctx do
    ctx
    |> EmailSteps.assert_activity_email_sent(%{
      where: ctx.project.name,
      to: ctx.champion,
      author: ctx.reviewer,
      action: "created the \"#{ctx.milestone.title}\" milestone"
    })
  end

  #
  # Notifications
  #

  step :assert_due_date_changed_notification_sent, ctx do
    ctx
    |> UI.login_as(ctx.champion)
    |> NotificationsSteps.assert_activity_notification(%{
      author: ctx.reviewer,
      action: "The \"#{ctx.milestone.title}\" milestone due date was updated"
    })
  end

  step :assert_due_date_removed_notification_sent, ctx do
    ctx
    |> UI.login_as(ctx.champion)
    |> NotificationsSteps.assert_activity_notification(%{
      author: ctx.reviewer,
      action: "The \"#{ctx.milestone.title}\" milestone due date was removed"
    })
  end

  step :assert_space_member_milestone_description_notification_sent, ctx do
    ctx
    |> UI.login_as(ctx.space_member)
    |> NotificationsSteps.assert_activity_notification(%{
      author: ctx.champion,
      action: "Milestone \"#{ctx.milestone.title}\" description was updated"
    })
  end

  step :assert_comment_notification_sent_to_project_reviewer, ctx do
    ctx
    |> UI.login_as(ctx.reviewer)
    |> UI.visit(Paths.notifications_path(ctx.company))
    |> NotificationsSteps.assert_activity_notification(%{
      author: ctx.champion,
      action: "Re: #{ctx.milestone.title}"
    })
  end

  step :assert_comment_notification_sent_after_deletion, ctx do
    ctx
    |> UI.login_as(ctx.reviewer)
    |> UI.visit(Paths.notifications_path(ctx.company))
    |> NotificationsSteps.assert_activity_notification(%{
      author: ctx.champion,
      action: "Commented on a milestone"
    })
  end

  step :assert_comment_notification_sent_to_space_member, ctx do
    ctx
    |> UI.login_as(ctx.space_member)
    |> UI.visit(Paths.notifications_path(ctx.company))
    |> NotificationsSteps.assert_activity_notification(%{
      author: ctx.commenter.person,
      action: "Re: #{ctx.milestone.title}"
    })
  end

  step :assert_milestone_creation_notification_sent, ctx do
    ctx
    |> UI.login_as(ctx.champion)
    |> NotificationsSteps.assert_activity_notification(%{
      author: ctx.reviewer,
      action: "A new milestone \"#{ctx.milestone.title}\" was created"
    })
  end

  step :assert_milestone_description_indicator_visible, ctx do
    milestone_id = Paths.milestone_id(ctx.milestone)

    ctx
    |> UI.find(UI.query(testid: UI.testid(["milestone", milestone_id])), fn el ->
      UI.assert_has(el, testid: "description-indicator")
    end)
  end

  step :assert_milestone_description_indicator_not_visible, ctx do
    milestone_id = Paths.milestone_id(ctx.milestone)

    ctx
    |> UI.find(UI.query(testid: UI.testid(["milestone", milestone_id])), fn el ->
      UI.refute_has(el, testid: "description-indicator")
    end)
  end

  step :assert_milestone_comment_indicator_not_visible, ctx do
    milestone_id = Paths.milestone_id(ctx.milestone_without_comments)

    ctx
    |> UI.find(UI.query(testid: UI.testid(["milestone", milestone_id])), fn el ->
      UI.refute_has(el, testid: "comments-indicator")
    end)
  end

  step :assert_milestone_comment_count, ctx, expected_count do
    milestone_id = Paths.milestone_id(ctx.milestone_with_comments)

    ctx
    |> UI.find(UI.query(testid: UI.testid(["milestone", milestone_id])), fn el ->
      el
      |> UI.assert_has(testid: "comments-indicator")
      |> UI.assert_text(Integer.to_string(expected_count))
    end)
  end

  step :assert_milestone_description_indicator_visible_on_overview, ctx do
    test_id = UI.testid(["milestone", ctx.milestone.title])

    ctx
    |> UI.find(UI.query(testid: test_id), fn el ->
      UI.assert_has(el, testid: "description-indicator")
    end)
  end

  step :assert_milestone_description_indicator_not_visible_on_overview, ctx do
    test_id = UI.testid(["milestone", ctx.milestone.title])

    ctx
    |> UI.find(UI.query(testid: test_id), fn el ->
      UI.refute_has(el, testid: "description-indicator")
    end)
  end

  step :assert_milestone_comment_indicator_not_visible_on_overview, ctx do
    test_id = UI.testid(["milestone", ctx.milestone_without_comments.title])

    ctx
    |> UI.find(UI.query(testid: test_id), fn el ->
      UI.refute_has(el, testid: "comments-indicator")
    end)
  end

  step :assert_milestone_comment_count_on_overview, ctx, expected_count do
    test_id = UI.testid(["milestone", ctx.milestone_with_comments.title])

    ctx
    |> UI.find(UI.query(testid: test_id), fn el ->
      el
      |> UI.assert_has(testid: "comments-indicator")
      |> UI.assert_text(Integer.to_string(expected_count))
    end)
  end

  #
  # Helpers
  #

  defp open_milestone_description_editor(ctx) do
    try do
      ctx
      |> UI.find(UI.query(testid: "description-section-empty"), fn el ->
        el
        |> UI.click_text("Add details about this milestone...")
      end)
    rescue
      QueryError ->
        ctx
        |> UI.click_button("Edit")
    end
  end

  defp submit_milestone_description(ctx) do
    ctx
    |> UI.click_button("Save")
    |> UI.sleep(300)
  end

  defp get_comment_id(ctx) do
    if Map.has_key?(ctx.comment, :comment) do
      Repo.preload(ctx.comment, :comment).comment
    else
      ctx.comment
    end
    |> OperatelyWeb.Paths.comment_id()
  end
end

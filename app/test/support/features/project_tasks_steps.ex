defmodule Operately.Support.Features.ProjectTasksSteps do
  use Operately.FeatureCase

  alias Operately.Tasks.Task
  alias Operately.Projects
  alias Operately.Support.Features.EmailSteps
  alias Operately.Support.Features.NotificationsSteps

  step :given_task_exists, ctx do
    ctx
    |> Factory.add_space_member(:creator, :group)
    |> Factory.add_project_task(:task, :milestone, name: "My task")
  end

  step :given_space_member_exists, ctx, opts \\ [] do
    ctx
    |> Factory.add_space_member(:space_member, :group, opts)
  end

  step :given_task_assignee_exists, ctx do
    Factory.add_task_assignee(ctx, :assignee, :task, :champion)
  end

  step :given_another_milestone_exists, ctx do
    ctx
    |> Factory.add_project_milestone(:another_milestone, :project)
  end

  step :given_task_without_comments_exists, ctx do
    ctx
    |> Map.put(:creator, ctx.champion)
    |> Factory.add_project_task(:task_without_comments, :milestone)
  end

  step :given_task_with_comments_exists, ctx do
    ctx
    |> Map.put(:creator, ctx.champion)
    |> Factory.add_project_task(:task_with_comments, :milestone)
    |> Factory.preload(:task_with_comments, :project)
    |> Factory.add_comment(:comment1, :task_with_comments)
    |> Factory.add_comment(:comment2, :task_with_comments)
  end

  step :visit_project_page, ctx do
    ctx
    |> UI.visit(Paths.project_path(ctx.company, ctx.project))
  end

  step :visit_milestone_page, ctx do
    ctx
    |> UI.visit(Paths.project_milestone_path(ctx.company, ctx.milestone))
  end

  step :visit_task_page, ctx do
    ctx
    |> UI.visit(Paths.project_task_path(ctx.company, ctx.task))
  end

  step :reload_task_page, ctx do
    ctx
    |> UI.visit(Paths.project_task_path(ctx.company, ctx.task))
  end

  step :go_to_tasks_tab, ctx do
    ctx
    |> UI.click(testid: "tab-tasks")
  end

  step :go_to_task_page, ctx do
    ctx
    |> UI.click_link(ctx.task.name)
    |> UI.assert_page(Paths.project_task_path(ctx.company, ctx.task))
  end

  step :add_task_from_tasks_board, ctx, attrs do
    ctx
    |> UI.click_button("New task")
    |> UI.fill(placeholder: "Enter task title", with: attrs.name)
    |> if_present(attrs[:assignee], fn ctx ->
      ctx
      |> UI.click(testid: "assignee")
      |> UI.click(testid: UI.testid(["assignee-search-result", attrs.assignee]))
    end)
    |> if_present(attrs[:due_date], fn ctx ->
      ctx
      |> UI.select_day_in_date_field(testid: "task-due-date", date: attrs.due_date)
    end)
    |> if_present(attrs[:milestone], fn ctx ->
      ctx
      |> UI.click(testid: "milestone-field")
      |> UI.click(testid: UI.testid(["milestone-field-search-result", attrs.milestone]))
    end)
    |> UI.click_button("Create task")
    |> UI.sleep(300)
    |> UI.refute_has(testid: "add-task-form")
  end

  step :add_multiple_tasks, ctx, names: names do
    ctx
    |> UI.click_button("New task")
    |> UI.click(testid: "add-more-switch")
    |> UI.find(UI.query(testid: "add-task-form"), fn el ->
      Enum.reduce(names, el, fn name, el ->
        el
        |> UI.fill(placeholder: "Enter task title", with: name)
        |> UI.click_button("Create task")
      end)
    end)
    |> UI.click_button("Cancel")
    |> UI.sleep(300)
    |> UI.refute_has(testid: "add-task-form")
  end

  step :open_task_form_and_fill_out_all_fields, ctx, attrs do
    ctx
    |> UI.click_button("New task")
    |> UI.fill(placeholder: "Enter task title", with: attrs.name)
    |> if_present(attrs[:assignee], fn ctx ->
      ctx
      |> UI.click(testid: "assignee")
      |> UI.click(testid: UI.testid(["assignee-search-result", attrs.assignee]))
    end)
    |> if_present(attrs[:due_date], fn ctx ->
      ctx
      |> UI.select_day_in_date_field(testid: "task-due-date", date: attrs.due_date)
    end)
    |> if_present(attrs[:milestone], fn ctx ->
      ctx
      |> UI.click(testid: "milestone-field")
      |> UI.click(testid: UI.testid(["milestone-field-search-result", attrs.milestone]))
    end)
  end

  step :toggle_create_more_switch, ctx do
    UI.click(ctx, testid: "add-more-switch")
  end

  step :click_create_task_button, ctx do
    UI.click_button(ctx, "Create task")
  end

  step :add_task_from_milestone_page, ctx, title do
    ctx
    |> UI.click(testid: "tasks-section-add-task")
    |> UI.fill(placeholder: "Add a task...", with: title)
    |> UI.press_enter()
    |> UI.sleep(500)
  end

  step :edit_task_name, ctx, name do
    ctx
    |> UI.fill_text_field(testid: "task-name", with: name, submit: true)
    |> UI.sleep(300)
  end

  step :edit_task_description, ctx, description do
    ctx
    |> UI.click_text("Add notes about this task...")
    |> UI.fill_rich_text(description)
    |> UI.click_button("Save")
    |> UI.sleep(300)
  end

  step :edit_task_description_mentioning, ctx, person do
    ctx
    |> UI.click_text("Add notes about this task...")
    |> UI.mention_person_in_rich_text(person)
    |> UI.click_button("Save")
    |> UI.sleep(300)
  end

  step :edit_task_assignee, ctx, name do
    ctx
    |> UI.find(UI.query(testid: "task-sidebar"), fn el ->
      UI.click(el, testid: "assignee")
    end)
    |> UI.click(testid: UI.testid(["assignee-search-result", name]))
  end

  step :remove_task_assignee, ctx do
    ctx
    |> UI.find(UI.query(testid: "task-sidebar"), fn el ->
      UI.click(el, testid: "assignee")
    end)
    |> UI.click(testid: "assignee-clear-assignment")
  end

  step :edit_task_due_date, ctx, date do
    ctx
    |> UI.select_day_in_date_field(testid: "task-due-date", date: date)
  end

  step :remove_task_due_date, ctx do
    UI.clear_date_in_date_field(ctx, testid: "task-due-date")
  end

  step :edit_task_milestone, ctx, name do
    ctx
    |> UI.click(testid: "milestone-field")
    |> UI.click(testid: "milestone-field-change-milestone")
    |> UI.click(testid: UI.testid(["milestone-field-search-result", name]))
  end

  step :remove_task_milestone, ctx do
    ctx
    |> UI.click(testid: "milestone-field")
    |> UI.click(testid: "milestone-field-clear-milestone")
  end

  step :post_comment, ctx, comment do
    ctx
    |> UI.find(UI.query(testid: "task-activity-section"), fn el ->
      el
      |> UI.click_text("Write a comment here...")
      |> UI.fill_rich_text(comment)
      |> UI.click_button("Post")
    end)
    |> UI.sleep(300)
  end

  step :post_comment_mentioning, ctx, person do
    ctx
    |> UI.find(UI.query(testid: "task-activity-section"), fn el ->
      el
      |> UI.click_text("Write a comment here...")
      |> UI.mention_person_in_rich_text(person)
      |> UI.click_button("Post")
    end)
    |> UI.sleep(300)
  end

  step :login_as_champion, ctx do
    UI.login_as(ctx, ctx.champion)
  end

  step :delete_task, ctx do
    ctx
    |> UI.click(testid: "delete-task")
    |> UI.click_button("Delete Forever")
    |> UI.assert_page(Paths.project_path(ctx.company, ctx.project))
  end

  #
  # Assertions
  #

  step :assert_form_fields_are_empty, ctx do
    UI.find(ctx, UI.query(testid: "add-task-form"), fn el ->
      el
      |> UI.assert_text("", testid: "task-title")
      |> UI.assert_text("Set due date", testid: "task-due-date")
      |> UI.assert_text("Select assignee", testid: "assignee")
    end)
  end

  step :assert_person_is_not_project_contributor, ctx do
    ctx
    |> UI.refute_text(ctx.space_member.full_name)

    contributors = Projects.list_project_contributors(ctx.project)

    refute Enum.any?(contributors, fn contributor ->
             contributor.person_id == ctx.space_member.id
           end)

    ctx
  end

  step :assert_person_is_project_contributor, ctx do
    ctx
    |> UI.find(UI.query(testid: "overview-sidebar"), fn el ->
      UI.assert_text(el, ctx.space_member.full_name)
    end)

    contributor =
      ctx.project
      |> Projects.list_project_contributors()
      |> Enum.find(fn contributor -> contributor.person_id == ctx.space_member.id end)

    assert contributor.role == :contributor
    assert contributor.responsibility == "contributor"

    ctx
  end

  step :assert_task_added, ctx, title do
    UI.assert_text(ctx, title)

    task = Task.get!(:system, name: title)

    Map.put(ctx, :task, task)
  end

  step :assert_task_name, ctx, name do
    UI.assert_text(ctx, name, testid: "task-name")
  end

  step :refute_task_name, ctx, name do
    UI.refute_text(ctx, name)
  end

  step :assert_assignee, ctx, name do
    ctx
    |> UI.find(UI.query(testid: "task-sidebar"), fn el ->
      UI.assert_text(el, name, testid: "assignee")
    end)
  end

  step :assert_no_assignee, ctx do
    ctx
    |> UI.find(UI.query(testid: "task-sidebar"), fn el ->
      UI.assert_text(el, "Assign task", testid: "assignee")
    end)
  end

  step :assert_task_due_date, ctx, formatted_date do
    ctx
    |> UI.find(UI.query(testid: "task-sidebar"), fn el ->
      UI.assert_text(el, formatted_date)
    end)
  end

  step :assert_no_due_date, ctx do
    ctx
    |> UI.find(UI.query(testid: "task-sidebar"), fn el ->
      UI.assert_text(el, "Set due date")
    end)
  end

  step :assert_task_milestone, ctx, title do
    ctx
    |> UI.find(UI.query(testid: "task-sidebar"), fn el ->
      UI.assert_text(el, title)
    end)
  end

  step :assert_no_milestone, ctx do
    ctx
    |> UI.find(UI.query(testid: "task-sidebar"), fn el ->
      UI.assert_text(el, "Select milestone")
    end)
  end

  step :assert_task_description, ctx, description do
    UI.assert_text(ctx, description)
  end

  step :refute_task_description, ctx, description do
    UI.refute_text(ctx, description)
  end

  step :assert_task_not_in_list, ctx do
    ctx
    |> UI.click(testid: "tab-tasks")
    |> UI.refute_text(ctx.task.name)
  end

  step :assert_change_in_feed, ctx, title do
    ctx
    |> UI.find(UI.query(testid: "task-activity-section"), fn el ->
      el
      |> UI.assert_text(Operately.People.Person.short_name(ctx.champion))
      |> UI.assert_text(title)
    end)
  end

  step :assert_comment, ctx, comment do
    ctx
    |> UI.find(UI.query(testid: "task-activity-section"), fn el ->
      UI.assert_text(el, comment)
    end)
  end

  step :given_task_feed_references_a_deleted_milestone, ctx do
    # Create another milestone and attach the task to it to create an activity
    ctx = ctx |> Factory.add_project_milestone(:another_milestone, :project)

    # Create an activity that references the milestone by directly inserting the activity
    # This simulates the scenario where a task was moved to a milestone that later gets deleted
    activity_attrs = %{
      company_id: ctx.company.id,
      space_id: ctx.group.id,
      project_id: ctx.project.id,
      task_id: ctx.task.id,
      old_milestone_id: nil,
      new_milestone_id: ctx.another_milestone.id
    }

    {:ok, _activity} =
      Ecto.Multi.new()
      |> Operately.Activities.insert_sync(
        ctx.champion.id,
        :task_milestone_updating,
        fn _changes -> activity_attrs end
      )
      |> Operately.Repo.transaction()

    # Delete the milestone to simulate the scenario where activity references a deleted milestone
    Operately.Repo.delete!(ctx.another_milestone)

    ctx
  end

  step :assert_page_loads_without_errors, ctx do
    # Check that the page loads successfully without any errors
    # This could verify no error messages are displayed and key elements are present
    ctx
    |> UI.assert_has(testid: "task-name")
  end

  #
  # Feed
  #

  step :assert_task_due_date_change_visible_in_feed, ctx, date do
    short =
      "#{Operately.People.Person.first_name(ctx.champion)} changed the due date to #{date} on #{ctx.task.name}"

    long =
      "#{Operately.People.Person.first_name(ctx.champion)} changed the due date to #{date} on #{ctx.task.name} in #{ctx.project.name}"

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

  step :assert_task_assignee_change_visible_in_feed, ctx do
    short =
      "#{Operately.People.Person.first_name(ctx.reviewer)} assigned to #{ctx.champion.full_name} the task #{ctx.task.name}"

    long =
      "#{Operately.People.Person.first_name(ctx.reviewer)} assigned to #{ctx.champion.full_name} the task #{ctx.task.name} in #{ctx.project.name}"

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

  step :assert_task_comment_visible_in_feed, ctx, person: person, task_name: task_name do
    short = "#{Operately.People.Person.first_name(person)} commented on #{task_name}"

    long =
      "#{Operately.People.Person.first_name(person)} commented on #{task_name} in the #{ctx.project.name} project"

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

  #
  # Emails
  #

  step :assert_due_date_changed_email_sent, ctx do
    ctx
    |> EmailSteps.assert_activity_email_sent(%{
      where: ctx.project.name,
      to: ctx.champion,
      author: ctx.reviewer,
      action: "changed the due date for \"#{ctx.task.name}\""
    })
  end

  step :assert_due_date_removed_email_sent, ctx do
    ctx
    |> EmailSteps.assert_activity_email_sent(%{
      where: ctx.project.name,
      to: ctx.champion,
      author: ctx.reviewer,
      action: "removed the due date for \"#{ctx.task.name}\""
    })
  end

  step :assert_assignee_changed_email_sent, ctx do
    ctx
    |> EmailSteps.assert_activity_email_sent(%{
      where: ctx.project.name,
      to: ctx.champion,
      author: ctx.reviewer,
      action: "changed the assignee for #{ctx.task.name}"
    })
  end

  step :assert_assignee_removed_email_sent, ctx do
    ctx
    |> EmailSteps.assert_activity_email_sent(%{
      where: ctx.project.name,
      to: ctx.champion,
      author: ctx.reviewer,
      action: "changed the assignee for #{ctx.task.name}"
    })
  end

  step :assert_comment_posted_email_sent, ctx do
    ctx
    |> EmailSteps.assert_activity_email_sent(%{
      where: ctx.project.name,
      to: ctx.champion,
      author: ctx.reviewer,
      action: "commented on: #{ctx.task.name}"
    })
  end

  step :assert_task_added_email_sent, ctx, opts do
    to = Keyword.fetch!(opts, :to)
    author = Keyword.fetch!(opts, :author)

    ctx
    |> EmailSteps.assert_activity_email_sent(%{
      where: ctx.project.name,
      to: to,
      author: author,
      action: "added the task \"#{ctx.task.name}\""
    })
  end

  step :assert_space_member_mentioned_email_sent, ctx do
    ctx
    |> EmailSteps.assert_activity_email_sent(%{
      where: ctx.project.name,
      to: ctx.space_member,
      author: ctx.champion,
      action: "commented on: #{ctx.task.name}"
    })
  end

  step :assert_space_member_task_description_email_sent, ctx do
    ctx
    |> EmailSteps.assert_activity_email_sent(%{
      where: ctx.project.name,
      to: ctx.space_member,
      author: ctx.champion,
      action: "updated the description for \"#{ctx.task.name}\""
    })
  end

  #
  # Notifications
  #

  step :assert_due_date_changed_notification_sent, ctx, date do
    ctx
    |> UI.login_as(ctx.champion)
    |> NotificationsSteps.assert_activity_notification(%{
      author: ctx.reviewer,
      action: "Updated due date for #{ctx.task.name} to #{date}"
    })
  end

  step :assert_due_date_removed_notification_sent, ctx do
    ctx
    |> UI.login_as(ctx.champion)
    |> NotificationsSteps.assert_activity_notification(%{
      author: ctx.reviewer,
      action: "Cleared due date for #{ctx.task.name}"
    })
  end

  step :assert_assignee_changed_notification_sent, ctx do
    ctx
    |> UI.login_as(ctx.champion)
    |> NotificationsSteps.assert_activity_notification(%{
      author: ctx.reviewer,
      action: "Task \"#{ctx.task.name}\" was assigned to #{ctx.champion.full_name}"
    })
  end

  step :assert_assignee_removed_notification_sent, ctx do
    ctx
    |> UI.login_as(ctx.champion)
    |> NotificationsSteps.assert_activity_notification(%{
      author: ctx.reviewer,
      action: "Task \"#{ctx.task.name}\" was unassigned"
    })
  end

  step :assert_comment_posted_notification_sent, ctx, task_name: task_name do
    ctx
    |> UI.login_as(ctx.champion)
    |> NotificationsSteps.assert_activity_notification(%{
      author: ctx.reviewer,
      action: "Re: #{task_name}"
    })
  end

  step :assert_task_added_notification_sent, ctx, opts do
    recipient = Keyword.fetch!(opts, :to)
    author = Keyword.fetch!(opts, :author)

    ctx
    |> UI.login_as(recipient)
    |> NotificationsSteps.assert_activity_notification(%{
      author: author,
      action: "New task \"#{ctx.task.name}\" was created"
    })
  end

  step :refute_task_added_notification_sent, ctx, opts do
    recipient = Keyword.fetch!(opts, :recipient)

    ctx
    |> UI.login_as(recipient)
    |> NotificationsSteps.visit_notifications_page()
    |> UI.refute_text("New task \"#{ctx.task.name}\" was created")
  end

  step :assert_space_member_not_notified, ctx do
    ctx
    |> UI.login_as(ctx.space_member)
    |> UI.visit(Paths.home_path(ctx.company))
    |> UI.click(testid: "notifications-bell")
    |> UI.refute_text("Re: #{ctx.task.name}")
  end

  step :assert_space_member_notified, ctx do
    ctx
    |> UI.login_as(ctx.space_member)
    |> NotificationsSteps.assert_activity_notification(%{
      author: ctx.champion,
      action: "Re: #{ctx.task.name}"
    })
  end

  step :assert_space_member_task_description_notification_sent, ctx do
    ctx
    |> UI.login_as(ctx.space_member)
    |> NotificationsSteps.assert_activity_notification(%{
      author: ctx.champion,
      action: "Updated the description of: #{ctx.task.name}"
    })
  end

  step :assert_space_member_task_description_not_notified, ctx do
    ctx
    |> UI.login_as(ctx.space_member)
    |> NotificationsSteps.visit_notifications_page()
    |> UI.refute_text("Updated the description of: #{ctx.task.name}")
  end

  step :assert_task_description_indicator_visible, ctx do
    task_id = Paths.task_id(ctx.task)

    ctx
    |> UI.find(UI.query(testid: UI.testid(["task", task_id])), fn el ->
      UI.assert_has(el, testid: "description-indicator")
    end)
  end

  step :assert_task_description_indicator_not_visible, ctx do
    task_id = Paths.task_id(ctx.task)

    ctx
    |> UI.find(UI.query(testid: UI.testid(["task", task_id])), fn el ->
      UI.refute_has(el, testid: "description-indicator")
    end)
  end

  step :assert_task_comment_indicator_not_visible, ctx do
    task_id = Paths.task_id(ctx.task_without_comments)

    ctx
    |> UI.find(UI.query(testid: UI.testid(["task", task_id])), fn el ->
      UI.refute_has(el, testid: "comments-indicator")
    end)
  end

  step :assert_task_comment_count, ctx, expected_count do
    task_id = Paths.task_id(ctx.task_with_comments)

    ctx
    |> UI.find(UI.query(testid: UI.testid(["task", task_id])), fn el ->
      el
      |> UI.assert_has(testid: "comments-indicator")
      |> UI.assert_text(Integer.to_string(expected_count))
    end)
  end

  #
  # Helpers
  #

  defp if_present(ctx, nil, _func), do: ctx

  defp if_present(ctx, _property, func) do
    func.(ctx)
  end
end

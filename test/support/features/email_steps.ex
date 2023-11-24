defmodule Operately.Support.Features.EmailSteps do
  alias Operately.Support.Features.UI
  alias Operately.People.Person

  def assert_project_created_email_sent(ctx, author: author, project: project_name, to: to, role: role) do
    ctx |> assert_sent(to: to, subject: "#{Person.short_name(author)} created the #{project_name} project in Operately and assigned you as a #{role}")
  end

  def assert_project_retrospective_sent(ctx, author: author, to: to) do
    ctx |> assert_sent(to: to, subject: "#{Person.short_name(author)} closed the #{ctx.project.name} project and submitted a retrospective")
  end

  def assert_project_archived_sent(ctx, author: author, project: project, to: to) do
    ctx |> assert_sent(to: to, subject: "#{Person.short_name(author)} archived the #{project.name} project in Operately")
  end

  def assert_project_update_acknowledged_sent(ctx, author: author, to: to) do
    ctx |> assert_sent(to: to, subject: "#{Person.short_name(author)} acknowledged your status update for #{ctx.project.name}")
  end

  def assert_project_review_acknowledged_sent(ctx, author: author, to: to) do
    ctx |> assert_sent(to: to, subject: "#{Person.short_name(author)} acknowledged your review for #{ctx.project.name}")
  end

  def assert_project_review_commented_sent(ctx, author: author, to: to) do
    ctx |> assert_sent(to: to, subject: "#{Person.short_name(author)} commented on a review for #{ctx.project.name}")
  end

  def assert_project_update_commented_sent(ctx, author: author, to: to) do
    ctx |> assert_sent(to: to, subject: "#{Person.short_name(author)} commented on a status update for #{ctx.project.name}")
  end

  def assert_project_timeline_edited_sent(ctx, author: author, to: to) do
    ctx |> assert_sent(to: to, subject: "#{Person.short_name(author)} changed the timeline for #{ctx.project.name}")
  end

  def assert_milestone_comment_sent(ctx, author: author, to: to, title: title) do
    ctx |> assert_sent(to: to, subject: "#{Person.short_name(author)} commented on the #{title} milestone")
  end

  def assert_milestone_completed_sent(ctx, author: author, to: to, title: title) do
    ctx |> assert_sent(to: to, subject: "#{Person.short_name(author)} completed the #{title} milestone")
  end

  def assert_milestone_reopened_sent(ctx, author: author, to: to, title: title) do
    ctx |> assert_sent(to: to, subject: "#{Person.short_name(author)} re-opened the #{title} milestone")
  end

  def assert_project_status_update_submitted_sent(ctx, author: author) do
    ctx |> assert_sent_to_all_project_contributors(subject: "#{Person.short_name(author)} posted an update for #{ctx.project.name}", except: [author])
  end

  #
  # Private
  #
  defp assert_sent(ctx, to: to, subject: subject) do
    ctx |> UI.assert_email_sent("Operately (#{ctx.company.name}): #{subject}", to: to.email)
  end

  defp refute_sent(ctx, to: to, subject: subject) do
    ctx |> UI.refute_email_sent("Operately (#{ctx.company.name}): #{subject}", to: to.email)
  end

  defp assert_sent_to_all_project_contributors(ctx, subject: subject, except: except) do
    people = list_project_contributors(ctx, except: except)

    Enum.each(people, fn person -> assert_sent(ctx, to: person, subject: subject) end)
    Enum.each(except, fn person -> refute_sent(ctx, to: person, subject: subject) end)

    ctx
  end

  defp list_project_contributors(ctx, except: except) do
    except_ids = Enum.map(except, fn person -> person.id end)

    Operately.Projects.list_project_contributors(ctx.project)
    |> Operately.Repo.preload(:person)
    |> Enum.map(fn contrib -> contrib.person end)
    |> Enum.reject(fn person -> person.id in except_ids end)
  end
end

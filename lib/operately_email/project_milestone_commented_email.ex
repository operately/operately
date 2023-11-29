defmodule OperatelyEmail.ProjectMilestoneCommentedEmail do
  @view OperatelyEmail.Views.ProjectMilestoneCommented

  alias Operately.People.Person

  def send(person, activity) do
    if OperatelyEmail.send_email_to_person?(person) do
      compose(activity, person) |> OperatelyEmail.Mailer.deliver_now()
    end
  end

  def compose(activity, recipient) do
    import Bamboo.Email

    author = Operately.Repo.preload(activity, :author).author
    company = Operately.Repo.preload(author, :company).company
    milestone = Operately.Projects.get_milestone!(activity.content["milestone_id"])
    comment = Operately.Updates.get_comment!(activity.content["comment_id"])
    action = activity.content["comment_action"]

    assigns = %{
      company: company,
      author: Person.short_name(author),
      content: comment.content["message"],
      cta_url: OperatelyEmail.project_milestone_url(milestone.project_id, milestone.id),
      title: title(author, milestone, action),
      subject: subject(company, author, milestone, action)
    }

    new_email(
      to: recipient.email,
      from: OperatelyEmail.sender(company),
      subject: subject(company, author, milestone, action),
      html_body: @view.html(assigns),
      text_body: @view.text(assigns)
    )
  end

  def subject(company, author, milestone, action) do
    "#{OperatelyEmail.sender_name(company)}: #{title(author, milestone, action)}"
  end

  def title(author, milestone, action) do
    author = Person.short_name(author)

    case action do
      "none" ->
        "#{author} commented on the #{milestone.title} milestone"
      "complete" ->
        "#{author} completed the #{milestone.title} milestone"
      "reopen" ->
        "#{author} re-opened the #{milestone.title} milestone"
      _ ->
        raise "Unknown action: #{action}"
    end
  end

end

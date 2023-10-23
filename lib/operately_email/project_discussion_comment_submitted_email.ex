defmodule OperatelyEmail.ProjectDiscussionCommentSubmittedEmail do
  alias Operately.People.Person

  def send(person, activity) do
    comment = Operately.Updates.get_comment!(activity.content["comment_id"])
    discussion = Operately.Updates.get_update!(activity.content["discussion_id"])
    project = Operately.Projects.get_project!(activity.content["project_id"])

    email = compose(project, discussion, comment, person)
    OperatelyEmail.Mailer.deliver_now(email)
  end

  def compose(project, discussion, comment, recipient) do
    import Bamboo.Email

    author = Operately.Repo.preload(comment, :author).author
    company = Operately.Repo.preload(author, :company).company
    subject = "#{Person.short_name(author)} commented on: #{discussion.content["title"]}"

    assigns = %{
      company: company,
      project: project,
      discussion: discussion,
      comment: comment,
      author: Person.short_name(author),
      cta_url: cta_url(project, discussion),
      title: subject
    }

    new_email(
      to: recipient.email,
      from: sender(company),
      subject: subject,
      html_body: OperatelyEmail.Views.ProjectCommentSubmitted.html(assigns),
      text_body: OperatelyEmail.Views.ProjectCommentSubmitted.text(assigns)
    )
  end

  def sender(company) do
    {"Operately (#{company.name})", Application.get_env(:operately, :notification_email)}
  end

  def cta_url(project, discussion) do
    OperatelyWeb.Endpoint.url() <> "/projects/#{project.id}/discussions/#{discussion.id}"
  end
end

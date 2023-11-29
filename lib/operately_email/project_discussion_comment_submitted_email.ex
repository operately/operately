defmodule OperatelyEmail.ProjectDiscussionCommentSubmittedEmail do
  alias Operately.People.Person

  def send(person, activity) do
    if OperatelyEmail.send_email_to_person?(person) do
      comment = Operately.Updates.get_comment!(activity.content["comment_id"])
      discussion = Operately.Updates.get_update!(activity.content["discussion_id"])
      project = Operately.Projects.get_project!(activity.content["project_id"])

      email = compose(project, discussion, comment, person)
      OperatelyEmail.Mailer.deliver_now(email)
    end
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
      cta_url: OperatelyEmail.project_discussion_url(project.id, discussion.id),
      title: subject
    }

    new_email(
      to: recipient.email,
      from: OperatelyEmail.sender(company),
      subject: subject,
      html_body: OperatelyEmail.Views.ProjectDiscussionCommentSubmitted.html(assigns),
      text_body: OperatelyEmail.Views.ProjectDiscussionCommentSubmitted.text(assigns)
    )
  end
end

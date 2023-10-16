defmodule OperatelyEmail.ProjectCommentSubmittedEmail do
  use Oban.Worker
  
  alias Operately.People.Person

  def enqueue(_repo, %{comment: comment}) do
    new(%{id: comment.id}) |> Oban.insert()
  end

  def perform(job) do
    id = job.args["id"]

    comment = Operately.Updates.get_comment!(id)
    update = Operately.Updates.get_update!(comment.update_id)
    project = Operately.Projects.get_project!(update.updatable_id)
    recipients = Operately.Updates.list_people_who_should_be_notified(update)

    if update.type == :project_discussion do
      Enum.each(recipients, fn recipient ->
        email = compose(project, update, comment, recipient)
        OperatelyEmail.Mailer.deliver_now(email)
      end)
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

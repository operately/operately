defmodule OperatelyEmail.ProjectDiscussionSubmittedEmail do
  alias Operately.People.Person

  def send(person, activity) do
    update = Operately.Updates.get_update!(activity.content["discussion_id"])
    project = Operately.Projects.get_project!(update.updatable_id)
    email = compose(project, update, person)

    OperatelyEmail.Mailer.deliver_now(email)
  end

  def compose(project, update, recipient) do
    import Bamboo.Email

    author = Operately.Repo.preload(update, :author).author
    company = Operately.Repo.preload(author, :company).company

    assigns = %{
      company: company,
      project: project,
      discussion: update,
      author: Person.short_name(author),
      cta_url: OperatelyEmail.project_discussion_url(project.id, update.id),
      title: subject(author, project, update)
    }

    new_email(
      to: recipient.email,
      from: OperatelyEmail.sender(company),
      subject: subject(author, project, update),
      html_body: OperatelyEmail.Views.ProjectDiscussionSubmitted.html(assigns),
      text_body: OperatelyEmail.Views.ProjectDiscussionSubmitted.text(assigns)
    )
  end

  def subject(author, project, update) do
    "#{Person.short_name(author)} started a discussion in #{project.name}: #{update.content["title"]}"
  end
end

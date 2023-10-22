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
      cta_url: cta_url(project, update),
      title: subject(author, project, update)
    }

    new_email(
      to: recipient.email,
      from: sender(company),
      subject: subject(author, project, update),
      html_body: OperatelyEmail.Views.ProjectDiscussionSubmitted.html(assigns),
      text_body: OperatelyEmail.Views.ProjectDiscussionSubmitted.text(assigns)
    )
  end

  def sender(company) do
    {"Operately (#{company.name})", Application.get_env(:operately, :notification_email)}
  end

  def subject(short_name, project, update) do
    "#{Person.short_name(short_name)} started a discussion in #{project.name}: #{update.content["title"]}"
  end

  def cta_url(project, discussion) do
    OperatelyWeb.Endpoint.url() <> "/projects/#{project.id}/discussions/#{discussion.id}"
  end
end

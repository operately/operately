defmodule OperatelyEmail.ProjectStatusUpdateAcknowledgedEmail do
  alias Operately.People.Person

  def send(person, activity) do
    if OperatelyEmail.send_email_to_person?(person) do
      author = Operately.People.get_person!(activity.author_id)
      update = Operately.Updates.get_update!(activity.content["status_update_id"])
      project = Operately.Projects.get_project!(update.updatable_id)
      email = compose(project, update, author, person)

      OperatelyEmail.Mailer.deliver_now(email)
    end
  end

  def compose(project, update, author, recipient) do
    import Bamboo.Email

    company = Operately.Repo.preload(author, :company).company

    assigns = %{
      company: company,
      project: project,
      status_update: update,
      author: Person.short_name(author),
      project_url: OperatelyEmail.project_url(project.id),
      cta_url: OperatelyEmail.project_status_update_url(project.id, update.id),
      title: subject(company, author, project)
    }

    new_email(
      to: recipient.email,
      from: OperatelyEmail.sender(company),
      subject: subject(company, author, project),
      html_body: OperatelyEmail.Views.ProjectStatusUpdateAcknowledged.html(assigns),
      text_body: OperatelyEmail.Views.ProjectStatusUpdateAcknowledged.text(assigns)
    )
  end

  def subject(company, author, project) do
    "#{OperatelyEmail.sender_name(company)}: #{Person.short_name(author)} acknowledged your status update for #{project.name}"
  end
end

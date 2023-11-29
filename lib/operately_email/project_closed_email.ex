defmodule OperatelyEmail.ProjectClosedEmail do
  @view OperatelyEmail.Views.ProjectClosed

  alias Operately.People.Person

  def send(person, activity) do
    if OperatelyEmail.send_email_to_person?(person) do
      author = Operately.Repo.preload(activity, :author).author
      project = Operately.Projects.get_project!(activity.content["project_id"])
      email = compose(author, project, person)

      OperatelyEmail.Mailer.deliver_now(email)
    end
  end

  def compose(author, project, recipient) do
    import Bamboo.Email

    company = Operately.Repo.preload(author, :company).company

    assigns = %{
      title: subject(company, author, project),
      author: author,
      project: project,
      url: OperatelyEmail.project_url(project.id),
      cta_url: OperatelyEmail.project_retrospective_url(project.id),
    }

    new_email(
      to: recipient.email,
      from: OperatelyEmail.sender(company),
      subject: subject(company, author, project),
      html_body: @view.html(assigns),
      text_body: @view.text(assigns)
    )
  end

  def subject(company, author, project) do
    sender = OperatelyEmail.sender_name(company)
    who = Person.short_name(author)

    "#{sender}: #{who} closed the #{project.name} project and submitted a retrospective"
  end
end

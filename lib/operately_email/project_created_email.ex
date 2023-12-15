defmodule OperatelyEmail.ProjectCreatedEmail do
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
    role = Operately.Projects.get_contributor_role!(project, recipient.id) |> stringify_role()
    author_role = Operately.Projects.get_contributor_role!(project, author.id) |> stringify_role()

    assigns = %{
      title: subject(company, author, project, role),
      author: author,
      role: role,
      author_role: author_role,
      project: project,
      url: OperatelyEmail.project_url(project.id),
    }

    new_email(
      to: recipient.email,
      from: OperatelyEmail.sender(company),
      subject: subject(company, author, project, role),
      html_body: OperatelyEmail.Views.ProjectCreated.html(assigns),
      text_body: OperatelyEmail.Views.ProjectCreated.text(assigns)
    )
  end

  def subject(company, author, project, role) do
    "#{OperatelyEmail.sender_name(company)}: #{Person.short_name(author)} created the #{project.name} project in Operately and assigned you as a #{role}"
  end

  def stringify_role(role) do
    case role do
      :champion -> "Champion"
      :reviewer -> "Reviewer"
      :contributor -> "Contributor"
      nil -> nil
    end
  end
end

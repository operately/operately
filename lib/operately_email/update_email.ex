defmodule OperatelyEmail.UpdateEmail do
  use Oban.Worker

  def perform(%{update_id: update_id}) do
    update = Operately.Updates.get_update!(update_id)
    recipients = recipients(update)

    Enum.each(recipients, fn recipient ->
      send_email(update, recipient)
    end)
  end

  def send_email(update, recipient) do
    email = compose(update, recipient)
    OperatelyEmail.Mailer.deliver_now(email)
  end

  def recipients(update) do
    import Ecto.Query

    Operately.Repo.all(
      from p in Operately.People.Person, 
        join: c in Operately.Projects.Contributor, on: c.person_id == p.id, 
        where: c.project_id == ^update.updatable_id,
        where: p.id != ^update.author_id
    )
  end

  def compose(update, recipient) do
    import Bamboo.Email

    author = Operately.Repo.preload(update, :author).author
    company = Operately.Repo.preload(author, :company).company
    project = Operately.Projects.get_project!(update.updatable_id)

    assigns = %{
      company: company,
      title: subject(company, author, project),
      author: short_name(author),
      project: project,
      project_url: project_url(project),
    }

    new_email(
      to: recipient.email,
      from: sender(company),
      subject: subject(company, author, project),
      html_body: OperatelyEmail.Views.Update.html(assigns),
      text_body: OperatelyEmail.Views.Update.text(assigns)
    )
  end

  def sender(company) do
    {
      org_name(company),
      Application.get_env(:operately, :notification_email)
    }
  end

  def subject(company, author, project) do
    "#{org_name(company)}: #{short_name(author)} posted an update for #{project.name}"
  end

  def short_name(author) do
    [first_name, last_name] = String.split(author.first_name, " ")
    last_name_initial = String.first(last_name)

    "#{first_name} #{last_name_initial}."
  end

  def org_name(company) do
    "Operately (#{company.name})"
  end

  def project_url(project) do
    OperatelyWeb.Endpoint.url() <> "/projects/#{project.id}"
  end
end

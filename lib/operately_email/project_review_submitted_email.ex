defmodule OperatelyEmail.ProjectReviewSubmittedEmail do
  alias Operately.People.Person

  def send(person, activity) do
    update = Operately.Updates.get_update!(activity.content["review_id"])
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
      review: update,
      author: Person.short_name(author),
      project_url: project_url(project),
      cta_url: cta_url(project, update),
      title: subject(company, author, project)
    }

    new_email(
      to: recipient.email,
      from: sender(company),
      subject: subject(company, author, project),
      html_body: OperatelyEmail.Views.ProjectReviewSubmitted.html(assigns),
      text_body: OperatelyEmail.Views.ProjectReviewSubmitted.text(assigns)
    )
  end

  def sender(company) do
    {
      "Operately (#{company.name})", 
      Application.get_env(:operately, :notification_email)
    }
  end

  def cta_url(project, status_update) do
    OperatelyWeb.Endpoint.url() <> "/projects/#{project.id}/reviews/#{status_update.id}"
  end

  def subject(company, author, project) do
    "#{org_name(company)}: #{Person.short_name(author)} submitted a review for #{project.name}"
  end

  def org_name(company) do
    "Operately (#{company.name})"
  end

  def project_url(project) do
    OperatelyWeb.Endpoint.url() <> "/projects/#{project.id}"
  end
end

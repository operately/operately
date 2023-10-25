defmodule OperatelyEmail.ProjectReviewRequestSubmittedEmail do
  alias Operately.People.Person

  def send(person, activity) do
    request = Operately.Projects.get_review_request!(activity.content["request_id"])
    project = Operately.Projects.get_project!(request.project_id)

    email = compose(project, request, person)

    OperatelyEmail.Mailer.deliver_now(email)
  end

  def compose(project, request, champion) do
    import Bamboo.Email

    author = Operately.Repo.preload(request, :author).author
    company = Operately.Repo.preload(author, :company).company

    assigns = %{
      company: company,
      project: project,
      request: request,
      author: Person.short_name(author),
      cta_url: cta_url(project, request),
      title: subject(company, author, project)
    }

    new_email(
      to: champion.email,
      from: sender(company),
      subject: subject(company, author, project),
      html_body: OperatelyEmail.Views.ProjectReviewRequestSubmitted.html(assigns),
      text_body: OperatelyEmail.Views.ProjectReviewRequestSubmitted.text(assigns)
    )
  end

  def sender(company) do
    {org_name(company), Application.get_env(:operately, :notification_email)}
  end

  def subject(company, short_name, project) do
    "#{org_name(company)}: #{Person.short_name(short_name)} requested a review for #{project.name}"
  end

  def org_name(company) do
    "Operately (#{company.name})"
  end

  def cta_url(project, request) do
    OperatelyWeb.Endpoint.url() <> "/projects/#{project.id}/reviews/request/#{request.id}"
  end
end

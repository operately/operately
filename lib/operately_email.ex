defmodule OperatelyEmail do

  def sender(company), do: {sender_name(company), notification_email_address()}
  def sender_name(company), do: "Operately (#{company.name})"
  def notification_email_address(), do: Application.get_env(:operately, :notification_email)

  # URls used in emails

  def app_url(), do: OperatelyWeb.Endpoint.url()
  def project_url(project_id), do: app_url() <> "/projects/#{project_id}"
  def project_review_url(project_id, review_id), do: app_url() <> "/projects/#{project_id}/reviews/#{review_id}"
  def project_review_request_url(project_id, request_id), do: app_url() <> "/projects/#{project_id}/reviews/request/#{request_id}"
  def project_new_status_update_url(project_id), do: app_url() <> "/projects/#{project_id}/status_updates/new"
  def project_status_update_url(project_id, status_update_id), do: app_url() <> "/projects/#{project_id}/status_updates/#{status_update_id}"
  def project_discussion_url(project_id, discussion_id), do: app_url() <> "/projects/#{project_id}/discussions/#{discussion_id}"
  def project_milestone_url(project_id, milestone_id), do: app_url() <> "/projects/#{project_id}/milestones/#{milestone_id}"
  def project_retrospective_url(project_id), do: app_url() <> "/projects/#{project_id}/retrospective"
  def goal_url(goal_id), do: app_url() <> "/goals/#{goal_id}"

  #
  # Email Types
  #

  defmodule NotificationEmail do
    defstruct [:company, :to, :from, :subject, :assigns]

    def new(company) do
      %__MODULE__{company: company, assigns: %{}, from: OperatelyEmail.sender(company)}
    end

    def to(email, person) do
      %{email | to: person.email}
    end

    def assign(email, key, value) do
      %{email | assigns: Map.put(email.assigns, key, value)}
    end

    def subject(email, subject) do
      sender = OperatelyEmail.sender_name(email.company)

      %{email | subject: "#{sender}: #{subject}"}
    end

    def deliver(email, view) do
      import Bamboo.Email

      full_assigns = Map.put(email.assigns, :subject, email.subject)

      email = new_email(
        to: email.to,
        from: email.from,
        subject: email.subject,
        html_body: view.html(full_assigns),
        text_body: view.text(full_assigns)
      )

      OperatelyEmail.Mailer.deliver_now(email)
    end
  end

  defmodule ActivityEmail do
    alias Operately.People.Person

    defdelegate new(company), to: NotificationEmail
    defdelegate to(email, person), to: NotificationEmail
    defdelegate deliver(email, view), to: NotificationEmail
    defdelegate assign(email, key, value), to: NotificationEmail

    def subject(email, who: who, action: action) do
      NotificationEmail.subject(email, "#{Person.short_name(who)} #{action}")
    end
  end
end

defmodule OperatelyEmail.Emails do
  alias Operately.Repo
  import Bamboo.Email

  #
  # Sending out an email to remind people of their assignments.
  # The scheduler of this email is located in OperatelyEmail.Assignments.Cron
  #
  def assignments(person, assignment_groups) do
    company = Repo.preload(person, [:company]).company
    account = Repo.preload(person, [:account]).account

    assigns = %{
      company: company,
      assignment_groups: assignment_groups
    }

    new_email(
      to: account.email,
      from: {org_name(company), from_email()},
      subject: "#{org_name(company)}: Your assignments for today",
      html_body: OperatelyEmail.Views.Assignments.html(assigns),
      text_body: OperatelyEmail.Views.Assignments.text(assigns)
    )
  end

  defp org_name(company) do
    "Operately (#{company.name})"
  end

  defp from_email do
    Application.get_env(:operately, :notification_email)
  end

end

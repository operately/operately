defmodule OperatelyEmail.AssignmentsEmail do
  alias Operately.Repo
  import Bamboo.Email

  #
  # Sending out an email to remind people of their assignments.
  # The scheduler of this email is located in OperatelyEmail.Assignments.Cron
  #

  def send(person) do
    result = OperatelyEmail.Assignments.Loader.load(person)

    if result == [] do
      IO.puts("No assignments for #{person.account.email}")
    else
      compose(person, result) |> OperatelyEmail.Mailer.deliver_now()
    end
  end

  def compose(person, assignment_groups) do
    company = Repo.preload(person, [:company]).company
    account = Repo.preload(person, [:account]).account

    assigns = %{
      company: company,
      assignment_groups: assignment_groups
    }

    new_email(
      to: account.email,
      from: OperatelyEmail.sender(company),
      subject: "#{OperatelyEmail.sender_name(company)}: Your assignments for today",
      html_body: OperatelyEmail.Views.Assignments.html(assigns),
      text_body: OperatelyEmail.Views.Assignments.text(assigns)
    )
  end

end

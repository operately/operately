defmodule OperatelyEmail.Emails.AssignmentsEmail do
  import OperatelyEmail.Mailers.NotificationMailer

  alias Operately.Repo
  require Logger

  #
  # Sending out an email to remind people of their assignments.
  # The scheduler of this email is located in OperatelyEmail.Assignments.Cron
  #

  def send(person) do
    result = OperatelyEmail.Assignments.Loader.load(person)

    if result != [] do
      company = Repo.preload(person, [:company]).company

      company
      |> new()
      |> from("Operately")
      |> to(person)
      |> subject("Your assignments for today")
      |> assign(:company, company)
      |> assign(:assignment_groups, result)
      |> render("assignments")
    else
      Logger.info("No assignments for #{person.full_name}")
    end
  end

end

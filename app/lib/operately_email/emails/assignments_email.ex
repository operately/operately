defmodule OperatelyEmail.Emails.AssignmentsEmail do
  import OperatelyEmail.Mailers.NotificationMailer

  alias Operately.Repo
  require Logger

  #
  # Sending out an email to remind people of their assignments.
  # The scheduler of this email is located in OperatelyEmail.Assignments.Cron
  #

  def send(person) do
    company = Repo.preload(person, [:company]).company
    [mine: assignments, reports: _] = Operately.Assignments.Loader.load(person, company)

    if assignments != [] do
      company
      |> new()
      |> from("Operately")
      |> to(person)
      |> subject("Operately(#{company.name}): Your assignments for today")
      |> assign(:company, company)
      |> assign(:assignments, assignments)
      |> render("assignments")
    else
      Logger.info("No assignments for #{person.full_name}")
    end
  end
end

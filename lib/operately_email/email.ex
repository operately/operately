defmodule OperatelyEmail.Email do
  import Bamboo.Email

  alias Operately.{People, Projects}
  alias Operately.Repo

  def assignments_email(person) do
    company = Repo.preload(person, [:company]).company
    account = Repo.preload(person, [:account]).account

    pending_assignments = People.get_assignments(
      person,
      DateTime.from_unix!(0),
      DateTime.utc_now()
    )

    if Enum.empty?(pending_assignments) do
      :no_assignments
    else
      assigns = %{
        company: company,
        assignments: pending_assignments
      }

      {:ok, new_email(
        to: account.email,
        from: {org_name(company), from_email()},
        subject: "#{org_name(company)}: Your assignments for today",
        html_body: OperatelyEmail.Views.Assignments.html(assigns),
        text_body: OperatelyEmail.Views.Assignments.text(assigns)
      )}
    end
  end

  defp from_email do
    "notification@operately.com"
  end

  defp org_name(company) do
    "Operately (#{company.name})"
  end

  # defp relative_due(due) do
  #   due = if due.__struct__ == NaiveDateTime do
  #     due |> DateTime.from_naive!("Etc/UTC")
  #   else
  #     due
  #   end

  #   today = DateTime.utc_now() |> DateTime.to_date()
  #   datetime_date = due |> DateTime.to_date()

  #   case Date.compare(datetime_date, today) do
  #     :lt ->
  #       days_ago = Date.diff(today, datetime_date)

  #       "was due #{days_ago} days ago"
  #     :eq ->
  #       "is due today"
  #   end
  # end

end

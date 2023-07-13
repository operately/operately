defmodule OperatelyEmail.Email do
  import Bamboo.Email

  alias Operately.{Companies, People, Projects}

  def assignments_email(person) do
    company = Companies.get_company!(person.company_id)
    account = People.get_account!(person.account_id)

    pending_assignments = People.get_assignments(
      person,
      DateTime.from_unix!(0),
      DateTime.utc_now()
    )

    text_body = [
      "Here are your assignments for today:",
      "",
      ""
    ] ++ (
      pending_assignments |> Enum.map(fn assignment ->
          case assignment.type do
            "milestone" ->
              project = Projects.get_project!(assignment.resource.project_id)

              [
                "Milestone: #{assignment.milestone.title} on #{project.name}",
                "Due: #{DateTime.to_string(assignment.due_date)}",
                ""
              ]
            "project_status_update" ->
              [
                "Pending Status Update: #{assignment.resource.title}",
                "Due: #{DateTime.to_string(assignment.due_date)}",
                ""
              ]
            _ ->
              []
          end
      end)
    )
    |> List.flatten()
    |> Enum.join("\n")

    new_email(
      to: account.email,
      from: {org_name(company), "igor@operately.com"},
      subject: "#{org_name(company)}: Your assignments for today",
      html_body: "",
      text_body: text_body
    )
  end

  defp org_name(company) do
    "Operately (#{company.name})"
  end

end

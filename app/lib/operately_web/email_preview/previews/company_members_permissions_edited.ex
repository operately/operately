defmodule OperatelyWeb.EmailPreview.Previews.CompanyMembersPermissionsEdited do
  @moduledoc "Mock data for the company members permissions edited email preview."

  alias OperatelyEmail.Mailers.ActivityMailer, as: Mailer
  alias OperatelyWeb.EmailPreview.Preview

  @link "#"

  def access_level_increased do
    context = base_context()

    context
    |> build_email(@link, "View Access", "Edit Access")
    |> Preview.build("company_members_permissions_edited")
  end

  def access_level_decreased do
    context = base_context()

    context
    |> build_email(@link, "Edit Access", "View Access")
    |> Preview.build("company_members_permissions_edited")
  end

  def access_level_to_full do
    context = base_context()

    context
    |> build_email(@link, "Edit Access", "Full Access")
    |> Preview.build("company_members_permissions_edited")
  end

  defp build_email(%{company: company, author: author, person: person}, link, previous_level, updated_level) do
    company
    |> Mailer.new()
    |> Mailer.from(author)
    |> Mailer.to(person)
    |> Mailer.subject(where: company.name, who: author, action: "updated your access level")
    |> Mailer.assign(:author, author)
    |> Mailer.assign(:link, link)
    |> Mailer.assign(:previous_access_level, previous_level)
    |> Mailer.assign(:updated_access_level, updated_level)
  end

  defp base_context do
    company = %{name: "Acme Corporation"}
    author = person(%{id: "person-001", full_name: "Taylor Reed", email: "taylor@localhost.com"})
    person = person(%{id: "person-002", full_name: "Jordan Smith", email: "jordan@localhost.com"})

    %{company: company, author: author, person: person}
  end

  defp person(%{id: id, full_name: full_name, email: email}) do
    %{id: id, full_name: full_name, email: email}
  end
end

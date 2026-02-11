defmodule OperatelyWeb.EmailPreview.Previews.CompanyMemberConvertedToGuest do
  @moduledoc "Mock data for the company member converted to guest email preview."

  alias OperatelyEmail.Mailers.ActivityMailer, as: Mailer
  alias OperatelyWeb.EmailPreview.Preview
  alias OperatelyWeb.Paths

  def preview do
    context = base_context()
    login_url = Paths.login_path() |> Paths.to_url()

    context
    |> build_email(login_url)
    |> Preview.build("company_member_converted_to_guest")
  end

  defp build_email(%{company: company, author: author, person: person}, login_url) do
    company
    |> Mailer.new()
    |> Mailer.from(author)
    |> Mailer.to(person)
    |> Mailer.subject(where: company.name, who: author, action: "converted your account to an outside collaborator")
    |> Mailer.assign(:author, author)
    |> Mailer.assign(:company, company)
    |> Mailer.assign(:login_url, login_url)
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

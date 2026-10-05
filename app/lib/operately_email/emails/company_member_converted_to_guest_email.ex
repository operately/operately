defmodule OperatelyEmail.Emails.CompanyMemberConvertedToGuestEmail do
  use Gettext, backend: OperatelyWeb.Gettext
  import OperatelyEmail.Mailers.ActivityMailer

  alias Operately.Repo
  alias OperatelyWeb.Paths

  def send(person, activity) do
    activity = Repo.preload(activity, author: :company)
    author = activity.author
    company = author.company
    login_url = Paths.to_url(Paths.login_path())

    company
    |> new()
    |> from(author)
    |> to(person)
    |> subject(gettext("(%{company_name}) %{author} converted your account to an outside collaborator", company_name: company.name, author: Operately.People.Person.short_name(author)))
    |> assign(:author, author)
    |> assign(:company, company)
    |> assign(:login_url, login_url)
    |> render("company_member_converted_to_guest")
  end
end

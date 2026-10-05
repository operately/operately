defmodule OperatelyEmail.Emails.CompanyOwnerRemovingEmail do
  use Gettext, backend: OperatelyWeb.Gettext
  import OperatelyEmail.Mailers.ActivityMailer

  alias Operately.Repo
  alias OperatelyWeb.Paths

  def send(person, activity) do
    person = Repo.preload(person, [:company])
    activity = Repo.preload(activity, [:author])

    author = activity.author
    company = person.company
    link = Paths.home_path(company) |> Paths.to_url()

    company
    |> new()
    |> from(author)
    |> to(person)
    |> subject(gettext("(%{company_name}) %{author} has revoked your account owner status", company_name: company.name, author: Operately.People.Person.short_name(author)))
    |> assign(:author, author)
    |> assign(:link, link)
    |> render("company_owner_removing")
  end
end

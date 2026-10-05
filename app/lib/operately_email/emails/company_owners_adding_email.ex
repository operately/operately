  defmodule OperatelyEmail.Emails.CompanyOwnersAddingEmail do
  use Gettext, backend: OperatelyWeb.Gettext
    import OperatelyEmail.Mailers.ActivityMailer

    alias Operately.Repo
    alias OperatelyWeb.Paths

    def send(person, activity) do
      activity = Repo.preload(activity, [author: :company])
      author = activity.author
      company = author.company

      link = Paths.home_path(company) |> Paths.to_url()

      company
      |> new()
      |> from(author)
      |> to(person)
      |> subject(gettext("(%{company_name}) %{author} promoted you to an account owner", company_name: company.name, author: Operately.People.Person.short_name(author)))
      |> assign(:author, author)
      |> assign(:link, link)
      |> render("company_owners_adding")
    end
  end

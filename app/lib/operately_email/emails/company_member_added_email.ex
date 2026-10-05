defmodule OperatelyEmail.Emails.CompanyMemberAddedEmail do
  use Gettext, backend: OperatelyWeb.Gettext
  alias Operately.Repo
  alias OperatelyWeb.Paths
  alias Operately.InviteLinks.InviteLink

  def send(person, activity) do
    import OperatelyEmail.Mailers.ActivityMailer

    activity = Repo.preload(activity, author: :company)
    author = activity.author
    company = author.company
    invite_link = get_invite_link(company, person)

    headline = get_headline(invite_link, company, author)
    button_text = get_button_text(invite_link, company)
    button_url = get_url(invite_link)

    company
    |> new()
    |> from(author)
    |> to(person)
    |> subject(get_subject(invite_link, company, author))
    |> assign(:author, author)
    |> assign(:company, company)
    |> assign(:person, person)
    |> assign(:headline, headline)
    |> assign(:button_url, button_url)
    |> assign(:button_text, button_text)
    |> render("company_member_added")
  end

  defp get_invite_link(company, person) do
    import Ecto.Query, only: [from: 2]

    from(link in InviteLink,
      where: link.company_id == ^company.id and link.person_id == ^person.id and link.is_active == true
    )
    |> Repo.one()
  end

  defp get_subject(nil, company, author), do: gettext("(%{company_name}) %{author} added you as a company member", company_name: company.name, author: Operately.People.Person.short_name(author))
  defp get_subject(%InviteLink{}, company, author) do
    gettext("(%{company_name}) %{author} invited you to join %{company_name}", company_name: company.name, author: Operately.People.Person.short_name(author))
  end
  defp get_headline(nil, _company, author), do: gettext("%{author} added you as a company member", author: Operately.People.Person.short_name(author))
  defp get_headline(%InviteLink{}, company, author), do: gettext("%{author} invited you to join %{company_name}", company_name: company.name, author: Operately.People.Person.short_name(author))

  defp get_button_text(nil, _company), do: gettext("Log in to Operately")
  defp get_button_text(%InviteLink{}, company), do: gettext("Join %{company_name}", company_name: company.name)

  defp get_url(nil), do: Paths.to_url(Paths.login_path())
  defp get_url(invite_link), do: Paths.to_url(Paths.join_path(invite_link.token))
end

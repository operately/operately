defmodule OperatelyEmail.Emails.CompanyMembersPermissionsEditedEmail do
  use Gettext, backend: OperatelyWeb.Gettext
  import OperatelyEmail.Mailers.ActivityMailer
  alias Operately.Repo
  alias Operately.I18n.AccessLabels
  alias OperatelyWeb.Paths

  def send(person, activity) do
    activity = Repo.preload(activity, [author: :company])
    author = activity.author
    company = author.company
    link = Paths.home_path(company) |> Paths.to_url()

    # Find the member entry for this person in the activity
    member = Enum.find(activity.content["members"] || [], fn m ->
      m["person_id"] == person.id
    end)

    company
    |> new()
    |> from(author)
    |> to(person)
    |> subject(gettext("(%{company_name}) %{author} updated your access level", company_name: company.name, author: Operately.People.Person.short_name(author)))
    |> assign(:author, author)
    |> assign(:link, link)
    |> assign(:previous_access_level, AccessLabels.label(member["previous_access_level"]))
    |> assign(:updated_access_level, AccessLabels.label(member["updated_access_level"]))
    |> render("company_members_permissions_edited")
  end

end

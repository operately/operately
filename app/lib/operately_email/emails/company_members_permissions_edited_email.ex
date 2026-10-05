defmodule OperatelyEmail.Emails.CompanyMembersPermissionsEditedEmail do
  use Gettext, backend: OperatelyWeb.Gettext
  import OperatelyEmail.Mailers.ActivityMailer
  alias Operately.Repo
  alias Operately.Access.Binding
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
    |> assign(:previous_access_level, access_level_name(member["previous_access_level"]))
    |> assign(:updated_access_level, access_level_name(member["updated_access_level"]))
    |> render("company_members_permissions_edited")
  end

  defp access_level_name(nil), do: gettext("No Access")
  defp access_level_name(level) do
    case Binding.label(level) do
      "No Access" -> gettext("No Access")
      "View Access" -> gettext("View Access")
      "Comment Access" -> gettext("Comment Access")
      "Edit Access" -> gettext("Edit Access")
      "Admin Access" -> gettext("Admin Access")
      "Full Access" -> gettext("Full Access")
    end
  end
end

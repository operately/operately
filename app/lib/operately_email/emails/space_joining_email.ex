defmodule OperatelyEmail.Emails.SpaceJoiningEmail do
  def send(_person, _activity) do
    raise "Email for SpaceJoining not implemented"
  end

  def buffered_item(_person, activity) do
    space = Operately.Groups.get_group!(activity.content["space_id"])
    company = Operately.Repo.preload(space, :company).company
    author = Operately.Repo.preload(activity, :author).author

    %{
      parent_id: space.id,
      parent_type: :space,
      parent_name: space.name,
      headline: "joined the space \"#{space.name}\"",
      excerpt_html: nil,
      excerpt_text: nil,
      item_url: OperatelyWeb.Paths.space_path(company, space) |> OperatelyWeb.Paths.to_url(),
      actor_name: Operately.People.Person.short_name(author),
      occurred_at: activity.inserted_at,
      coalesce_key: nil
    }
  end
end

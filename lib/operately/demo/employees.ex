defmodule Operately.Demo.Employees do
  @moduledoc """
  Create several employees for the demo, use avatars from a collection
  of free avatars on Unsplash. To add an avatar, go to unsplash.com, filter
  for faces, set that you want to see only free photos, and copy the photo 
  ID from the URL. Then use the `avatar/1` function to generate the URL.
  """

  def create_employees(context) do
    employees = [
      %{name: "Alice Johnson", title: "Chief Executive Officer (CEO)", avatar: avatar("photo-1550525811-e5869dd03032")},
      %{name: "Bob Williams", title: "Chief Operating Officer (COO)", avatar: avatar("photo-1500648767791-00dcc994a43e")},
      %{name: "Catherine Smith", title: "Chief Financial Officer (CFO)", avatar: avatar("photo-1472099645785-5658abf4ff4e")},
      %{name: "David Brown", title: "Chief Technology Officer (CTO)", avatar: avatar("photo-1491528323818-fdd1faba62cc")},
      %{name: "Emily Davis", title: "Chief Marketing Officer (CMO)", avatar: avatar("photo-1438761681033-6461ffad8d80")},
      %{name: "Frank Miller", title: "Chief Product Officer (CPO)", avatar: avatar("photo-1633332755192-727a05c4013d")},
      %{name: "Grace Wilson", title: "Chief Legal Officer (CLO)", avatar: avatar("photo-1494790108377-be9c29b29330")},
      %{name: "Henry Taylor", title: "VP of Engineering", avatar: avatar("photo-1492562080023-ab3db95bfbce")},
      %{name: "Ivy Anderson", title: "VP of Sales", avatar: avatar("photo-1522075469751-3a6694fb2f61")},
      %{name: "Jack Thomas", title: "VP of Customer Success", avatar: avatar("photo-1579038773867-044c48829161")},
      %{name: "Karen Martinez", title: "VP of Human Resources", avatar: avatar("photo-1534528741775-53994a69daeb")},
      %{name: "Liam Harris", title: "VP of Design", avatar: avatar("photo-1489980557514-251d61e3eeb6")},
      %{name: "Mia Clark", title: "Director of Engineering", avatar: avatar("photo-1541823709867-1b206113eafd")},
      %{name: "Noah Lewis", title: "Director of Sales", avatar: avatar("photo-1568602471122-7832951cc4c5")},
      %{name: "Olivia Hall", title: "Director of Product Management", avatar: avatar("photo-1531123897727-8f129e1688ce")},
      %{name: "Paul Young", title: "Director of Business Development", avatar: avatar("photo-1600180758890-6b94519a8ba6")},
      %{name: "Quinn Walker", title: "Director of Operations", avatar: avatar("photo-1584999734482-0361aecad844")},
      %{name: "Rachel King", title: "Director of Marketing", avatar: avatar("photo-1502031882019-24c0bccfffc6")},
      %{name: "Samuel Wright", title: "Director of Finance", avatar: avatar("photo-1702449269565-8bbe32972f65")},
      %{name: "Tina Scott", title: "Director of Customer Support", avatar: avatar("photo-1700248356502-ca48ae3bafd6")},
      %{name: "Walter Baker", title: "Lead Software Engineer", avatar: avatar("photo-1521341957697-b93449760f30")},
    ]

    employees |> Enum.reduce(context, fn attrs, context -> add_person(context, attrs) end)
  end

  def set_owner_avatar(context) do
    Map.put(context, :owner, set_avatar(context.owner, avatar("photo-1531265180709-e9b5fb594ca6")))
  end

  def avatar(source) do
    "https://images.unsplash.com/#{source}?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
  end

  defp add_person(context, attrs) do
    {:ok, invitation} = Operately.Operations.CompanyMemberAdding.run(context.owner, %{
      full_name: attrs.name,
      email: create_email(context, attrs),
      title: attrs.title,
    })

    person = Operately.Repo.preload(invitation, :member).member
    person = set_avatar(person, attrs.avatar)

    people = Map.get(context, :people, [])
    Map.put(context, :people, [person | people])
  end

  defp set_avatar(person, url) do
    {:ok, person} = Operately.People.update_person(person, %{avatar_url: url})
    person
  end

  defp create_email(context, attrs) do
    email_handle = String.replace(attrs.name, " ", "-") <> "-" <> context.company.short_id
    "#{email_handle}@acmeinc.com"
  end
end

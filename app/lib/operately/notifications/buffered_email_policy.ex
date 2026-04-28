defmodule Operately.Notifications.BufferedEmailPolicy do
  @default_email_preference :buffered
  @deafult_buffer_window 5
  @bypass_actions [
    "guest_invited",
    "company_member_added",
    "company_member_removed",
    "company_member_restoring",
    "company_member_converted_to_guest",
    "company_admin_added",
    "company_admin_removed",
    "company_owners_adding",
    "company_owner_removing",
    "company_members_permissions_edited",
    "space_members_added",
    "space_member_removed",
    "space_members_permissions_edited",
    "space_permissions_edited",
    "project_contributor_addition",
    "project_contributors_addition",
    "project_contributor_removed",
    "project_contributor_edited",
    "project_permissions_edited"
  ]

  def email_preference, do: @default_email_preference
  def email_preference(%Operately.People.Person{} = person), do: Operately.People.Person.email_preference(person) || @default_email_preference

  def buffer_window_minutes, do: @deafult_buffer_window
  def buffer_window_minutes(%Operately.People.Person{} = person), do: Operately.People.Person.email_window_minutes(person) || @deafult_buffer_window

  def buffered?(%Operately.People.Person{} = person), do: email_preference(person) == :buffered
  def notify_on_mention?(%Operately.People.Person{} = person), do: Operately.People.Person.notify_on_mention?(person)

  def bypass_actions, do: @bypass_actions

  def bypass_action?(action) when is_atom(action), do: bypass_action?(Atom.to_string(action))
  def bypass_action?(action) when is_binary(action), do: action in @bypass_actions

  def bufferable_action?(action), do: not bypass_action?(action)
end

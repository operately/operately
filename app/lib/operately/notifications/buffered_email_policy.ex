defmodule Operately.Notifications.BufferedEmailPolicy do
  @feature_name "buffered_notifications"
  @buffer_window_minutes 5
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

  def feature_name, do: @feature_name

  def buffer_window_minutes, do: @buffer_window_minutes

  def buffer_window_seconds, do: @buffer_window_minutes * 60

  def bypass_actions, do: @bypass_actions

  def bypass_action?(action) when is_atom(action), do: bypass_action?(Atom.to_string(action))
  def bypass_action?(action) when is_binary(action), do: action in @bypass_actions

  def bufferable_action?(action), do: not bypass_action?(action)

  def enabled?(%Operately.Companies.Company{} = company) do
    Operately.Companies.has_experimental_feature?(company, feature_name())
  end
end

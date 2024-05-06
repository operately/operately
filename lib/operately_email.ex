defmodule OperatelyEmail do

  def sender(company), do: {sender_name(company), notification_email_address()}
  def sender_name(company), do: "Operately (#{company.name})"
  def notification_email_address(), do: Application.get_env(:operately, :notification_email)

  # URls used in emails

  def app_url(), do: OperatelyWeb.Endpoint.url()
  def project_url(project_id), do: app_url() <> "/projects/#{project_id}"
  def project_review_url(project_id, review_id), do: app_url() <> "/projects/#{project_id}/reviews/#{review_id}"
  def project_review_request_url(project_id, request_id), do: app_url() <> "/projects/#{project_id}/reviews/request/#{request_id}"
  def project_check_in_new_url(project_id), do: app_url() <> "/projects/#{project_id}/check-ins/new"
  def project_check_in_url(project_id, check_in_id), do: app_url() <> "/projects/#{project_id}/check-ins/#{check_in_id}"
  def project_discussion_url(project_id, discussion_id), do: app_url() <> "/projects/#{project_id}/discussions/#{discussion_id}"
  def project_milestone_url(project_id, milestone_id), do: app_url() <> "/projects/#{project_id}/milestones/#{milestone_id}"
  def project_retrospective_url(project_id), do: app_url() <> "/projects/#{project_id}/retrospective"
  def goal_url(goal_id), do: app_url() <> "/goals/#{goal_id}"
  def goal_check_in_url(goal_id, check_in_id), do: app_url() <> "/goals/#{goal_id}/check-ins/#{check_in_id}"
  def goal_new_check_in_url(goal_id), do: app_url() <> "/goals/#{goal_id}/check-ins/new"
  def goal_activity_url(goal_id, activity_id), do: app_url() <> "/goals/#{goal_id}/activities/#{activity_id}"
  def discussion_url(space_id, discussion_id), do: app_url() <> "/spaces/#{space_id}/discussions/#{discussion_id}"
end

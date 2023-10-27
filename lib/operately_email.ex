defmodule OperatelyEmail do

  def sender(company), do: {sender_name(company), notification_email_address()}
  def sender_name(company), do: "Operately (#{company.name})"
  def notification_email_address(), do: Application.get_env(:operately, :notification_email)

  # URls used in emails

  def app_url(), do: OperatelyWeb.Endpoint.url()
  def project_url(project_id), do: app_url() <> "/projects/#{project_id}"
  def project_review_url(project_id, review_id), do: app_url() <> "/projects/#{project_id}/reviews/#{review_id}"
  def project_review_request_url(project_id, request_id), do: app_url() <> "/projects/#{project_id}/reviews/request/#{request_id}"
  def project_status_update_url(project_id, status_update_id), do: app_url() <> "/projects/#{project_id}/status_updates/#{status_update_id}"
  def project_discussion_url(project_id, discussion_id), do: app_url() <> "/projects/#{project_id}/discussions/#{discussion_id}"

end

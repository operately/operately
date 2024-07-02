defmodule OperatelyEmail do

  def sender(company), do: {sender_name(company), notification_email_address()}
  def sender_name(company), do: "Operately (#{company.name})"
  def notification_email_address(), do: Application.get_env(:operately, :notification_email)

  # # URls used in emails

  # def project_url(company_id, project_id) do
  #   create_url([company_id, "projects", project_id])
  # end

  # def project_check_in_new_url(company_id, project_id) do 
  #   create_url([company_id, "projects", project_id, "check-ins", "new"])
  # end

  # def project_check_in_url(company_id, project_id, check_in_id) do
  #   create_url([company_id, "projects", project_id, "check-ins", check_in_id])
  # end

  # def project_discussion_url(company_id, project_id, discussion_id) do
  #   create_url([company_id, "projects", project_id, "discussions", discussion_id])
  # end

  # def project_milestone_url(company_id, project_id, milestone_id) do
  #   create_url([company_id, "projects", project_id, "milestones", milestone_id])
  # end

  # def project_retrospective_url(company_id, project_id) do
  #   create_url([company_id, "projects", project_id, "retrospective"])
  # end

  # def goal_url(company_id, goal_id) do
  #   create_url([company_id, "goals", goal_id])
  # end

  # def goal_check_in_url(company_id, goal_id, check_in_id) do
  #   create_url([company_id, "goals", goal_id, "check-ins", check_in_id])
  # end
  
  # def goal_new_check_in_url(company_id, goal_id) do
  #   create_url([company_id, "goals", goal_id, "check-ins", "new"])
  # end

  # def goal_activity_url(company_id, goal_id, activity_id) do
  #   create_url([company_id, "goals", goal_id, "activities", activity_id])
  # end

  # def discussion_url(company_id, space_id, discussion_id) do
  #   create_url([company_id, "spaces", space_id, "discussions", discussion_id])
  # end

  # defp app_url(), do: OperatelyWeb.Endpoint.url()
  # defp create_url(parts), do: app_url() <> "/" <> Enum.join(parts, "/")
end

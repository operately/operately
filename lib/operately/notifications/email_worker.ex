defmodule Operately.Notifications.EmailWorker do
  use Oban.Worker

  def perform(job) do
    notification_id = job.args["notification_id"]
    notification = Operately.Notifications.get_notification!(notification_id)
    person = Operately.People.get_person!(notification.person_id)
    activity = Operately.Activities.get_activity!(notification.activity_id)

    case activity.action do
      "project_discussion_submitted" ->
        OperatelyEmail.ProjectDiscussionSubmittedEmail.send(person, activity)
      _ ->
        raise "Unknown activity action: #{activity.action}"
    end
  end
end

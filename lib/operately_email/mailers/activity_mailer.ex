defmodule OperatelyEmail.Mailers.ActivityMailer do
  alias Operately.People.Person

  alias OperatelyEmail.Mailers.NotificationMailer, as: NotificationMailer

  defdelegate new(company), to: NotificationMailer
  defdelegate to(email, person), to: NotificationMailer
  defdelegate render(email, template), to: NotificationMailer
  defdelegate assign(email, key, value), to: NotificationMailer

  def subject(email, who: who, action: action) do
    NotificationMailer.subject(email, "#{Person.short_name(who)} #{action}")
  end
end

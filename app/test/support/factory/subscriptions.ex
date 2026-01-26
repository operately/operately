defmodule Operately.Support.Factory.Subscriptions do
  import Operately.NotificationsFixtures

  def add_subscription(ctx, testid, parent_name, opts \\ []) do
    parent = ctx[parent_name]
    person = Keyword.get(opts, :person, ctx.creator)
    subscription_type = Keyword.get(opts, :type, :joined)
    canceled = Keyword.get(opts, :canceled, false)

    subscription =
      subscription_fixture(
        subscription_list_id: parent.subscription_list_id,
        person_id: person.id,
        type: subscription_type,
        canceled: canceled
      )

    Map.put(ctx, testid, subscription)
  end

end

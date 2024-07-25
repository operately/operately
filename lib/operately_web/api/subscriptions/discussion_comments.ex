defmodule OperatelyWeb.Api.Subscriptions.DiscussionComments do
  use TurboConnect.Subscription
  use OperatelyWeb.Api.Helpers

  def join(_name, payload, socket) do
    {:ok, discussion_id} = decode_id(payload["discussionId"])

    {:ok, socket, [discussion_id]}
  end

end

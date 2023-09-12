defmodule OperatelyEmail.UpdateEmail do
  def perform(%{update_id: update_id}) do
    update = Operately.Updates.get_update!(update_id)

  end
end

defmodule OperatelyEmail.Views.UIComponents do
  def cta_button(url, text) do
    "<a href='#{url}' style='display: inline-block; cursor: pointer; font-family: sans-serif; font-weight: 600; padding: 10px 20px; background: #16a34a; color: white; border-radius: 6px; text-decoration: none;'>#{text}</a>"
  end
end

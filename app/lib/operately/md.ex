defmodule Operately.MD do
  def render(resource) do
    Operately.MDRender.render(resource)
  end
end

defprotocol Operately.MDRender do
  def render(resource)
end

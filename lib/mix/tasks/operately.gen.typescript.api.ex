defmodule Mix.Tasks.Operately.Gen.Typescript.Api do
  def run(_) do
    content = TurboConnect.TsGen.generate(OperatelyWeb.Api)

    File.write!("assets/js/api/index.tsx", content)
  end
end

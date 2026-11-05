import { Ship } from 'lucide-react'
import { Avatar } from '../../components/Avatar'
import { useUrlsAssinadas } from '../../lib/arquivos'
import { emServico, valorIds } from '../../lib/checklist'
import { CHAVES } from '../../lib/constantes'
import { nomeMilitar } from '../../lib/militares'
import type { Cadastros, DadosDia, Militar, Viatura } from '../../lib/tipos'
import { Quadro, Vazio } from './Quadro'

export function Viaturas({ dia, cadastros }: { dia: DadosDia; cadastros: Cadastros }) {
  const militarPorId = new Map(cadastros.militares.map((militar) => [militar.id, militar]))
  const deServico = cadastros.viaturas.filter((viatura) => emServico(dia, viatura))

  const condutores = (viatura: Viatura): Militar[] =>
    valorIds(dia, CHAVES.viatura(viatura.id)).flatMap((id) => {
      const militar = militarPorId.get(id)
      return militar?.ativo ? [militar] : []
    })
  const urls = useUrlsAssinadas(deServico.flatMap((viatura) => condutores(viatura).map((militar) => militar.foto_path)))

  return (
    <Quadro titulo="Viaturas" Icone={Ship}>
      {deServico.length === 0 ? (
        <Vazio>Nenhuma viatura em serviço</Vazio>
      ) : (
        <ul className="flex flex-col gap-2">
          {deServico.map((viatura) => {
            const militares = condutores(viatura)
            return (
              <li key={viatura.id} className="rounded-xl bg-slate-50 px-3 py-2">
                <div className="flex items-center gap-3">
                  <span className="text-[1.625rem] leading-none font-black tracking-tight whitespace-nowrap">{viatura.prefixo}</span>
                  <span className="min-w-0 flex-1 truncate text-base text-slate-500">{viatura.descricao}</span>
                  <span className="shrink-0 rounded-md bg-marinho-50 px-2 py-0.5 text-sm font-bold tracking-wider text-marinho-700 ring-1 ring-marinho-700/20">
                    {viatura.base}
                  </span>
                </div>
                {militares.length > 0 ? (
                  <ul className="mt-1.5 flex flex-col gap-1.5">
                    {militares.map((militar) => (
                      <li key={militar.id} className="flex items-center gap-2.5">
                        <Avatar
                          militar={militar}
                          url={militar.foto_path ? urls[militar.foto_path] : undefined}
                          className="size-8 rounded-full text-xs"
                        />
                        <span className="min-w-0 flex-1 truncate text-[1.375rem] leading-tight font-semibold">{nomeMilitar(militar)}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="mt-1 text-[1.375rem] leading-tight text-slate-400">Sem condutor</div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </Quadro>
  )
}
